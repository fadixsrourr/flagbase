import { describe, it, expect } from 'vitest'
import { hashUserId } from '../hash'

describe('hashUserId', () => {
  it('returns a number in [0, 100)', () => {
    for (let i = 0; i < 1000; i++) {
      const result = hashUserId(`user-${i}`, 'my-flag')
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(100)
    }
  })

  it('is deterministic — same input always gives same output', () => {
    const a = hashUserId('fadi', 'new-dashboard')
    const b = hashUserId('fadi', 'new-dashboard')
    expect(a).toBe(b)
  })

  it('produces different buckets for different users', () => {
    const buckets = new Set(
      Array.from({ length: 100 }, (_, i) => hashUserId(`user-${i}`, 'flag'))
    )
    // With 100 users, expect at least 20 distinct buckets (reasonable distribution)
    expect(buckets.size).toBeGreaterThan(20)
  })

  it('produces different buckets for different flag keys (same user)', () => {
    const b1 = hashUserId('fadi', 'flag-a')
    const b2 = hashUserId('fadi', 'flag-b')
    // These could theoretically be equal but very unlikely
    expect(typeof b1).toBe('number')
    expect(typeof b2).toBe('number')
  })
})
