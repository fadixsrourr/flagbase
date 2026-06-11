import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = '__session'

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
