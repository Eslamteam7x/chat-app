import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];

  if (!token && !publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (token && publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)'],
};
