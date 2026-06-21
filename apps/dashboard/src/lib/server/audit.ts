import type { AuditAction } from '@flagbase/types'
import { auditCollection } from './db'

export async function writeAuditLog(
  projectId: string,
  environmentKey: string,
  flagId: string,
  flagKey: string,
  action: AuditAction,
  performedBy: string,
  before?: object,
  after?: object
) {
  const ref = auditCollection(projectId, environmentKey, flagId).doc()

  await ref.set({
    id: ref.id,
    flagId,
    flagKey,
    action,
    before: before ?? null,
    after: after ?? null,
    performedBy,
    performedAt: new Date().toISOString(),
  })
}
