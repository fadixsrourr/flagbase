import { NextResponse, type NextRequest } from 'next/server'
import type { AuditLogEntry } from '@flagbase/types'
import { getOwnedProject, requireAuth } from '@/lib/server/auth'
import { auditCollection, flagsCollection } from '@/lib/server/db'

type RouteContext = { params: Promise<{ projectId: string; envKey: string }> }

const PER_FLAG_LIMIT = 50
const TOTAL_LIMIT = 100

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey } = await params
  if (!(await getOwnedProject(projectId, auth.user.uid))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const flagsSnapshot = await flagsCollection(projectId, envKey).get()
  const auditSnapshots = await Promise.all(
    flagsSnapshot.docs.map((doc) =>
      auditCollection(projectId, envKey, doc.id)
        .orderBy('performedAt', 'desc')
        .limit(PER_FLAG_LIMIT)
        .get()
    )
  )

  const entries = auditSnapshots
    .flatMap((snapshot) => snapshot.docs.map((doc) => doc.data() as AuditLogEntry))
    .sort((a, b) => (a.performedAt < b.performedAt ? 1 : -1))
    .slice(0, TOTAL_LIMIT)

  return NextResponse.json({ entries })
}
