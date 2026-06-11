import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/server/firebase-admin'
import { SESSION_COOKIE_NAME } from '@/lib/server/auth'

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000

const SessionSchema = z.object({
  idToken: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const parsed = SessionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 422 })
  }

  try {
    const { idToken } = parsed.data
    await adminAuth().verifyIdToken(idToken)
    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    })

    const response = NextResponse.json({ status: 'ok' })
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.delete(SESSION_COOKIE_NAME)
  return response
}
