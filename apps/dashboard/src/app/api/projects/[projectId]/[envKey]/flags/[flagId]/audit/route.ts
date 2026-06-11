import { NextResponse, type NextRequest } from 'next/server'
import { getOwnedProject, requireAuth } from '@/lib/server/auth'
import { auditCollection } from '@/lib/server/db'

type RouteContext = { params: Promise<{ projectId: string; envKey: string; flagId: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey, flagId } = await params
  if (!(await getOwnedProject(projectId, auth.user.uid))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const snapshot = await auditCollection(projectId, envKey, flagId)
    .orderBy('performedAt', 'desc')
    .get()
  const entries = snapshot.docs.map((doc) => doc.data())
  return NextResponse.json({ entries })
}
