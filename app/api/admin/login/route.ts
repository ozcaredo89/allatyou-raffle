import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/app/lib/admin-auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { password } = await request.json();
    const secret = process.env.ADMIN_SECRET ?? '';

    if (!password || password !== secret) {
      return NextResponse.json({ error: 'Contrasena incorrecta' }, { status: 401 });
    }

    const token = signSession(secret);
    const cookieName = process.env.ADMIN_COOKIE_NAME ?? 'admin_session';
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 86400, // 24h
      secure: isProduction,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
