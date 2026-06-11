import type { Request, Response } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const db = () => admin.firestore()

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
})

function generateApiKey(): string {
  return `fb_${randomBytes(24).toString('hex')}`
}

export async function projectsRouter(req: Request, res: Response) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).send('')

  try {
    if (req.method === 'POST') {
      const parsed = CreateProjectSchema.safeParse(req.body)
      if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() })

      const now = new Date().toISOString()
      const projectRef = db().collection('projects').doc()

      const environments = [
        { id: 'development', key: 'development', name: 'Development', apiKey: generateApiKey(), createdAt: now },
        { id: 'staging', key: 'staging', name: 'Staging', apiKey: generateApiKey(), createdAt: now },
        { id: 'production', key: 'production', name: 'Production', apiKey: generateApiKey(), createdAt: now },
      ]

      const project = {
        id: projectRef.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        ownerId: req.headers['x-user-id'] as string ?? 'unknown',
        environments,
        createdAt: now,
        updatedAt: now,
      }

      const batch = db().batch()
      batch.set(projectRef, project)

      for (const env of environments) {
        const envRef = projectRef.collection('environments').doc(env.key)
        batch.set(envRef, env)
      }

      await batch.commit()
      return res.status(201).json({ project })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[projects router]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
