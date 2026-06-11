# 🚩 FlagBase

Self-hosted feature flag system powered by Firebase. A free, open-source alternative to LaunchDarkly.

## Architecture

```
flagbase/
├── apps/
│   ├── dashboard/        # Next.js 15 admin UI
│   └── functions/        # Firebase Cloud Functions (REST API)
├── packages/
│   ├── sdk/              # flagbase-js — npm SDK (framework-agnostic)
│   ├── sdk-react/        # @flagbase/react — React hooks
│   └── types/            # @flagbase/types — shared Zod schemas + TS types
├── firebase.json
└── firestore.rules
```

## SDK Usage

```bash
npm install flagbase-js
```

```ts
import { FlagbaseClient } from 'flagbase-js'

const client = new FlagbaseClient(firebaseConfig, {
  projectId: 'your-project-id',
  environmentKey: 'production',
  apiKey: 'fb_...',
})

await client.waitUntilReady()

// Evaluate a flag
const showNewDashboard = client.get('new-dashboard', { userId: user.id }, false)
```

## React Usage

```tsx
import { FlagbaseProvider, useFlag } from '@flagbase/react'

// Wrap your app
<FlagbaseProvider firebaseConfig={firebaseConfig} config={flagbaseConfig}>
  <App />
</FlagbaseProvider>

// Use in any component — updates live via Firestore onSnapshot
function MyComponent() {
  const showFeature = useFlag('new-feature', { userId: user.id }, false)
  return showFeature ? <NewUI /> : <OldUI />
}
```

## Setup

### 1. Create a Firebase project

Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
Enable **Firestore**, **Firebase Auth** (Email/Password), and **Cloud Functions**.

### 2. Clone and install

```bash
git clone https://github.com/your-username/flagbase
cd flagbase
pnpm install
```

### 3. Configure environment

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
# Fill in your Firebase config values
```

### 4. Deploy Firestore rules

```bash
firebase login
firebase use --add   # select your Firebase project
firebase deploy --only firestore:rules
```

### 5. Run locally

```bash
pnpm dev
```

- Dashboard: http://localhost:3000
- Firebase Emulator UI: http://localhost:4000

## Flag evaluation logic

Priority order:
1. **Disabled** — flag is off, return `defaultValue`
2. **Targeting rules** — matched by priority (lowest number first)
3. **Percentage rollout** — deterministic hash of `userId + flagKey`
4. **Default value**

## License

MIT
