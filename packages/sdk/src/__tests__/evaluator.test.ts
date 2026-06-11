import { describe, it, expect } from 'vitest'
import { evaluateFlag } from '../evaluator'
import type { Flag } from '@flagbase/types'

const baseFlag: Flag = {
  id: 'flag-1',
  key: 'new-dashboard',
  name: 'New Dashboard',
  type: 'boolean',
  enabled: true,
  defaultValue: false,
  rolloutPercentage: 100,
  rules: [],
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user-1',
}

describe('evaluateFlag', () => {
  it('returns default when flag is disabled', () => {
    const result = evaluateFlag({ ...baseFlag, enabled: false }, { userId: 'u1' })
    expect(result.value).toBe(false)
    expect(result.reason).toBe('disabled')
  })

  it('returns default value when enabled with 100% rollout', () => {
    const result = evaluateFlag({ ...baseFlag, defaultValue: true }, {})
    expect(result.value).toBe(true)
    expect(result.reason).toBe('default')
  })

  it('applies targeting rule: equals', () => {
    const flag: Flag = {
      ...baseFlag,
      rules: [
        {
          id: 'rule-1',
          name: 'Beta users',
          priority: 0,
          conditions: [{ attribute: 'email', operator: 'contains', value: '@beta.com' }],
          serveValue: true,
        },
      ],
    }
    expect(evaluateFlag(flag, { email: 'fadi@beta.com' }).reason).toBe('targeting_rule')
    expect(evaluateFlag(flag, { email: 'fadi@beta.com' }).value).toBe(true)
    expect(evaluateFlag(flag, { email: 'fadi@gmail.com' }).value).toBe(false)
  })

  it('applies targeting rule: in list', () => {
    const flag: Flag = {
      ...baseFlag,
      rules: [
        {
          id: 'rule-2',
          name: 'Allowed countries',
          priority: 0,
          conditions: [{ attribute: 'country', operator: 'in', value: ['LB', 'US', 'DE'] }],
          serveValue: true,
        },
      ],
    }
    expect(evaluateFlag(flag, { country: 'LB' }).value).toBe(true)
    expect(evaluateFlag(flag, { country: 'FR' }).value).toBe(false)
  })

  it('respects rule priority — lower number wins', () => {
    const flag: Flag = {
      ...baseFlag,
      defaultValue: 'control',
      type: 'string',
      rules: [
        {
          id: 'rule-low',
          name: 'Low priority',
          priority: 10,
          conditions: [{ attribute: 'userId', operator: 'equals', value: 'u1' }],
          serveValue: 'variant-b',
        },
        {
          id: 'rule-high',
          name: 'High priority',
          priority: 0,
          conditions: [{ attribute: 'userId', operator: 'equals', value: 'u1' }],
          serveValue: 'variant-a',
        },
      ],
    }
    expect(evaluateFlag(flag, { userId: 'u1' }).value).toBe('variant-a')
    expect(evaluateFlag(flag, { userId: 'u1' }).ruleId).toBe('rule-high')
  })

  it('excludes users outside rollout percentage', () => {
    // With 0% rollout, everyone gets default
    const flag: Flag = { ...baseFlag, defaultValue: false, rolloutPercentage: 0 }
    const result = evaluateFlag(flag, { userId: 'any-user' })
    expect(result.value).toBe(false)
  })
})
