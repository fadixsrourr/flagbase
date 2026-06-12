import { z } from 'zod'
import {
  TargetingOperatorSchema,
  type CreateFlagInput,
  type Flag,
  type FlagType,
  type FlagValue,
  type TargetingOperator,
} from '@flagbase/types'

export const FLAG_TYPE_OPTIONS: { value: FlagType; label: string }[] = [
  { value: 'boolean', label: 'Boolean' },
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'json', label: 'JSON' },
]

export const OPERATOR_OPTIONS: { value: TargetingOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'in', label: 'is in' },
  { value: 'not_in', label: 'is not in' },
]

export const LIST_OPERATORS: TargetingOperator[] = ['in', 'not_in']

const conditionSchema = z.object({
  attribute: z.string().min(1, 'Required'),
  operator: TargetingOperatorSchema,
  value: z.string().min(1, 'Required'),
})

const ruleSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Rule name is required'),
  priority: z.coerce.number().int().min(0),
  serveValue: z.string(),
  conditions: z.array(conditionSchema).min(1, 'Add at least one condition'),
})

function validateTypedValue(
  value: string,
  type: FlagType,
  path: (string | number)[],
  ctx: z.RefinementCtx
) {
  if (type === 'number' && !Number.isFinite(Number(value))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: 'Must be a number' })
  }
  if (type === 'json') {
    try {
      JSON.parse(value)
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: 'Must be valid JSON' })
    }
  }
}

export const flagFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    key: z
      .string()
      .min(1, 'Key is required')
      .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, - or _'),
    description: z.string(),
    type: z.enum(['boolean', 'string', 'number', 'json']),
    enabled: z.boolean(),
    defaultValue: z.string(),
    rolloutPercentage: z.coerce.number().min(0).max(100),
    tags: z.array(z.string()),
    rules: z.array(ruleSchema),
  })
  .superRefine((values, ctx) => {
    validateTypedValue(values.defaultValue, values.type, ['defaultValue'], ctx)
    values.rules.forEach((rule, index) =>
      validateTypedValue(rule.serveValue, values.type, ['rules', index, 'serveValue'], ctx)
    )
  })

export type FlagFormValues = z.infer<typeof flagFormSchema>

function parseTypedValue(value: string, type: FlagType): FlagValue {
  switch (type) {
    case 'boolean':
      return value === 'true'
    case 'number':
      return Number(value)
    case 'json':
      return JSON.parse(value) as FlagValue
    default:
      return value
  }
}

export function stringifyTypedValue(value: FlagValue, type: FlagType): string {
  if (type === 'json') return JSON.stringify(value, null, 2)
  if (type === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

export function defaultValueForType(type: FlagType): string {
  switch (type) {
    case 'boolean':
      return 'true'
    case 'number':
      return '0'
    case 'json':
      return '{}'
    default:
      return ''
  }
}

export function formToCreateInput(values: FlagFormValues): CreateFlagInput {
  return {
    key: values.key,
    name: values.name,
    description: values.description.trim() || undefined,
    type: values.type,
    enabled: values.enabled,
    defaultValue: parseTypedValue(values.defaultValue, values.type),
    rolloutPercentage: values.rolloutPercentage,
    tags: values.tags.length ? values.tags : undefined,
    rules: values.rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      priority: rule.priority,
      serveValue: parseTypedValue(rule.serveValue, values.type),
      conditions: rule.conditions.map((condition) => ({
        attribute: condition.attribute,
        operator: condition.operator,
        value: LIST_OPERATORS.includes(condition.operator)
          ? condition.value
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : condition.value,
      })),
    })),
  }
}

export function flagToFormValues(flag: Flag): FlagFormValues {
  return {
    name: flag.name,
    key: flag.key,
    description: flag.description ?? '',
    type: flag.type,
    enabled: flag.enabled,
    defaultValue: stringifyTypedValue(flag.defaultValue, flag.type),
    rolloutPercentage: flag.rolloutPercentage,
    tags: flag.tags ?? [],
    rules: flag.rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      priority: rule.priority,
      serveValue: stringifyTypedValue(rule.serveValue, flag.type),
      conditions: rule.conditions.map((condition) => ({
        attribute: condition.attribute,
        operator: condition.operator,
        value: Array.isArray(condition.value) ? condition.value.join(', ') : condition.value,
      })),
    })),
  }
}

export function emptyFormValues(): FlagFormValues {
  return {
    name: '',
    key: '',
    description: '',
    type: 'boolean',
    enabled: true,
    defaultValue: 'true',
    rolloutPercentage: 100,
    tags: [],
    rules: [],
  }
}
