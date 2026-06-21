# flagbase-sdk

[![npm](https://img.shields.io/npm/v/flagbase-sdk.svg)](https://www.npmjs.com/package/flagbase-sdk)
[![CI](https://github.com/fadixsrourr/flagbase/actions/workflows/ci.yml/badge.svg)](https://github.com/fadixsrourr/flagbase/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fadixsrourr/flagbase/blob/main/LICENSE)

Framework-agnostic feature flag SDK for [FlagBase](https://github.com/fadixsrourr/flagbase) — a self-hosted, open-source alternative to LaunchDarkly backed by your own Firestore.

Flags are read over a live `onSnapshot` listener and evaluated locally. No FlagBase server to run.

## Install

```bash
npm install flagbase-sdk firebase
```

`firebase` is a peer dependency — provide the version your app already uses.

## Usage

```ts
import { FlagbaseClient } from 'flagbase-sdk'

const client = new FlagbaseClient(
  {
    apiKey: '...',
    authDomain: '...',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...',
  },
  {
    projectId: 'your-flagbase-project-id',
    environmentKey: 'production',
    apiKey: 'fb_...',
  }
)

await client.waitUntilReady()

// boolean flag, no targeting
const enabled = client.get('dark-mode', {}, false)

// targeted flag
const showBeta = client.get('beta-export', { userId: user.id, plan: 'pro' }, false)

// full evaluation result
const { value, reason, ruleId } = client.evaluate('beta-export', { userId: user.id }, false)

// subscribe to live changes
const unsubscribe = client.subscribe('dark-mode', (value) => {
  document.body.classList.toggle('dark', value as boolean)
})

// cleanup
client.destroy()
```

## Config options

| Option | Type | Description |
| --- | --- | --- |
| `projectId` | `string` | FlagBase project id (from the dashboard). |
| `environmentKey` | `'development' \| 'staging' \| 'production'` | Which environment's flags to load. |
| `apiKey` | `string` | The environment API key (from the dashboard). |
| `onEvaluation` | `(key, result, context) => void` | Optional. Called on every `get()` / `evaluate()` — use for exposure tracking. |

## Exposure tracking

```ts
const client = new FlagbaseClient(firebaseConfig, {
  projectId,
  environmentKey: 'production',
  apiKey: 'fb_...',
  onEvaluation: (key, result, context) => {
    analytics.track('flag_evaluated', { key, value: result.value, reason: result.reason, ...context })
  },
})
```

## Evaluation order

1. **Disabled** — flag is off, default value is returned.
2. **Targeting rules** — evaluated by `priority` (lowest first). First matching rule wins.
3. **Rollout** — deterministic hash of `userId` buckets the user into the rollout percentage.
4. **Default** — the flag's default value.

Targeting operators: `equals`, `not_equals`, `contains`, `not_contains`, `in`, `not_in`.

## React bindings

See [`flagbase-react`](https://www.npmjs.com/package/flagbase-react) for `FlagbaseProvider`, `useFlag`, and `useFlags`.

## Full documentation

[github.com/fadixsrourr/flagbase](https://github.com/fadixsrourr/flagbase)
