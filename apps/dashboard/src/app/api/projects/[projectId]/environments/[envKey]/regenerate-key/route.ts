import { NextResponse, type NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import type { Environment } from '@flagbase/types'
import { getOwnedProject, requireAuth } from '@/lib/server/auth'
import { adminDb } from '@/lib/server/firebase-admin'
import { projectDoc, environmentDoc } from '@/lib/server/db'

type RouteContext = { params: Promise<{ projectId: string; envKey: string }> }

function generateApiKey(): string {
  return `fb_${randomBytes(24).toString('hex')}`
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { projectId, envKey } = await params
  const project = await getOwnedProject(projectId, auth.user.uid)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const environments = (project.data()?.environments as Environment[] | undefined) ?? []
  if (!environments.some((e) => e.key === envKey)) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }

  const apiKey = generateApiKey()
  const updatedEnvironments = environments.map((e) =>
    e.key === envKey ? { ...e, apiKey } : e
  )

  const batch = adminDb().batch()
  batch.update(environmentDoc(projectId, envKey), { apiKey })
  batch.update(projectDoc(projectId), {
    environments: updatedEnvironments,
    updatedAt: new Date().toISOString(),
  })
  await batch.commit()

  return NextResponse.json({ apiKey })
}
