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
 * Parse a YouTube video URL and return format information
 */
export async function parseYouTubeVideo(url: string): Promise<ParseResponse> {
  const cleanUrl = cleanYouTubeUrl(url);

  // In development, call yt-dlp directly (no Python API server needed)
  if (process.env.NODE_ENV === 'development') {
    return parseViaChildProcess(cleanUrl);
  }

  // In production (Vercel), call the Python serverless function
  return parseViaApi(cleanUrl);
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

  const stdout = execSync(`python ${args.map(a => `"${a}"`).join(' ')}`, {
    encoding: 'utf-8',
    timeout: 60000,
  });

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
    const res = await fetch(`${apiBase}/api/parse_youtube`, {
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
      throw new Error(errorMessage);
    }

    return res.json();
  };

  try {
    return await doFetch();
  } catch (firstError) {
    console.warn('[parseViaApi] First attempt failed, retrying...', firstError);
    return await doFetch();
  }
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

    formats.push({
      format_id: String(f.format_id || ''),
      quality,
      ext: f.ext || 'mp4',
      filesize: f.filesize || f.filesize_approx || null,
      note,
      url: dlUrl,
    });
  }

  return {
    platform: 'youtube',
    video_id: info.id || '',
    title: info.title || 'Untitled',
    author: info.uploader || info.channel || null,
    thumbnail_url: info.thumbnail || null,
    duration_seconds: info.duration || null,
    formats,
  };
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
