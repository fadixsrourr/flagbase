import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Flag, FlagbaseConfig, EvaluationContext, EvaluatedFlag, FlagValue } from '@flagbase/types'
import { evaluateFlag } from './evaluator'

export class FlagbaseClient {
  private app: FirebaseApp
  private db: Firestore
  private config: FlagbaseConfig
  private flags: Map<string, Flag> = new Map()
  private unsubscribers: Unsubscribe[] = []
  private listeners: Map<string, Set<(value: FlagValue) => void>> = new Map()
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

    flagListeners.forEach((cb) => {
      cb(flag.defaultValue)
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
    if (!flag) {
      return { value: defaultValue, reason: 'default' }
    }
    return evaluateFlag<T>(flag, context)
  }

  /** Shorthand: get the flag value directly */
  get<T extends FlagValue = FlagValue>(
    flagKey: string,
    context: EvaluationContext = {},
    defaultValue: T
  ): T {
    return this.evaluate<T>(flagKey, context, defaultValue).value
  }

  /** Subscribe to live value changes for a flag */
  subscribe(flagKey: string, callback: (value: FlagValue) => void): () => void {
    if (!this.listeners.has(flagKey)) {
      this.listeners.set(flagKey, new Set())
    }
    this.listeners.get(flagKey)!.add(callback)

    // Immediately call with current value if available
    const flag = this.flags.get(flagKey)
    if (flag) callback(flag.defaultValue)

    return () => {
      this.listeners.get(flagKey)?.delete(callback)
    }
  }

  /** Tear down all Firestore listeners */
  destroy(): void {
    this.unsubscribers.forEach((unsub) => unsub())
    this.unsubscribers = []
    this.listeners.clear()
  }
}
