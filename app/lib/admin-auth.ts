import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function signSession(secret: string): string {
  const payload = JSON.stringify({ iat: Date.now() });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifySession(token: string, secret: string): boolean {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return false;

    // Verify signature (timing-safe)
    const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

    // Verify expiry
    const { iat } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (Date.now() - iat > MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

export function requireAdminSession(request: NextRequest): NextResponse | null {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? 'admin_session';
  const secret = process.env.ADMIN_SECRET ?? '';
  const token = request.cookies.get(cookieName)?.value;

  if (!token || !verifySession(token, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
