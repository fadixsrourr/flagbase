import { NextResponse, type NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { CreateProjectSchema, type Environment, type Project } from '@flagbase/types'
import { requireAuth } from '@/lib/server/auth'
import { adminDb } from '@/lib/server/firebase-admin'
import { projectsCollection } from '@/lib/server/db'

function generateApiKey(): string {
  return `fb_${randomBytes(24).toString('hex')}`
}

function buildEnvironments(createdAt: string): Environment[] {
  return [
    { id: 'development', key: 'development', name: 'Development', apiKey: generateApiKey(), createdAt },
    { id: 'staging', key: 'staging', name: 'Staging', apiKey: generateApiKey(), createdAt },
    { id: 'production', key: 'production', name: 'Production', apiKey: generateApiKey(), createdAt },
  ]
}

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const snapshot = await projectsCollection().where('ownerId', '==', auth.user.uid).get()
  const projects = snapshot.docs.map((doc) => doc.data())
  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const parsed = CreateProjectSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const now = new Date().toISOString()
  const projectRef = projectsCollection().doc()
  const environments = buildEnvironments(now)

  const project: Project = {
    id: projectRef.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    ownerId: auth.user.uid,
    environments,
    createdAt: now,
    updatedAt: now,
  }

  const batch = adminDb().batch()
  batch.set(projectRef, project)
  for (const env of environments) {
    batch.set(projectRef.collection('environments').doc(env.key), env)
  }
  await batch.commit()

  return NextResponse.json({ project }, { status: 201 })
}
