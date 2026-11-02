import { NextRequest, NextResponse } from 'next/server';

// Edge-compatible HMAC verification using Web Crypto API
async function verifySessionEdge(token: string, secret: string): Promise<boolean> {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return false;

    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    // Re-compute expected signature
    const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    if (sig !== expectedSig) return false;

    // Verify expiry
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (Date.now() - payload.iat > 24 * 60 * 60 * 1000) return false;

    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page through without checking session
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const cookieName = process.env.ADMIN_COOKIE_NAME ?? 'admin_session';
  const secret = process.env.ADMIN_SECRET ?? '';
  const token = request.cookies.get(cookieName)?.value;

  if (!token || !(await verifySessionEdge(token, secret))) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only protect /admin/* -- API route protection is handled per-handler via requireAdminSession()
  matcher: ['/admin/:path*'],
};
