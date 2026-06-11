import { NextResponse, type NextRequest } from 'next/server'
import { UpdateFlagSchema } from '@flagbase/types'
import { getOwnedProject, requireAuth } from '@/lib/server/auth'
import { flagsCollection } from '@/lib/server/db'
import { writeAuditLog } from '@/lib/server/audit'

type RouteContext = { params: Promise<{ projectId: string; envKey: string; flagId: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey, flagId } = await params
  if (!(await getOwnedProject(projectId, auth.user.uid))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const doc = await flagsCollection(projectId, envKey).doc(flagId).get()
  if (!doc.exists) return NextResponse.json({ error: 'Flag not found' }, { status: 404 })

  return NextResponse.json({ flag: doc.data() })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey, flagId } = await params
  if (!(await getOwnedProject(projectId, auth.user.uid))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const parsed = UpdateFlagSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const ref = flagsCollection(projectId, envKey).doc(flagId)
  const existing = await ref.get()
  if (!existing.exists) return NextResponse.json({ error: 'Flag not found' }, { status: 404 })

  const before = existing.data()
  const update = { ...parsed.data, updatedAt: new Date().toISOString() }
  await ref.update(update)
  await writeAuditLog(projectId, envKey, flagId, before?.key ?? '', 'flag.updated', auth.user.uid, before, update)

  return NextResponse.json({ flag: { ...before, ...update } })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey, flagId } = await params
  if (!(await getOwnedProject(projectId, auth.user.uid))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const ref = flagsCollection(projectId, envKey).doc(flagId)
  const existing = await ref.get()
  if (!existing.exists) return NextResponse.json({ error: 'Flag not found' }, { status: 404 })

  const before = existing.data()
  await ref.delete()
  await writeAuditLog(projectId, envKey, flagId, before?.key ?? '', 'flag.deleted', auth.user.uid, before, undefined)

  return new NextResponse(null, { status: 204 })
}
