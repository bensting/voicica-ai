/**
 * YouTube Video Parser Service (Server-side only)
 *
 * Uses youtubei.js (InnerTube API) with residential proxy to parse YouTube videos.
 * Replaces the old tools-api.voicica.ai backend dependency.
 */

import Innertube from 'youtubei.js';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import type { ParseResponse, VideoFormat } from '@/actions/video-downloader';

// Residential proxy URL from environment variable
const PROXY_URL = process.env.YOUTUBE_PROXY_URL;

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/v\/)([\w-]{11})/,
    /(?:m\.youtube\.com\/watch\?.*v=)([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Infer file extension from MIME type
 */
function inferExtension(mimeType: string | undefined): string {
  if (!mimeType) return 'mp4';
  if (mimeType.includes('video/mp4')) return 'mp4';
  if (mimeType.includes('video/webm')) return 'webm';
  if (mimeType.includes('audio/mp4')) return 'm4a';
  if (mimeType.includes('audio/webm')) return 'webm';
  if (mimeType.includes('audio/opus')) return 'opus';
  return 'mp4';
}

/**
 * Extract short codec name from MIME type
 * e.g. "video/mp4; codecs=\"avc1.640028\"" → "H264"
 */
function extractCodec(mimeType: string | undefined): string {
  if (!mimeType) return '';
  const codecMatch = mimeType.match(/codecs="([^"]+)"/);
  if (!codecMatch) return '';
  const codec = codecMatch[1].toLowerCase();
  if (codec.startsWith('avc1')) return 'H264';
  if (codec.startsWith('vp9') || codec.startsWith('vp09')) return 'VP9';
  if (codec.startsWith('av01')) return 'AV1';
  if (codec.startsWith('mp4a')) return 'AAC';
  if (codec.startsWith('opus')) return 'Opus';
  return '';
}

/**
 * Generate a descriptive note for a format
 */
function generateNote(hasVideo: boolean, hasAudio: boolean): string {
  if (hasVideo && hasAudio) return 'video with audio';
  if (hasVideo) return 'video only';
  if (hasAudio) return 'audio only';
  return '';
}

/**
 * Create a fetch function with optional proxy support
 */
function createProxyFetch() {
  if (!PROXY_URL) {
    return undefined; // Use default fetch
  }

  const agent = new ProxyAgent(PROXY_URL);

  // youtubei.js passes Request objects; undici doesn't handle them natively,
  // so we extract url + init from the Request before forwarding.
  return (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string | URL;
    let mergedInit: RequestInit | undefined = init;

    if (input instanceof Request) {
      url = input.url;
      mergedInit = {
        method: input.method,
        headers: Object.fromEntries(input.headers.entries()),
        body: input.body,
        ...init,
      };
    } else {
      url = input;
    }

    return undiciFetch(url as Parameters<typeof undiciFetch>[0], {
      ...mergedInit as Parameters<typeof undiciFetch>[1],
      dispatcher: agent,
    });
  };
}

/**
 * Parse a YouTube video URL and return format information
 */
export async function parseYouTubeVideo(url: string): Promise<ParseResponse> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL: could not extract video ID');
  }

  // Create Innertube client with optional proxy
  const proxyFetch = createProxyFetch();

  const createOptions: Parameters<typeof Innertube.create>[0] = {};
  if (proxyFetch) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createOptions.fetch = proxyFetch as any;
  }

  const innertube = await Innertube.create(createOptions);

  // Fetch from multiple clients in parallel:
  // - WEB: video details (title, author, thumbnail) + format metadata
  // - ANDROID: returns pre-signed streaming URLs (no decipher needed)
  const [webInfo, androidInfo] = await Promise.all([
    innertube.getBasicInfo(videoId, 'WEB'),
    innertube.getBasicInfo(videoId, 'ANDROID'),
  ]);

  // Build a map of itag → download URL from ANDROID client (pre-signed, no decipher)
  const androidUrls = new Map<number, string>();
  const androidData = androidInfo.streaming_data;
  if (androidData) {
    for (const fmt of [...(androidData.formats || []), ...(androidData.adaptive_formats || [])]) {
      try {
        const dUrl = await fmt.decipher(innertube.session.player);
        if (dUrl) androidUrls.set(fmt.itag, dUrl);
      } catch {
        // skip
      }
    }
  }

  // Use WEB streaming data for the full format list (better metadata)
  const streamingData = webInfo.streaming_data;
  if (!streamingData) {
    throw new Error('No streaming data available for this video');
  }

  const formats: VideoFormat[] = [];

  const allFormats = [
    ...(streamingData.formats || []),
    ...(streamingData.adaptive_formats || []),
  ];

  const seen = new Set<number>();

  for (const fmt of allFormats) {
    if (seen.has(fmt.itag)) continue;
    seen.add(fmt.itag);

    const hasVideo = fmt.has_video;
    const hasAudio = fmt.has_audio;
    const codec = extractCodec(fmt.mime_type);
    const ext = inferExtension(fmt.mime_type);

    // Build quality label: "1080p H264" or "128kbps Opus"
    let qualityLabel: string;
    if (hasVideo) {
      qualityLabel = fmt.quality_label || 'unknown';
      if (codec) qualityLabel += ` ${codec}`;
    } else if (hasAudio) {
      const bitrate = fmt.bitrate ? `${Math.round(fmt.bitrate / 1000)}kbps` : 'audio';
      qualityLabel = codec ? `${bitrate} ${codec}` : bitrate;
    } else {
      qualityLabel = 'unknown';
    }

    // Get download URL: prefer ANDROID pre-signed, then try WEB decipher
    let downloadUrl: string | null = androidUrls.get(fmt.itag) || null;
    if (!downloadUrl) {
      try {
        downloadUrl = await fmt.decipher(innertube.session.player);
      } catch {
        // skip
      }
    }

    formats.push({
      format_id: String(fmt.itag),
      quality: qualityLabel,
      ext,
      filesize: fmt.content_length ? Number(fmt.content_length) : null,
      note: generateNote(hasVideo, hasAudio),
      url: downloadUrl,
    });
  }

  // Extract video details from WEB client
  const details = webInfo.basic_info;

  return {
    platform: 'youtube',
    video_id: videoId,
    title: details.title || 'Untitled',
    author: details.author || null,
    thumbnail_url: details.thumbnail?.[0]?.url || null,
    duration_seconds: details.duration || null,
    formats,
  };
}
