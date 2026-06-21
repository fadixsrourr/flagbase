# flagbase-react

[![npm](https://img.shields.io/npm/v/flagbase-react.svg)](https://www.npmjs.com/package/flagbase-react)
[![CI](https://github.com/fadixsrourr/flagbase/actions/workflows/ci.yml/badge.svg)](https://github.com/fadixsrourr/flagbase/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fadixsrourr/flagbase/blob/main/LICENSE)

React provider and hooks for [FlagBase](https://github.com/fadixsrourr/flagbase) — self-hosted feature flags backed by your own Firestore. Built on [`flagbase-sdk`](https://www.npmjs.com/package/flagbase-sdk).

Hooks re-render automatically when a flag changes in Firestore.

## Install

```bash
npm install flagbase-react flagbase-sdk firebase
```

## Usage

### Wrap your app with `FlagbaseProvider`

```tsx
import { FlagbaseProvider } from 'flagbase-react'

const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
}

function App() {
  return (
    <FlagbaseProvider
      firebaseConfig={firebaseConfig}
      config={{
        projectId: 'your-flagbase-project-id',
        environmentKey: 'production',
        apiKey: 'fb_...',
      }}
      loadingFallback={<div>Loading...</div>}
    >
      <YourApp />
    </FlagbaseProvider>
  )
}
```

### `useFlag` — single flag

```tsx
import { useFlag } from 'flagbase-react'

function Header({ user }) {
  const showBeta = useFlag('beta-nav', { userId: user.id, plan: user.plan }, false)

  return showBeta ? <BetaNav /> : <Nav />
}
```

### `useFlags` — multiple flags at once

```tsx
import { useFlags } from 'flagbase-react'

function Dashboard({ user }) {
  const flags = useFlags(
    { 'dark-mode': true, 'beta-export': false, 'new-editor': false },
    { userId: user.id }
  )

  return (
    <Layout dark={flags['dark-mode']}>
      {flags['beta-export'] && <ExportButton />}
      {flags['new-editor'] ? <NewEditor /> : <Editor />}
    </Layout>
  )
}
```

Both hooks accept an optional `context` object (user attributes for targeting rules) and re-render whenever the flag value changes in Firestore.

## `FlagbaseProvider` props

| Prop | Type | Description |
| --- | --- | --- |
| `firebaseConfig` | `object` | Your Firebase web config. |
| `config.projectId` | `string` | FlagBase project id (from the dashboard). |
| `config.environmentKey` | `'development' \| 'staging' \| 'production'` | Which environment to load. |
| `config.apiKey` | `string` | Environment API key (from the dashboard). |
| `config.onEvaluation` | `(key, result, context) => void` | Optional. Fired on every evaluation — use for exposure tracking. |
| `loadingFallback` | `ReactNode` | Rendered while the first Firestore snapshot loads. |

## Full documentation

[github.com/fadixsrourr/flagbase](https://github.com/fadixsrourr/flagbase)
