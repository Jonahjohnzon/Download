import { NextRequest, NextResponse } from 'next/server';

// Restrict which hosts this proxy will fetch from, to avoid becoming
// an open relay/SSRF vector for arbitrary internal or external URLs.
const ALLOWED_HOSTS = new Set([
  'trendimovies.com', // Store just the hostname
  // add specific hosts you actually intend to proxy
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const quality = searchParams.get('quality') ?? 'original';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url.' }, { status: 400 });
  }

  // Now, this check correctly compares the hostname
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    console.log(`Host not allowed: ${target.hostname}`); // Add logging for debugging
    return NextResponse.json({ error: 'Host not allowed.' }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), { method: 'GET' });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream request failed with status ${upstream.status}` },
        { status: upstream.status || 502 }
      );
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const disposition = upstream.headers.get('content-disposition');
    const suggestedName = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? 'download';
    const filename = `${suggestedName}-${quality}`.replace(/[^\w.\-]+/g, '_');

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Download proxy failed:', err);
    return NextResponse.json({ error: 'Internal server error during download.' }, { status: 500 });
  }
}
