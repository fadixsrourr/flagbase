/**
 * Bridges the client Firebase session to the server-side session cookie that
 * API routes and middleware read. The ID token never touches localStorage.
 */
export async function createSession(idToken: string): Promise<void> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('Failed to create session')
}

export async function clearSession(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' })
}
