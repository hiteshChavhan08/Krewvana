// middleware.ts (or src/middleware.ts)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Specify protected and public paths
// NOTE: Adjust these paths based on your actual application structure
const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    '/learning',
    '/innovation',
    '/wellness',
    '/collaboration',
    '/recognition', // Assuming the main feed requires login
    '/rewards',     // Assuming the main rewards page requires login
    // Add other specific paths that require authentication
];

const publicPaths = [
    '/login',
    '/register', // If you have a registration page
    // Add any other public pages like '/', '/about', '/contact' if they exist
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 2. Get the session cookie value
    //    -> Default cookie name for NextAuth is '__Secure-next-auth.session-token' or 'next-auth.session-token'
    //    -> Check your browser's developer tools -> Application -> Cookies for the exact name.
    //    -> Or if you customized it in authOptions, use that name.
    const sessionCookie =
        request.cookies.get('__Secure-next-auth.session-token') ??
        request.cookies.get('next-auth.session-token');
    const isLoggedIn = !!sessionCookie; // Check if the cookie exists

    // 3. Determine if the current path is protected
    //    -> Check if the pathname starts with any of the protectedPaths prefixes
    const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

    // 4. Redirect logic
    //    -> If trying to access a protected route without logging in
    if (isProtectedPath && !isLoggedIn) {
        // Redirect to login page, appending the attempted URL as callbackUrl
        const loginUrl = new URL('/login', request.url); // Construct URL relative to request
        loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search); // Keep query params
        console.log(`Middleware: Unauthorized access to ${pathname}. Redirecting to ${loginUrl.toString()}`);
        return NextResponse.redirect(loginUrl);
    }

    //    -> If trying to access the login/register page while already logged in
    if (publicPaths.includes(pathname) && isLoggedIn && (pathname === '/login' || pathname === '/register')) {
        // Redirect logged-in users away from login/register to the dashboard
        const dashboardUrl = new URL('/dashboard', request.url);
        console.log(`Middleware: Logged-in user accessed ${pathname}. Redirecting to ${dashboardUrl.toString()}`);
        return NextResponse.redirect(dashboardUrl);
    }

    // 5. Allow the request to proceed if none of the above conditions are met
    return NextResponse.next();
}

// 6. Configure the matcher to specify which routes the middleware should run on.
//    -> This is generally MORE performant than checking paths inside the function.
//    -> Avoid running middleware on static assets and API routes needed for auth.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth authentication routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Any paths with extensions (likely assets)
         *
         * Adjust this pattern carefully based on your needs!
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
};