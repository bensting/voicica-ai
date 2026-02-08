"""
YouTube Video Parser — Vercel Python Serverless Function

Uses yt-dlp to extract video info and streaming URLs.
Called internally by the Next.js Server Action.
"""

from http.server import BaseHTTPRequestHandler
import json
import os


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Verify internal call
        secret = os.environ.get('INTERNAL_API_SECRET', '')
        if secret and self.headers.get('X-Internal-Secret', '') != secret:
            self._json_response(403, {'error': 'Forbidden'})
            return

        # Parse request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length))
        url = body.get('url', '')

        if not url:
            self._json_response(400, {'error': 'Missing URL'})
            return

        try:
            result = self._parse_video(url)
            self._json_response(200, result)
        except Exception as e:
            self._json_response(500, {'error': str(e)})

    def _parse_video(self, url: str) -> dict:
        import yt_dlp

        proxy_url = os.environ.get('YOUTUBE_PROXY_URL', '')
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'no_check_certificates': True,
        }
        if proxy_url:
            ydl_opts['proxy'] = proxy_url

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        formats = []
        for f in (info.get('formats') or []):
            dl_url = f.get('url')
            if not dl_url:
                continue

            has_video = (f.get('vcodec') or 'none') != 'none'
            has_audio = (f.get('acodec') or 'none') != 'none'

            if has_video and has_audio:
                note = 'video with audio'
            elif has_video:
                note = 'video only'
            elif has_audio:
                note = 'audio only'
            else:
                continue

            # Build quality label
            quality = f.get('format_note') or f.get('resolution') or 'unknown'
            vcodec = f.get('vcodec') or ''
            acodec = f.get('acodec') or ''

            # Add codec info: "1080p60 H264" or "128kbps Opus"
            if has_video:
                codec = _short_codec(vcodec)
                if codec:
                    quality = f'{quality} {codec}'
            elif has_audio:
                codec = _short_codec(acodec)
                abr = f.get('abr')
                if abr:
                    quality = f'{int(abr)}kbps'
                    if codec:
                        quality = f'{quality} {codec}'

            formats.append({
                'format_id': str(f.get('format_id', '')),
                'quality': quality,
                'ext': f.get('ext', 'mp4'),
                'filesize': f.get('filesize') or f.get('filesize_approx'),
                'note': note,
                'url': dl_url,
            })

        return {
            'platform': 'youtube',
            'video_id': info.get('id', ''),
            'title': info.get('title', 'Untitled'),
            'author': info.get('uploader') or info.get('channel'),
            'thumbnail_url': info.get('thumbnail'),
            'duration_seconds': info.get('duration'),
            'formats': formats,
        }

    def _json_response(self, status: int, data: dict):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        """Suppress default access logs."""
        pass


def _short_codec(codec: str) -> str:
    """Map codec string to short name."""
    if not codec or codec == 'none':
        return ''
    c = codec.lower()
    if c.startswith('avc1') or c.startswith('h264'):
        return 'H264'
    if c.startswith('vp9') or c.startswith('vp09'):
        return 'VP9'
    if c.startswith('av01') or c == 'av1':
        return 'AV1'
    if c.startswith('mp4a') or c == 'aac':
        return 'AAC'
    if c.startswith('opus'):
        return 'Opus'
    return ''
