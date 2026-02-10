/**
 * Video Proxy Worker — Cloudflare Workers
 *
 * 用于代理下载有防盗链的视频平台（TikTok、Instagram 等）
 * 接收加密的视频 URL + HTTP headers，服务端带 headers 下载并流式转发给客户端
 */

interface Env {
  API_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Api-Secret',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Verify API secret (header or query param)
    const url = new URL(request.url);
    const secret = request.headers.get('X-Api-Secret') || url.searchParams.get('secret') || '';
    if (!env.API_SECRET || secret !== env.API_SECRET) {
      return jsonResponse(403, { error: 'Forbidden' });
    }

    if (url.pathname === '/download') {
      return handleDownload(request, url);
    }

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse(200, { status: 'ok' });
    }

    return jsonResponse(404, { error: 'Not found' });
  },
} satisfies ExportedHandler<Env>;

async function handleDownload(request: Request, url: URL): Promise<Response> {
  try {
    // 支持 GET（query params）和 POST（JSON body）
    let videoUrl: string;
    let videoHeaders: Record<string, string> = {};

    if (request.method === 'POST') {
      const body = await request.json() as { url?: string; headers?: Record<string, string> };
      videoUrl = body.url || '';
      videoHeaders = body.headers || {};
    } else {
      // GET: url 和 h 都是 base64 编码
      const encodedUrl = url.searchParams.get('url') || '';
      const encodedHeaders = url.searchParams.get('h') || '';

      if (!encodedUrl) {
        return jsonResponse(400, { error: 'Missing url parameter' });
      }

      videoUrl = atob(encodedUrl);
      if (encodedHeaders) {
        try {
          videoHeaders = JSON.parse(atob(encodedHeaders));
        } catch {
          // ignore invalid headers
        }
      }
    }

    if (!videoUrl) {
      return jsonResponse(400, { error: 'Missing video URL' });
    }

    // Fetch video with original headers
    const response = await fetch(videoUrl, {
      headers: videoHeaders,
      redirect: 'follow',
    });

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: `Upstream error: ${response.status} ${response.statusText}`,
      });
    }

    // Stream the response back
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    // Content-Disposition for download
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      responseHeaders.set('Content-Disposition', contentDisposition);
    }

    return new Response(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse(500, { error: message });
  }
}

function jsonResponse(status: number, data: Record<string, unknown>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
