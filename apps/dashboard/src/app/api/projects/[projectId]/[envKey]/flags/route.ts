import { NextResponse, type NextRequest } from 'next/server'
import { CreateFlagSchema, type Flag } from '@flagbase/types'
import { getOwnedProject, requireAuth } from '@/lib/server/auth'
import { flagsCollection } from '@/lib/server/db'
import { writeAuditLog } from '@/lib/server/audit'

type RouteContext = { params: Promise<{ projectId: string; envKey: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey } = await params
  if (!(await getOwnedProject(projectId, auth.user.uid))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const snapshot = await flagsCollection(projectId, envKey).get()
  const flags = snapshot.docs.map((doc) => doc.data())
  return NextResponse.json({ flags })
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey } = await params
  if (!(await getOwnedProject(projectId, auth.user.uid))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const parsed = CreateFlagSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const now = new Date().toISOString()
  const ref = flagsCollection(projectId, envKey).doc()
  const flag: Flag = {
    ...parsed.data,
    id: ref.id,
    createdBy: auth.user.uid,
    createdAt: now,
    updatedAt: now,
  }

  await ref.set(flag)
  await writeAuditLog(projectId, envKey, ref.id, flag.key, 'flag.created', auth.user.uid, undefined, flag)

  return NextResponse.json({ flag }, { status: 201 })
}
