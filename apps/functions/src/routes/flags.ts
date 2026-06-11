import type { Request, Response } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { CreateFlagSchema, UpdateFlagSchema } from '@flagbase/types'
import { verifyApiKey } from '../middleware/auth'
import { writeAuditLog } from '../lib/audit'

const db = () => admin.firestore()

function flagsCollection(projectId: string, envKey: string) {
  return db().collection(`projects/${projectId}/environments/${envKey}/flags`)
}

export async function flagsRouter(req: Request, res: Response) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key')

  if (req.method === 'OPTIONS') return res.status(204).send('')

  const { projectId, environmentKey } = req.params as Record<string, string>
  if (!projectId || !environmentKey) {
    return res.status(400).json({ error: 'Missing projectId or environmentKey' })
  }

  const authError = await verifyApiKey(req, projectId, environmentKey)
  if (authError) return res.status(401).json({ error: authError })

  const col = flagsCollection(projectId, environmentKey)

  try {
    // GET /flags/:projectId/:environmentKey
    if (req.method === 'GET' && !req.params.flagId) {
      const snapshot = await col.get()
      const flags = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      return res.json({ flags })
    }

    // GET /flags/:projectId/:environmentKey/:flagId
    if (req.method === 'GET' && req.params.flagId) {
      const doc = await col.doc(req.params.flagId).get()
      if (!doc.exists) return res.status(404).json({ error: 'Flag not found' })
      return res.json({ flag: { id: doc.id, ...doc.data() } })
    }

    // POST /flags/:projectId/:environmentKey
    if (req.method === 'POST') {
      const parsed = CreateFlagSchema.safeParse(req.body)
      if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() })

      const now = new Date().toISOString()
      const ref = col.doc()
      const flag = {
        ...parsed.data,
        id: ref.id,
        createdBy: req.headers['x-user-id'] as string ?? 'api',
        createdAt: now,
        updatedAt: now,
      }
      await ref.set(flag)
      await writeAuditLog(projectId, environmentKey, ref.id, flag.key, 'flag.created', undefined, flag)
      return res.status(201).json({ flag })
    }

    // PUT /flags/:projectId/:environmentKey/:flagId
    if (req.method === 'PUT' && req.params.flagId) {
      const parsed = UpdateFlagSchema.safeParse(req.body)
      if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() })

      const ref = col.doc(req.params.flagId)
      const existing = await ref.get()
      if (!existing.exists) return res.status(404).json({ error: 'Flag not found' })

      const before = existing.data()
      const update = { ...parsed.data, updatedAt: new Date().toISOString() }
      await ref.update(update)
      await writeAuditLog(projectId, environmentKey, ref.id, before?.key ?? '', 'flag.updated', before, update)
      return res.json({ flag: { id: ref.id, ...before, ...update } })
    }

    // DELETE /flags/:projectId/:environmentKey/:flagId
    if (req.method === 'DELETE' && req.params.flagId) {
      const ref = col.doc(req.params.flagId)
      const existing = await ref.get()
      if (!existing.exists) return res.status(404).json({ error: 'Flag not found' })
      const before = existing.data()
      await ref.delete()
      await writeAuditLog(projectId, environmentKey, ref.id, before?.key ?? '', 'flag.deleted', before, undefined)
      return res.status(204).send('')
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[flags router]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
