import { useState, useEffect } from 'react'
import type { FlagValue, EvaluationContext } from '@flagbase/types'
import { useFlagbaseClient } from './provider'

type FlagDefaults = Record<string, FlagValue>
type FlagValues<T extends FlagDefaults> = { [K in keyof T]: T[K] }

/**
 * Evaluate multiple flags at once.
 *
 * @example
 * const flags = useFlags({ 'new-dashboard': false, 'beta-export': false }, { userId: user.id })
 */
export function useFlags<T extends FlagDefaults>(
  defaults: T,
  context: EvaluationContext = {}
): FlagValues<T> {
  const { client, ready } = useFlagbaseClient()

  const evaluate = (): FlagValues<T> => {
    if (!client || !ready) return defaults as FlagValues<T>
    const result = {} as FlagValues<T>
    for (const [key, def] of Object.entries(defaults)) {
      ;(result as Record<string, FlagValue>)[key] = client.get(key, context, def)
    }
    return result
  }

  const [values, setValues] = useState<FlagValues<T>>(evaluate)

  useEffect(() => {
    if (!client || !ready) return
    setValues(evaluate())

    const unsubscribers = Object.keys(defaults).map((key) =>
      client.subscribe(key, () => setValues(evaluate()))
    )

    return () => unsubscribers.forEach((unsub) => unsub())
  }, [client, ready, JSON.stringify(context)])

  return values
}
