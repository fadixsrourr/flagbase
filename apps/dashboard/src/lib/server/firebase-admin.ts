import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

/**
 * Lazily initializes the Admin SDK on first use. Deferring initialization keeps
 * module import side-effect free, so the app builds without credentials present
 * and only requires them when a request actually touches Firebase.
 */
function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp())
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp())
}
