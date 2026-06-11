/**
 * Deterministic hash of a string to a number in [0, 100).
 * Same input always produces the same bucket — so a user always
 * gets the same variant for a given flag key.
 *
 * Uses FNV-1a (32-bit) — fast, no dependencies, good distribution.
 */
export function hashUserId(userId: string, flagKey: string): number {
  const input = `${flagKey}:${userId}`
  let hash = 2166136261 // FNV offset basis

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    // Multiply by FNV prime (32-bit), keep within 32-bit range
    hash = (hash * 16777619) >>> 0
  }

  return hash % 100
}
