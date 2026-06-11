import { z } from 'zod'

// ─── Flag value types ───────────────────────────────────────────────────────

export const FlagValueSchema = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.record(z.unknown()),
])
export type FlagValue = z.infer<typeof FlagValueSchema>

export type FlagType = 'boolean' | 'string' | 'number' | 'json'

// ─── Targeting rules ────────────────────────────────────────────────────────

export const TargetingOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'in',
  'not_in',
])
export type TargetingOperator = z.infer<typeof TargetingOperatorSchema>

export const TargetingConditionSchema = z.object({
  attribute: z.string(),
  operator: TargetingOperatorSchema,
  value: z.union([z.string(), z.array(z.string())]),
})
export type TargetingCondition = z.infer<typeof TargetingConditionSchema>

export const TargetingRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  conditions: z.array(TargetingConditionSchema),
  serveValue: FlagValueSchema,
  priority: z.number().int().min(0),
})
export type TargetingRule = z.infer<typeof TargetingRuleSchema>

// ─── Flag ───────────────────────────────────────────────────────────────────

export const FlagSchema = z.object({
  id: z.string(),
  key: z.string().regex(/^[a-z0-9_-]+$/, 'Flag key must be lowercase alphanumeric with - or _'),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['boolean', 'string', 'number', 'json']),
  enabled: z.boolean(),
  defaultValue: FlagValueSchema,
  rolloutPercentage: z.number().min(0).max(100),
  rules: z.array(TargetingRuleSchema),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
})
export type Flag = z.infer<typeof FlagSchema>

export const CreateFlagSchema = FlagSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
})
export type CreateFlagInput = z.infer<typeof CreateFlagSchema>

export const UpdateFlagSchema = CreateFlagSchema.partial()
export type UpdateFlagInput = z.infer<typeof UpdateFlagSchema>

// ─── Project & Environment ───────────────────────────────────────────────────

export const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.enum(['development', 'staging', 'production']),
  apiKey: z.string(),
  createdAt: z.string().datetime(),
})
export type Environment = z.infer<typeof EnvironmentSchema>

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  ownerId: z.string(),
  environments: z.array(EnvironmentSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Project = z.infer<typeof ProjectSchema>

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with -'),
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

// ─── Audit log ──────────────────────────────────────────────────────────────

export const AuditActionSchema = z.enum([
  'flag.created',
  'flag.updated',
  'flag.deleted',
  'flag.enabled',
  'flag.disabled',
])
export type AuditAction = z.infer<typeof AuditActionSchema>

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  flagId: z.string(),
  flagKey: z.string(),
  action: AuditActionSchema,
  before: FlagSchema.partial().optional(),
  after: FlagSchema.partial().optional(),
  performedBy: z.string(),
  performedAt: z.string().datetime(),
})
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>

// ─── SDK types ──────────────────────────────────────────────────────────────

export interface EvaluationContext {
  userId?: string
  email?: string
  country?: string
  [key: string]: string | number | boolean | undefined
}

export interface EvaluatedFlag<T extends FlagValue = FlagValue> {
  value: T
  reason: 'disabled' | 'targeting_rule' | 'rollout' | 'default'
  ruleId?: string
}

export interface FlagbaseConfig {
  projectId: string
  environmentKey: string
  apiKey: string
}
