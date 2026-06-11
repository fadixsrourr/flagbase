import type { Flag, EvaluationContext, EvaluatedFlag, FlagValue } from '@flagbase/types'
import { hashUserId } from './hash'

/**
 * Core evaluation engine.
 * Priority: disabled → targeting rules (by priority asc) → rollout → default
 */
export function evaluateFlag<T extends FlagValue = FlagValue>(
  flag: Flag,
  context: EvaluationContext = {}
): EvaluatedFlag<T> {
  // 1. Flag is off — return default immediately
  if (!flag.enabled) {
    return { value: flag.defaultValue as T, reason: 'disabled' }
  }

  // 2. Targeting rules — sorted by priority (lower number = higher priority)
  const sortedRules = [...flag.rules].sort((a, b) => a.priority - b.priority)

  for (const rule of sortedRules) {
    if (matchesRule(rule.conditions, context)) {
      return { value: rule.serveValue as T, reason: 'targeting_rule', ruleId: rule.id }
    }
  }

  // 3. Percentage rollout — requires userId
  if (context.userId && flag.rolloutPercentage < 100) {
    const bucket = hashUserId(context.userId, flag.key)
    if (bucket >= flag.rolloutPercentage) {
      return { value: flag.defaultValue as T, reason: 'default' }
    }
    return { value: flag.defaultValue as T, reason: 'rollout' }
  }

  // 4. Default value
  return { value: flag.defaultValue as T, reason: 'default' }
}

function matchesRule(
  conditions: Flag['rules'][0]['conditions'],
  context: EvaluationContext
): boolean {
  return conditions.every((condition) => {
    const attrValue = context[condition.attribute]
    if (attrValue === undefined) return false
    const strValue = String(attrValue)

    switch (condition.operator) {
      case 'equals':
        return strValue === condition.value
      case 'not_equals':
        return strValue !== condition.value
      case 'contains':
        return strValue.includes(condition.value as string)
      case 'not_contains':
        return !strValue.includes(condition.value as string)
      case 'in':
        return (condition.value as string[]).includes(strValue)
      case 'not_in':
        return !(condition.value as string[]).includes(strValue)
      default:
        return false
    }
  })
}
