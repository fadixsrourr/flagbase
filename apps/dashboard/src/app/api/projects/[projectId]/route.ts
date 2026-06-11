import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getOwnedProject, requireAuth } from '@/lib/server/auth'
import { adminDb } from '@/lib/server/firebase-admin'
import { projectDoc } from '@/lib/server/db'

const UpdateProjectSchema = z.object({
  name: z.string().min(1),
})

type RouteContext = { params: Promise<{ projectId: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId } = await params
  const project = await getOwnedProject(projectId, auth.user.uid)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ project: project.data() })
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId } = await params
  const project = await getOwnedProject(projectId, auth.user.uid)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const parsed = UpdateProjectSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const update = { ...parsed.data, updatedAt: new Date().toISOString() }
  await projectDoc(projectId).update(update)

  return NextResponse.json({ project: { ...project.data(), ...update } })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId } = await params
  const project = await getOwnedProject(projectId, auth.user.uid)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  await adminDb().recursiveDelete(projectDoc(projectId))

  return new NextResponse(null, { status: 204 })
}
