import { useState, useEffect } from 'react'
import type { FlagValue, EvaluationContext } from '@flagbase/types'
import { useFlagbaseClient } from './provider'

/**
 * Evaluate a single feature flag with live updates.
 *
 * @example
 * const showNewDashboard = useFlag('new-dashboard', { userId: user.id }, false)
 */
export function useFlag<T extends FlagValue = FlagValue>(
  flagKey: string,
  context: EvaluationContext = {},
  defaultValue: T
): T {
  const { client, ready } = useFlagbaseClient()

  const [value, setValue] = useState<T>(() => {
    if (!client || !ready) return defaultValue
    return client.get<T>(flagKey, context, defaultValue)
  })

  useEffect(() => {
    if (!client || !ready) return

    // Get current value immediately
    setValue(client.get<T>(flagKey, context, defaultValue))

    // Subscribe to future changes — context is stored in the listener so every
    // background onSnapshot re-evaluates against this user's attributes
    const unsubscribe = client.subscribe(flagKey, (newValue) => {
      setValue(newValue as T)
    }, context)

    return unsubscribe
  }, [client, ready, flagKey, JSON.stringify(context)])

  return value
}
