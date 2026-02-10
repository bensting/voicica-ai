/**
 * YouTube Video Parser Service (Server-side only)
 *
 * Production (Vercel): calls internal Python API (yt-dlp)
 * Development: calls yt-dlp directly via child_process
 */

import type { ParseResponse, VideoFormat } from '@/actions/video-downloader';

/**
 * Clean YouTube URL: strip playlist/radio params, keep only the video
 */
function cleanYouTubeUrl(url: string): string {
  try {
    const u = new URL(url);
    // For standard watch URLs, keep only 'v' param
    if (u.pathname === '/watch') {
      const videoId = u.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
    // For youtu.be, shorts, embed — strip query params
    u.searchParams.delete('list');
    u.searchParams.delete('start_radio');
    u.searchParams.delete('index');
    u.searchParams.delete('si');
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Parse any supported video URL and return format information
 */
export async function parseVideo(url: string, platform: string): Promise<ParseResponse> {
  // Only clean YouTube URLs (strip playlist params etc.)
  const cleanUrl = platform === 'youtube' ? cleanYouTubeUrl(url) : url;

  // In development, call yt-dlp directly (no Python API server needed)
  if (process.env.NODE_ENV === 'development') {
    return parseViaChildProcess(cleanUrl);
  }

  // In production (Vercel), call the Python serverless function
  return parseViaApi(cleanUrl);
}

/**
 * Parse a YouTube video URL (legacy wrapper)
 */
export async function parseYouTubeVideo(url: string): Promise<ParseResponse> {
  return parseVideo(url, 'youtube');
}

/**
 * Development: call yt-dlp directly via child_process
 */
async function parseViaChildProcess(url: string): Promise<ParseResponse> {
  const { execSync } = await import('child_process');

  const args = [
    '-m', 'yt_dlp',
    '--dump-json',
    '--no-download',
    '--no-warnings',
    '--no-check-certificates',
    '--no-playlist',
    url,
  ];

  let stdout: string;
  try {
    stdout = execSync(`python ${args.map(a => `"${a}"`).join(' ')}`, {
      encoding: 'utf-8',
      timeout: 60000,
    });
  } catch (e) {
    // yt-dlp exits non-zero when it can't extract (e.g. photo-only post)
    const stderr = (e as { stderr?: string }).stderr || '';
    if (stderr.includes('Unsupported URL') || stderr.includes('no video')) {
      throw new Error('NO_VIDEO_FOUND');
    }
    throw e;
  }

  if (!stdout?.trim()) {
    throw new Error('NO_VIDEO_FOUND');
  }

  const info = JSON.parse(stdout);
  return mapYtdlpInfo(info);
}

/**
 * Production: call Python API on Vercel (with 1 retry on failure)
 */
async function parseViaApi(url: string): Promise<ParseResponse> {
  const apiBase = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const doFetch = async (): Promise<ParseResponse> => {
    const res = await fetch(`${apiBase}/api/parse_video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      let errorMessage = 'Failed to parse video';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // ignore
      }
      // Detect "no video" errors from the Python API
      if (errorMessage.toLowerCase().includes('unsupported url') || errorMessage.toLowerCase().includes('no video')) {
        throw new Error('NO_VIDEO_FOUND');
      }
      throw new Error(errorMessage);
    }

    const data: ParseResponse = await res.json();
    // If yt-dlp returned metadata but zero downloadable formats, treat as no video
    if (!data.formats || data.formats.length === 0) {
      throw new Error('NO_VIDEO_FOUND');
    }
    return data;
  };

  try {
    return await doFetch();
  } catch (firstError) {
    console.warn('[parseViaApi] First attempt failed, retrying...', firstError);
    return await doFetch();
  }
}

/**
 * Map yt-dlp extractor_key to our platform name
 */
function extractorToPlatform(extractorKey: string): string {
  const key = extractorKey.toLowerCase();
  if (key.includes('youtube')) return 'youtube';
  if (key.includes('tiktok')) return 'tiktok';
  if (key.includes('instagram')) return 'instagram';
  if (key.includes('twitter') || key.includes('x')) return 'twitter';
  if (key.includes('facebook') || key.includes('fb')) return 'facebook';
  return extractorKey.toLowerCase() || 'unknown';
}

/**
 * Map yt-dlp JSON output to our ParseResponse format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapYtdlpInfo(info: any): ParseResponse {
  const formats: VideoFormat[] = [];

  for (const f of (info.formats || [])) {
    const dlUrl = f.url;
    if (!dlUrl) continue;

    const hasVideo = (f.vcodec || 'none') !== 'none';
    const hasAudio = (f.acodec || 'none') !== 'none';

    let note: string;
    if (hasVideo && hasAudio) {
      note = 'video with audio';
    } else if (hasVideo) {
      note = 'video only';
    } else if (hasAudio) {
      note = 'audio only';
    } else {
      continue;
    }

    // Build quality label with codec info
    let quality = f.format_note || f.resolution || 'unknown';
    if (hasVideo) {
      const codec = shortCodec(f.vcodec);
      if (codec) quality = `${quality} ${codec}`;
    } else if (hasAudio) {
      const codec = shortCodec(f.acodec);
      const abr = f.abr;
      if (abr) {
        quality = `${Math.round(abr)}kbps`;
        if (codec) quality = `${quality} ${codec}`;
      }
    }

    // 非 YouTube 平台保留 http_headers（防盗链）
    const platform = extractorToPlatform(info.extractor_key || info.extractor || '');
    const httpHeaders = platform !== 'youtube' ? (f.http_headers || null) : null;

    formats.push({
      format_id: String(f.format_id || ''),
      quality,
      ext: f.ext || 'mp4',
      filesize: f.filesize || f.filesize_approx || null,
      note,
      url: dlUrl,
      http_headers: httpHeaders,
    });
  }

  // Proxy thumbnails from platforms that block direct browser access
  let thumbnailUrl: string | null = info.thumbnail || null;
  if (thumbnailUrl) {
    try {
      const host = new URL(thumbnailUrl).hostname;
      if (host.endsWith('cdninstagram.com') || host.endsWith('fbcdn.net')) {
        thumbnailUrl = `/api/image-proxy?url=${encodeURIComponent(thumbnailUrl)}`;
      }
    } catch {
      // keep original
    }
  }

  return {
    platform: extractorToPlatform(info.extractor_key || info.extractor || ''),
    video_id: info.id || '',
    title: info.title || 'Untitled',
    author: info.uploader || info.channel || null,
    thumbnail_url: thumbnailUrl,
    duration_seconds: info.duration || null,
    formats,
  };
}

/**
 * Download a specific format using yt-dlp
 * Used for platforms with IP-locked CDNs (TikTok etc.)
 * yt-dlp re-negotiates the download session, getting fresh CDN URLs for the current IP.
 */
export async function downloadVideoFormat(url: string, formatId: string): Promise<Buffer> {
  if (process.env.NODE_ENV === 'development') {
    return downloadFormatLocal(url, formatId);
  }
  return downloadFormatViaApi(url, formatId);
}

/**
 * Local dev: download via yt-dlp child_process, pipe to stdout
 */
async function downloadFormatLocal(url: string, formatId: string): Promise<Buffer> {
  const { execSync } = await import('child_process');

  const args = [
    '-m', 'yt_dlp',
    '-f', formatId,
    '-o', '-',
    '--quiet',
    '--no-warnings',
    '--no-check-certificates',
    '--no-playlist',
    url,
  ];

  console.log(`🎬 [downloadFormatLocal] yt-dlp -f ${formatId} "${url}"`);

  const buffer = execSync(`python ${args.map(a => `"${a}"`).join(' ')}`, {
    timeout: 120000,
    maxBuffer: 100 * 1024 * 1024, // 100MB
  });

  console.log(`✅ [downloadFormatLocal] Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
  return buffer;
}

/**
 * Production: call Python serverless endpoint to download via yt-dlp
 */
async function downloadFormatViaApi(url: string, formatId: string): Promise<Buffer> {
  const apiBase = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const res = await fetch(`${apiBase}/api/download_video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
    },
    body: JSON.stringify({ url, format_id: formatId }),
  });

  if (!res.ok) {
    let errorMessage = 'Download failed';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Map codec string to short display name
 */
function shortCodec(codec: string | undefined): string {
  if (!codec || codec === 'none') return '';
  const c = codec.toLowerCase();
  if (c.startsWith('avc1') || c.startsWith('h264')) return 'H264';
  if (c.startsWith('vp9') || c.startsWith('vp09')) return 'VP9';
  if (c.startsWith('av01') || c === 'av1') return 'AV1';
  if (c.startsWith('mp4a') || c === 'aac') return 'AAC';
  if (c.startsWith('opus')) return 'Opus';
  return '';
}
