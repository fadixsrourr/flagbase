import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  initializeApp as adminInitializeApp,
  cert as adminCert,
  deleteApp as adminDeleteApp,
  type App as AdminApp,
} from 'firebase-admin/app'
import { getFirestore as adminGetFirestore } from 'firebase-admin/firestore'
import { getApp, deleteApp } from 'firebase/app'
import type { Flag } from '@flagbase/types'
import { FlagbaseClient } from '../client'

/**
 * End-to-end SDK test against a REAL Firestore project. Skipped unless
 * RUN_INTEGRATION=1 (and never in CI), so the normal unit suite stays offline.
 *
 * Run it manually with:
 *   RUN_INTEGRATION=1 pnpm --filter flagbase-sdk exec vitest run integration
 */

function loadDashboardEnv(): void {
  const candidates = [
    resolve(process.cwd(), '../../apps/dashboard/.env'),
    resolve(process.cwd(), 'apps/dashboard/.env'),
  ]
  const envPath = candidates.find(existsSync)
  if (!envPath) return

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
    if (!match) continue
    const [, key, raw] = match
    if (process.env[key] !== undefined) continue
    // Double-quoted values are JSON string literals — JSON.parse expands \n
    // correctly (critical for the multiline service-account private key).
    process.env[key] = raw.startsWith('"') ? safeJsonParse(raw) : raw
  }
}

function safeJsonParse(value: string): string {
  try {
    return JSON.parse(value)
  } catch {
    return value.slice(1, -1)
  }
}

const shouldRun = Boolean(process.env.RUN_INTEGRATION) && !process.env.CI
if (shouldRun) loadDashboardEnv()

const webConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const hasCreds =
  shouldRun &&
  Boolean(webConfig.apiKey && webConfig.projectId) &&
  Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${label}`)), ms)
    ),
  ])
}

async function pollUntil(check: () => boolean, timeoutMs: number, intervalMs = 100): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (check()) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return check()
}

function buildFlag(now: string): Flag {
  return {
    id: 'beta',
    key: 'beta-banner',
    name: 'Beta banner',
    type: 'boolean',
    enabled: true,
    defaultValue: true,
    rolloutPercentage: 100,
    rules: [],
    createdAt: now,
    updatedAt: now,
    createdBy: 'integration-test',
  }
}

describe.runIf(hasCreds)('FlagbaseClient against real Firestore', () => {
  const projectId = `it-sdk-${Date.now()}`
  const environmentKey = 'development'
  const flagsPath = `projects/${projectId}/environments/${environmentKey}/flags`

  let adminApp: AdminApp
  let adminDb: ReturnType<typeof adminGetFirestore>
  let client: FlagbaseClient
  let readyMs = Number.POSITIVE_INFINITY

  beforeAll(async () => {
    adminApp = adminInitializeApp(
      {
        credential: adminCert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      },
      'it-admin'
    )
    adminDb = adminGetFirestore(adminApp)

    const now = new Date().toISOString()
    await adminDb.doc(`projects/${projectId}`).set({
      id: projectId,
      name: 'Integration test',
      slug: projectId,
      ownerId: 'integration-test',
      environments: [],
      createdAt: now,
      updatedAt: now,
    })
    await adminDb.doc(`${flagsPath}/beta`).set(buildFlag(now))

    client = new FlagbaseClient(webConfig, { projectId, environmentKey, apiKey: 'unused' })

    const start = Date.now()
    await withTimeout(client.waitUntilReady(), 6000, 'waitUntilReady')
    readyMs = Date.now() - start
  }, 30000)

  afterAll(async () => {
    client?.destroy()
    try {
      await deleteApp(getApp('flagbase'))
    } catch {
      // app may not exist if construction failed
    }
    if (adminDb) await adminDb.recursiveDelete(adminDb.doc(`projects/${projectId}`))
    if (adminApp) await adminDeleteApp(adminApp)
  }, 30000)

  it('reaches ready within 5 seconds', () => {
    expect(readyMs).toBeLessThan(5000)
  })

  it('returns the provided default for an unknown flag', () => {
    expect(client.get('nonexistent-flag', {}, false)).toBe(false)
  })

  it('evaluates a seeded flag to its real value', () => {
    const result = client.evaluate('beta-banner', {}, false)
    expect(result.value).toBe(true)
    expect(result.reason).toBe('default')
  })

  it('propagates a disable via onSnapshot in real time', async () => {
    await adminDb.doc(`${flagsPath}/beta`).update({ enabled: false })

    // In the browser Firestore uses WebChannel and updates land in well under a
    // second; in Node it falls back to long-polling, so we allow a wider 5s
    // window. The point is that the live listener reflects the change at all.
    const propagated = await pollUntil(
      () => client.evaluate('beta-banner', {}, true).reason === 'disabled',
      5000
    )

    expect(propagated).toBe(true)
  })
})
