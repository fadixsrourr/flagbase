# FlagBase

[![npm](https://img.shields.io/npm/v/flagbase-sdk.svg)](https://www.npmjs.com/package/flagbase-sdk)
[![CI](https://github.com/fadixsrourr/flagbase/actions/workflows/ci.yml/badge.svg)](https://github.com/fadixsrourr/flagbase/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Self-hosted feature flags powered by Firebase. A small, open alternative to LaunchDarkly: you own the data (it lives in your own Firestore), flags evaluate in real time on the client, and the admin dashboard is a Next.js app you deploy yourself.

- **`flagbase-sdk`** - framework-agnostic SDK. Reads flags from Firestore over a live `onSnapshot` listener and evaluates them locally.
- **`flagbase-react`** - React provider and hooks built on the SDK.
- **dashboard** - Next.js 16 admin UI for projects, environments, flags, targeting rules, and audit history.

---

## How it works

```text
your app  ──uses──▶  flagbase-sdk / flagbase-react
                          │  live onSnapshot
                          ▼
                     Firestore  ◀──writes──  FlagBase dashboard (Next.js API routes, Admin SDK)
```

Flag evaluation happens entirely on the client, so there is no FlagBase server to run or scale. The dashboard is only needed to manage flags.

---

## Quick start

### 1. Create a Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore** and **Authentication → Email/Password**.
3. Copy your web app config (Project settings → Your apps).

### 2. Install the SDK

```bash
npm install flagbase-sdk firebase
# React bindings (optional)
npm install flagbase-react
```

`firebase` is a peer dependency - you provide the version your app already uses.

### 3. Evaluate a flag

```ts
import { FlagbaseClient } from 'flagbase-sdk'

const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  // ...the rest of your Firebase web config
}

const client = new FlagbaseClient(firebaseConfig, {
  projectId: 'your-flagbase-project-id', // the project id from the dashboard
  environmentKey: 'production',          // development | staging | production
  apiKey: 'fb_...',                      // the environment API key
})

await client.waitUntilReady()

const showNewDashboard = client.get('new-dashboard', { userId: user.id }, false)
```

---

## SDK reference (`flagbase-sdk`)

### `new FlagbaseClient(firebaseConfig, config)`

| Argument | Type | Description |
| --- | --- | --- |
| `firebaseConfig` | `object` | Your Firebase web config. |
| `config.projectId` | `string` | FlagBase project id. |
| `config.environmentKey` | `'development' \| 'staging' \| 'production'` | Which environment's flags to load. |
| `config.apiKey` | `string` | The environment API key. |
| `config.onEvaluation` | `(key, result, context) => void` | Optional. Fired on every `get()` / `evaluate()` call — use it to send flag exposures to any analytics provider. |

### Methods

```ts
await client.waitUntilReady()                                    // resolves after the first snapshot

client.get(key, context?, defaultValue)                          // → the evaluated value
client.evaluate(key, context?, defaultValue)                     // → { value, reason, ruleId? }
const unsub = client.subscribe(key, (value) => { }, context?)   // live updates; re-evaluates with
                                                                 //   the same context on every change
client.destroy()                                                 // tear down all listeners
```

`evaluate` returns a `reason` of `'disabled' | 'targeting_rule' | 'rollout' | 'default'`.

### Exposure tracking with `onEvaluation`

```ts
const client = new FlagbaseClient(firebaseConfig, {
  projectId,
  environmentKey: 'production',
  apiKey: 'fb_...',
  onEvaluation: (key, result, context) => {
    analytics.track('flag_evaluated', {
      key,
      value: result.value,
      reason: result.reason,
      ...context,
    })
  },
})
```

### Evaluation order

1. **Disabled** - if the flag is off, the default value is served.
2. **Targeting rules** - evaluated by `priority` (lowest first). The first rule whose conditions all match wins.
3. **Rollout** - a deterministic hash of `userId` buckets the user into the rollout percentage.
4. **Default** - the flag's default value.

### Targeting operators

`equals`, `not_equals`, `contains`, `not_contains`, `in`, `not_in`. All conditions in a rule are combined with AND.

---

## React usage (`flagbase-react`)

```tsx
import { FlagbaseProvider, useFlag, useFlags } from 'flagbase-react'

function App() {
  return (
    <FlagbaseProvider
      firebaseConfig={firebaseConfig}
      config={{ projectId, environmentKey: 'production', apiKey: 'fb_...' }}
      loadingFallback={<Splash />}
    >
      <Dashboard />
    </FlagbaseProvider>
  )
}

function Dashboard() {
  const showNew = useFlag('new-dashboard', { userId: user.id }, false)

  const flags = useFlags(
    { 'beta-export': false, 'dark-mode': true },
    { userId: user.id }
  )

  return showNew ? <NewDashboard /> : <OldDashboard />
}
```

Both hooks re-render automatically when a flag changes in Firestore.

---

## Firestore data model

```text
projects/{projectId}
  ├─ name, slug, ownerId, environments[], createdAt, updatedAt
  └─ environments/{envKey}            // development | staging | production
       ├─ apiKey
       └─ flags/{flagId}
            ├─ key, name, type, enabled, defaultValue
            ├─ rolloutPercentage, rules[], tags[]
            └─ audit/{auditId}        // action, before, after, performedBy, performedAt
```

### Security rules

- **Flags are public-read by design.** The SDK reads them unauthenticated from the browser, so the flag config ships to clients anyway (the same model as client-side LaunchDarkly). Project ids are unguessable Firestore ids.
- Everything else (projects, environment API keys, flag **writes**, audit logs) is restricted to the project owner. All mutations go through the dashboard's API routes using the Firebase Admin SDK.

See [`firestore.rules`](firestore.rules).

---

## Self-hosting the dashboard

```bash
git clone https://github.com/fadixsrourr/flagbase.git
cd flagbase
pnpm install
```

Create `apps/dashboard/.env` from [`apps/dashboard/.env.example`](apps/dashboard/.env.example):

- `NEXT_PUBLIC_FIREBASE_*` - your Firebase web config (client).
- `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` - a service account key (Project settings → Service accounts), server-only.
- `NEXT_PUBLIC_ALLOW_REGISTRATION` - set `true` to allow creating the first account from `/login`, then turn it off.

Deploy the Firestore rules, then run:

```bash
firebase deploy --only firestore:rules,firestore:indexes
pnpm --filter @flagbase/dashboard dev        # http://localhost:3000
```

Deploy to Vercel (or any Node host) with `pnpm --filter @flagbase/dashboard build && pnpm --filter @flagbase/dashboard start`.

---

## Repository layout

```text
apps/
  dashboard/        # Next.js 16 admin UI + API routes (Admin SDK)
packages/
  sdk/              # flagbase-sdk
  sdk-react/        # flagbase-react
  types/            # @flagbase/types — shared Zod schemas (bundled into the SDKs)
firestore.rules
```

### Development

```bash
pnpm install
pnpm --filter @flagbase/types build
pnpm --filter flagbase-sdk test
pnpm build                                    # turborepo: build everything
```

Publishing is automated: push a `sdk-v*` tag and the [publish workflow](.github/workflows/publish.yml) builds and publishes `flagbase-sdk` and `flagbase-react` to npm (requires an `NPM_TOKEN` repo secret).

---

## License

MIT
