import { NextRequest, NextResponse } from 'next/server';

// Catch-all API proxy: forwards /api/<path>?XTransformPort=<port> to the
// matching mini-service (e.g. the Express eSM API on port 3001).
// When the request arrives through the Caddy gateway, the gateway intercepts
// ?XTransformPort and forwards directly — this route only runs for direct
// localhost:3000 access (e.g. local dev / agent-browser verification).

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, segments: string[]) {
  const url = new URL(req.url);
  const port = url.searchParams.get('XTransformPort');
  if (!port) {
    return NextResponse.json({ error: 'Missing XTransformPort' }, { status: 400 });
  }
  const targetPath = '/api/' + segments.map(encodeURIComponent).join('/');
  // rebuild query without XTransformPort
  const q = new URLSearchParams(url.searchParams);
  q.delete('XTransformPort');
  const target = `http://localhost:${port}${targetPath}${q.toString() ? '?' + q.toString() : ''}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      ...(req.headers.get('authorization') ? { Authorization: req.headers.get('authorization')! } : {}),
    },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  try {
    const res = await fetch(target, init);
    const text = await res.text();
    const headers = new Headers();
    res.headers.forEach((v, k) => { if (k.toLowerCase() !== 'transfer-encoding') headers.set(k, v); });
    return new NextResponse(text, { status: res.status, headers });
  } catch (err: any) {
    return NextResponse.json({ error: 'Upstream unreachable', detail: err.message, target }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
