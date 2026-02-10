"""
Video Download — Vercel Python Serverless Function

Uses yt-dlp to download a specific format of a video.
Returns the raw video bytes so the Node.js Server Action can upload to R2.
Called internally by proxyDownloadFormat().
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Verify internal call
        secret = os.environ.get('INTERNAL_API_SECRET', '')
        if secret and self.headers.get('X-Internal-Secret', '') != secret:
            self._json_error(403, 'Forbidden')
            return

        # Parse request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length))
        url = body.get('url', '')
        format_id = body.get('format_id', '')

        if not url or not format_id:
            self._json_error(400, 'Missing url or format_id')
            return

        try:
            data = self._download_format(url, format_id)
            # Return raw binary
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self._json_error(500, str(e))

    def _download_format(self, url: str, format_id: str) -> bytes:
        import yt_dlp

        # Download to temp file
        tmp = tempfile.mktemp(suffix='.download')

        ydl_opts = {
            'format': format_id,
            'outtmpl': tmp + '.%(ext)s',
            'quiet': True,
            'no_warnings': True,
            'no_check_certificates': True,
            'noplaylist': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the downloaded file (extension may vary)
        import glob
        matches = glob.glob(tmp + '.*')
        if not matches:
            raise RuntimeError('yt-dlp produced no output file')

        out_path = matches[0]
        with open(out_path, 'rb') as f:
            data = f.read()

        # Cleanup
        os.unlink(out_path)

        return data

    def _json_error(self, status: int, message: str):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode())

    def log_message(self, format, *args):
        """Suppress default access logs."""
        pass
