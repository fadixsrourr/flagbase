import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { FlagbaseClient } from 'flagbase-js'
import type { FlagbaseConfig } from '@flagbase/types'

interface FlagbaseContextValue {
  client: FlagbaseClient | null
  ready: boolean
}

const FlagbaseContext = createContext<FlagbaseContextValue>({ client: null, ready: false })

interface FlagbaseProviderProps {
  firebaseConfig: object
  config: FlagbaseConfig
  children: ReactNode
  /** Rendered while flags are loading — defaults to null */
  loadingFallback?: ReactNode
}

export function FlagbaseProvider({
  firebaseConfig,
  config,
  children,
  loadingFallback = null,
}: FlagbaseProviderProps) {
  const [client] = useState(() => new FlagbaseClient(firebaseConfig, config))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    client.waitUntilReady().then(() => setReady(true))
    return () => client.destroy()
  }, [client])

  return (
    <FlagbaseContext.Provider value={{ client, ready }}>
      {ready ? children : loadingFallback}
    </FlagbaseContext.Provider>
  )
}

export function useFlagbaseClient(): FlagbaseContextValue {
  return useContext(FlagbaseContext)
}
