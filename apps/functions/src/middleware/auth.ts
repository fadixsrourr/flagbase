import type { Request } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

/** Returns an error string if the API key is invalid, or null if valid. */
export async function verifyApiKey(
  req: Request,
  projectId: string,
  environmentKey: string
): Promise<string | null> {
  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!apiKey) return 'Missing x-api-key header'

  const envDoc = await admin
    .firestore()
    .doc(`projects/${projectId}/environments/${environmentKey}`)
    .get()

  if (!envDoc.exists) return 'Project or environment not found'
  if (envDoc.data()?.apiKey !== apiKey) return 'Invalid API key'

  return null
}
