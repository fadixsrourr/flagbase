import { cookies } from 'next/headers'
import type { DecodedIdToken } from 'firebase-admin/auth'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { adminAuth } from './firebase-admin'
import { projectDoc } from './db'

export const SESSION_COOKIE_NAME = '__session'

export async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null

  try {
    return await adminAuth().verifySessionCookie(sessionCookie, true)
  } catch {
    return null
  }
}

type AuthResult =
  | { user: DecodedIdToken; error: null }
  | { user: null; error: 'Unauthorized'; status: 401 }

export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { user: null, error: 'Unauthorized', status: 401 }
  }
  return { user, error: null }
}

/**
 * Returns the project document only if it exists and is owned by the user.
 * The Admin SDK bypasses Firestore security rules, so ownership must be
 * enforced in every route that touches a project or its subcollections.
 */
export async function getOwnedProject(
  projectId: string,
  uid: string
): Promise<DocumentSnapshot | null> {
  const snapshot = await projectDoc(projectId).get()
  if (!snapshot.exists || snapshot.data()?.ownerId !== uid) return null
  return snapshot
}
