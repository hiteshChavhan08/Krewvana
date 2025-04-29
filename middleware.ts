// middleware.ts (at the root level or in src/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the sign-in page URL (adjust if yours is different)
const SIGNIN_URL = '/auth/signin';

export async function middleware(request: NextRequest) {
  // The matcher already ensures this middleware only runs for paths starting with /app
  // So, we just need to check for the token.

  // Ensure NEXTAUTH_SECRET is set in your environment variables
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // If no token exists, redirect to the sign-in page
  if (!token) {
    const redirectUrl = new URL(SIGNIN_URL, request.url);
    // Add the original requested path as callbackUrl for redirection after login
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If token exists, allow the request to proceed to the intended /app/... page
  return NextResponse.next();
}

// Configuration for the matcher
export const config = {
  // Apply this middleware ONLY to routes starting with '/app/'
  // The '/:path*' part matches '/app' itself and any sub-paths like '/app/dashboard', '/app/settings/profile', etc.
  matcher: ['/app/:path*'],
};