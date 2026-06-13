import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  collection,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'

// Tracks Firestore instances already wired to the emulator so we never call
// connectFirestoreEmulator twice on the same instance (it throws if called again).
const emulatorConnected = new WeakSet<Firestore>()
import type { Flag, FlagbaseConfig, EvaluationContext, EvaluatedFlag, FlagValue } from '@flagbase/types'
import { evaluateFlag } from './evaluator'

export class FlagbaseClient {
  private app: FirebaseApp
  private db: Firestore
  private config: FlagbaseConfig
  private flags: Map<string, Flag> = new Map()
  private unsubscribers: Unsubscribe[] = []
  private listeners: Map<string, Set<{ callback: (value: FlagValue) => void; context: EvaluationContext }>> = new Map()
  private ready = false
  private readyPromise: Promise<void>
  private resolveReady!: () => void

  constructor(firebaseConfig: object, flagbaseConfig: FlagbaseConfig) {
    this.config = flagbaseConfig

    // Reuse existing Firebase app if already initialized
    const existingApp = getApps().find((a) => a.name === 'flagbase')
    this.app = existingApp ?? initializeApp(firebaseConfig, 'flagbase')
    this.db = getFirestore(this.app)

    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve
    })

    // Redirect to the local Firestore Emulator when FIRESTORE_EMULATOR_HOST is set.
    // Use globalThis to avoid a Node.js type dependency in this browser-first package.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emulatorHost = (globalThis as any).process?.env?.FIRESTORE_EMULATOR_HOST as string | undefined
    if (emulatorHost && !emulatorConnected.has(this.db)) {
      const [host, port] = emulatorHost.split(':')
      connectFirestoreEmulator(this.db, host, parseInt(port, 10))
      emulatorConnected.add(this.db)
    }

    this.subscribeToFlags()
  }

  private get flagsCollectionPath(): string {
    return `projects/${this.config.projectId}/environments/${this.config.environmentKey}/flags`
  }

  private subscribeToFlags(): void {
    const flagsRef = collection(this.db, this.flagsCollectionPath)

    const unsub = onSnapshot(
      flagsRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const flag = { id: change.doc.id, ...change.doc.data() } as Flag

          if (change.type === 'removed') {
            this.flags.delete(flag.key)
          } else {
            this.flags.set(flag.key, flag)
            // Notify any active listeners for this flag
            this.notifyListeners(flag.key)
          }
        })

        if (!this.ready) {
          this.ready = true
          this.resolveReady()
        }
      },
      (error) => {
        console.error('[FlagbaseClient] Firestore subscription error:', error)
      }
    )

    this.unsubscribers.push(unsub)
  }

  private notifyListeners(flagKey: string): void {
    const flagListeners = this.listeners.get(flagKey)
    if (!flagListeners) return

    const flag = this.flags.get(flagKey)
    if (!flag) return

    flagListeners.forEach(({ callback, context }) => {
      const { value } = this.evaluate(flagKey, context, flag.defaultValue)
      callback(value)
    })
  }

  /** Wait until the initial snapshot has loaded */
  async waitUntilReady(): Promise<void> {
    return this.readyPromise
  }

  /** Evaluate a flag synchronously (after waitUntilReady) */
  evaluate<T extends FlagValue = FlagValue>(
    flagKey: string,
    context: EvaluationContext = {},
    defaultValue: T
  ): EvaluatedFlag<T> {
    const flag = this.flags.get(flagKey)
    const result: EvaluatedFlag<T> = flag
      ? evaluateFlag<T>(flag, context)
      : { value: defaultValue, reason: 'default' }
    this.config.onEvaluation?.(flagKey, result, context)
    return result
  }

  /** Shorthand: get the flag value directly */
  get<T extends FlagValue = FlagValue>(
    flagKey: string,
    context: EvaluationContext = {},
    defaultValue: T
  ): T {
    return this.evaluate<T>(flagKey, context, defaultValue).value
  }

  /** Subscribe to live value changes for a flag, re-evaluated against context on every update */
  subscribe(
    flagKey: string,
    callback: (value: FlagValue) => void,
    context: EvaluationContext = {}
  ): () => void {
    if (!this.listeners.has(flagKey)) {
      this.listeners.set(flagKey, new Set())
    }
    const listener = { callback, context }
    this.listeners.get(flagKey)!.add(listener)

    // Immediately deliver the current evaluated value
    const flag = this.flags.get(flagKey)
    if (flag) callback(this.evaluate(flagKey, context, flag.defaultValue).value)

    return () => {
      this.listeners.get(flagKey)?.delete(listener)
    }
  }

  /** Tear down all Firestore listeners */
  destroy(): void {
    this.unsubscribers.forEach((unsub) => unsub())
    this.unsubscribers = []
    this.listeners.clear()
  }
}
