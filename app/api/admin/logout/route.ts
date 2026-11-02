import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieName = process.env.ADMIN_COOKIE_NAME ?? 'admin_session';
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
