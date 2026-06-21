import { NextResponse, type NextRequest } from 'next/server'

// Kept in sync with SESSION_COOKIE_NAME in lib/server/auth.ts. The proxy runs
// in the edge runtime and cannot import the Admin SDK, so this is duplicated
// rather than shared.
const SESSION_COOKIE_NAME = '__session'

// Edge-side gate (Next.js `proxy` convention): only checks for cookie *presence*
// to redirect unauthenticated page navigations to /login. The cookie's
// cryptographic validity is verified in every API route via verifySessionCookie
// — the proxy is UX, not the authorization boundary.
export function proxy(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value)
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
