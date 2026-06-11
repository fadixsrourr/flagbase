# FlagBase — Implementation Plan

> **Stack:** Next.js 15 · Firestore · Firebase Auth · flagbase-js SDK · @flagbase/react · Turborepo · pnpm workspaces  
> **Cloud Functions:** removed — all server logic lives in Next.js API routes  
> **Total phases:** 5 · Estimated delivery: 3–4 weeks part-time

---

## Current state

```
flagbase/
├── apps/
│   ├── dashboard/        ✅ scaffolded (Next.js 15, Tailwind, firebase.ts)
│   └── functions/        ❌ to be deleted — replaced by API routes
├── packages/
│   ├── sdk/              ✅ complete (client, evaluator, hash, tests passing)
│   ├── sdk-react/        ✅ complete (FlagbaseProvider, useFlag, useFlags)
│   └── types/            ✅ complete (all Zod schemas built)
├── firestore.rules       ✅ written, needs deploy
└── firebase.json         ⚠️  needs functions block removed
```

---

## Refactoring: `apps/functions` → Next.js API routes

### What gets deleted

```
apps/functions/   ← entire directory removed
```

Remove the `functions` block from `firebase.json` too:

```json
// firebase.json — after removal
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

### What gets created inside `apps/dashboard/`

All logic from `apps/functions/src/` maps 1:1 into the dashboard app:

| Functions file | New location in dashboard |
|---|---|
| `src/middleware/auth.ts` | `src/lib/server/auth.ts` |
| `src/lib/audit.ts` | `src/lib/server/audit.ts` |
| `src/routes/flags.ts` | `src/app/api/projects/[projectId]/[envKey]/flags/route.ts` |
| `src/routes/flags.ts` (single) | `src/app/api/projects/[projectId]/[envKey]/flags/[flagId]/route.ts` |
| `src/routes/projects.ts` | `src/app/api/projects/route.ts` |
| _(new)_ | `src/app/api/projects/[projectId]/route.ts` |
| `src/index.ts` | _(deleted — no equivalent needed)_ |

### Key differences from Cloud Functions

- Use `firebase-admin` initialized via a singleton in `src/lib/server/firebase-admin.ts`
- Request type changes from `firebase-functions Request` to Next.js `NextRequest`
- Response uses `NextResponse.json()` instead of `res.json()`
- Auth changes: instead of `x-api-key` header verification for SDK calls, dashboard routes verify the Firebase Auth session cookie (server-side) using `admin.auth().verifySessionCookie()`
- `generateApiKey()` stays identical — uses Node.js `crypto.randomBytes`

### New server-only files needed

```
apps/dashboard/src/lib/server/
├── firebase-admin.ts     ← singleton Admin SDK init
├── auth.ts               ← session cookie verification (replaces x-api-key middleware)
├── audit.ts              ← identical logic, just updated imports
└── db.ts                 ← typed Firestore helpers (collection refs)
```

---

## Phase 1 — Firebase project wiring & refactor

**Goal:** delete `apps/functions`, wire Firebase to the dashboard, deploy Firestore rules.

### 1.1 Firebase console setup (manual steps)

- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Firestore (Standard edition, `europe-west1`)
- [ ] Enable Authentication → Email/Password provider
- [ ] Go to Project Settings → Your apps → Add web app → copy config
- [ ] Paste config values into `apps/dashboard/.env.local`

### 1.2 Delete `apps/functions`

```bash
rm -rf apps/functions
```

Update `firebase.json` — remove the `functions` array block entirely.  
Update root `pnpm-workspace.yaml` if it references functions explicitly (it doesn't currently).

### 1.3 Add Firebase Admin SDK to dashboard

```bash
pnpm --filter @flagbase/dashboard add firebase-admin
```

Create `src/lib/server/firebase-admin.ts`:

```ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    : getApps()[0]

export const adminDb = getFirestore(app)
export const adminAuth = getAuth(app)
```

Add to `.env.local` (server-only, no `NEXT_PUBLIC_` prefix):

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

> These come from Firebase Console → Project Settings → Service Accounts → Generate new private key.

### 1.4 Migrate auth middleware

Create `src/lib/server/auth.ts`:

```ts
import { adminAuth } from './firebase-admin'
import { cookies } from 'next/headers'

export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__session')?.value
  if (!sessionCookie) return null

  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true)
  } catch {
    return null
  }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 as const }
  }
  return { user, error: null }
}
```

### 1.5 Migrate audit log

Create `src/lib/server/audit.ts` — identical logic to `apps/functions/src/lib/audit.ts`, updated imports:

```ts
import { adminDb } from './firebase-admin'
import type { AuditAction } from '@flagbase/types'

export async function writeAuditLog(
  projectId: string,
  environmentKey: string,
  flagId: string,
  flagKey: string,
  action: AuditAction,
  performedBy: string,
  before?: object,
  after?: object
) {
  const ref = adminDb
    .collection(`projects/${projectId}/environments/${environmentKey}/flags/${flagId}/audit`)
    .doc()

  await ref.set({
    id: ref.id,
    flagId,
    flagKey,
    action,
    before: before ?? null,
    after: after ?? null,
    performedBy,  // now comes from session, not a header
    performedAt: new Date().toISOString(),
  })
}
```

### 1.6 Migrate API routes

**Projects:**

`src/app/api/projects/route.ts` — POST creates a project with 3 environments, batch write:

```ts
// POST /api/projects
export async function POST(req: NextRequest) { ... }
```

**Flags list:**

`src/app/api/projects/[projectId]/[envKey]/flags/route.ts`:

```ts
// GET  /api/projects/:projectId/:envKey/flags       → list all flags
// POST /api/projects/:projectId/:envKey/flags       → create flag
```

**Single flag:**

`src/app/api/projects/[projectId]/[envKey]/flags/[flagId]/route.ts`:

```ts
// GET    /api/projects/:projectId/:envKey/flags/:flagId  → get one
// PUT    /api/projects/:projectId/:envKey/flags/:flagId  → update
// DELETE /api/projects/:projectId/:envKey/flags/:flagId  → delete
```

**Audit log:**

`src/app/api/projects/[projectId]/[envKey]/flags/[flagId]/audit/route.ts`:

```ts
// GET /api/projects/:projectId/:envKey/flags/:flagId/audit → list audit entries
```

### 1.7 Deploy Firestore rules

```bash
firebase login
firebase use --add    # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

### 1.8 Verify

- [ ] `pnpm --filter @flagbase/dashboard dev` starts without errors
- [ ] `POST /api/projects` creates a project in Firestore (test via curl or Postman)
- [ ] Firestore rules block unauthenticated access in Firebase console

---

## Phase 2 — Authentication UI

**Goal:** login/logout flow, session cookie, protected routes.

### 2.1 Login page

`src/app/(auth)/login/page.tsx` — client component:

- Email + password form
- Calls `signInWithEmailAndPassword` from Firebase client SDK
- On success: sends ID token to `POST /api/auth/session` to create a server-side session cookie
- Redirects to `/dashboard`

### 2.2 Session cookie API route

`src/app/api/auth/session/route.ts`:

```ts
// POST — receives idToken, creates 14-day session cookie via adminAuth.createSessionCookie()
// DELETE — clears the cookie (logout)
```

Why a session cookie instead of the client token: Next.js server components and API routes can't read `localStorage`. A `HttpOnly` session cookie is the standard pattern for Firebase Auth + Next.js App Router.

### 2.3 Middleware for protected routes

`src/middleware.ts`:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const session = req.cookies.get('__session')
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
```

### 2.4 Auth context for client components

`src/lib/client/auth-context.tsx`:

- Wraps Firebase `onAuthStateChanged`
- Exposes `user`, `loading`, `logout()` to all client components

### 2.5 Register page (optional for self-hosted)

Since this is self-hosted, registration can be restricted to admin-only invite flow. For now, a simple `createUserWithEmailAndPassword` page is enough. Add a `NEXT_PUBLIC_ALLOW_REGISTRATION=true` env flag to toggle it.

### Deliverables

- [ ] `/login` page working
- [ ] Session cookie set on login, cleared on logout
- [ ] `/dashboard` and all sub-routes redirect to `/login` when unauthenticated
- [ ] `requireAuth()` utility working in all API routes

---

## Phase 3 — Core SDK (already done) + Firestore data model verification

**Goal:** verify the SDK works end-to-end against a real Firestore project. The code is already written — this phase is integration testing.

### 3.1 Firestore collection structure

Confirm this structure is in place after Phase 1 project creation:

```
projects/
└── {projectId}/
    ├── name: string
    ├── slug: string
    ├── ownerId: string (Firebase Auth UID)
    ├── environments: Environment[]   ← embedded array
    ├── createdAt: ISO string
    └── updatedAt: ISO string
    │
    └── environments/
        └── {envKey}/                 ← "development" | "staging" | "production"
            ├── apiKey: string        ← fb_xxxxxxxx
            └── flags/
                └── {flagId}/
                    ├── key: string
                    ├── enabled: boolean
                    ├── defaultValue: any
                    ├── rolloutPercentage: number
                    ├── rules: TargetingRule[]
                    ├── createdAt: ISO string
                    └── updatedAt: ISO string
                    │
                    └── audit/
                        └── {auditId}/
                            ├── action: AuditAction
                            ├── before: Partial<Flag> | null
                            ├── after: Partial<Flag> | null
                            ├── performedBy: string (UID)
                            └── performedAt: ISO string
```

### 3.2 SDK integration test

Create a minimal test script at `packages/sdk/src/__tests__/integration.test.ts` (skipped in CI, run manually):

```ts
// Requires a real Firebase project — skip in CI with:
// it.skipIf(process.env.CI)('connects to Firestore', async () => { ... })
```

Tests:
- `client.waitUntilReady()` resolves within 5 seconds
- `client.get('nonexistent-flag', {}, false)` returns `false` without throwing
- Creating a flag via API, then evaluating it via SDK returns the correct value
- Disabling a flag propagates to `onSnapshot` within 2 seconds

### 3.3 Verify evaluation engine against real data

Manually create flags in Firebase Console with:
- A boolean flag at 100% rollout → should return `true` for all users
- A targeting rule matching `country = LB` → should return variant only for `{ country: 'LB' }`
- A flag at 0% rollout → should return `defaultValue` for all users

### Deliverables

- [ ] SDK connects to real Firestore project
- [ ] `onSnapshot` updates propagate in real-time when a flag is toggled in Firebase Console
- [ ] Evaluation logic confirmed correct against real data

---

## Phase 4 — Admin Dashboard UI

**Goal:** full flag management UI. The most time-intensive phase.

### 4.1 Layout and navigation

`src/app/dashboard/layout.tsx`:

- Sidebar with: Projects, Flags, Audit Log, Settings
- Environment switcher (Development / Staging / Production) — persisted in URL or localStorage
- User avatar + logout button

### 4.2 Projects page

`src/app/dashboard/page.tsx`:

- List of projects (fetched server-side from Firestore)
- "New project" button → modal with name + slug fields
- Click project → navigate to `/dashboard/[projectId]`

### 4.3 Flags list page

`src/app/dashboard/[projectId]/flags/page.tsx`:

**Table columns:** Key · Name · Type · Status (toggle) · Rollout % · Last updated · Actions

Features:
- Toggle `enabled` inline (optimistic update, PATCH to API)
- Filter by status (enabled / disabled / all)
- Filter by type (boolean / string / number / json)
- Search by key or name
- "New flag" button → opens flag form

### 4.4 Flag form (create + edit)

`src/components/flags/FlagForm.tsx` — shared between create and edit:

**Fields:**

| Field | Input type | Notes |
|---|---|---|
| Name | text | human-readable |
| Key | text | auto-slugified from name, locked after create |
| Description | textarea | optional |
| Type | select | boolean / string / number / json |
| Default value | dynamic | changes based on type |
| Rollout % | range slider 0–100 | shows live percentage |
| Enabled | toggle | |
| Tags | tag input | optional |

**Targeting rules builder:**
- "Add rule" button adds a rule row
- Each rule: name, priority (number input), conditions (attribute + operator + value), serve value
- Conditions: "Add condition" within a rule, all conditions use AND logic
- Rules are sortable by priority number

### 4.5 Flag detail page

`src/app/dashboard/[projectId]/flags/[flagId]/page.tsx`:

- Flag overview (read-only summary)
- Edit form (same FlagForm component)
- Targeting rules section
- Audit log table (last 50 entries)
- Danger zone: Delete flag (confirmation dialog)

### 4.6 Audit log page

`src/app/dashboard/[projectId]/audit/page.tsx`:

- Paginated table of all audit entries across all flags
- Columns: Timestamp · Flag key · Action · Changed by
- Click row → expand diff view (before/after JSON)

### 4.7 Settings page

`src/app/dashboard/[projectId]/settings/page.tsx`:

- Project name (editable)
- Environment API keys (read-only, copy button, regenerate button)
- Danger zone: Delete project

### Deliverables

- [ ] Can create, edit, enable/disable, and delete flags from the UI
- [ ] Rollout percentage slider saves correctly
- [ ] Targeting rule builder saves and evaluates correctly
- [ ] Audit log shows history per flag
- [ ] Environment switcher changes which flag set is shown

---

## Phase 5 — npm publish + docs

**Goal:** ship `flagbase-js` and `@flagbase/react` to npm, write the README and docs.

### 5.1 Prepare packages for publish

Update `packages/sdk/package.json`:
- Set `"private": false`
- Add `"repository"`, `"homepage"`, `"bugs"` fields pointing to GitHub
- Add `"keywords"` array

Update `packages/sdk-react/package.json`:
- Same as above

### 5.2 Build pipeline

Create `packages/sdk/tsup.config.ts`:

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['firebase'],   // peer dep — don't bundle
})
```

Same for `sdk-react`, adding `react` to external.

### 5.3 GitHub Actions — CI

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm --filter @flagbase/types build
      - run: pnpm --filter flagbase-js build
      - run: pnpm --filter flagbase-js test
      - run: pnpm --filter @flagbase/dashboard build
```

### 5.4 GitHub Actions — npm publish

`.github/workflows/publish.yml`:

```yaml
name: Publish
on:
  push:
    tags: ['sdk-v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: pnpm install
      - run: pnpm --filter @flagbase/types build
      - run: pnpm --filter flagbase-js build
      - run: pnpm --filter @flagbase/react build
      - run: pnpm --filter flagbase-js publish --no-git-checks
      - run: pnpm --filter @flagbase/react publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Trigger a release by tagging: `git tag sdk-v0.1.0 && git push --tags`

### 5.5 README

Update root `README.md` with:
- Badges: npm version, CI status, license
- Quick start (Firebase project setup → install SDK → first flag)
- Full API reference for `FlagbaseClient`
- React usage examples
- Self-hosting guide (link to dashboard deploy instructions)
- Firestore data model diagram

### 5.6 Dashboard deploy (optional)

Deploy the Next.js dashboard to Vercel or a self-hosted VPS:

```bash
# Vercel
vercel --prod

# Or build and self-host
pnpm --filter @flagbase/dashboard build
pnpm --filter @flagbase/dashboard start
```

Add a `NEXTAUTH_SECRET` or similar if session security needs hardening.

### Deliverables

- [ ] `flagbase-js` published to npm
- [ ] `@flagbase/react` published to npm
- [ ] CI passes on every push
- [ ] npm publish triggers automatically on version tag
- [ ] README covers everything needed to self-host and use the SDK

---

## Summary

| Phase | Focus | Key output |
|---|---|---|
| 1 | Refactor + Firebase wiring | Delete functions, API routes in Next.js, rules deployed |
| 2 | Auth | Login, session cookie, protected routes |
| 3 | SDK integration | Real Firestore connection verified, onSnapshot confirmed |
| 4 | Dashboard UI | Full flag CRUD, rule builder, audit log |
| 5 | Ship | npm packages, GitHub Actions, docs |

---

## File tree after all phases

```
flagbase/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
├── apps/
│   └── dashboard/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   └── login/
│       │   │   │       └── page.tsx
│       │   │   ├── api/
│       │   │   │   ├── auth/
│       │   │   │   │   └── session/
│       │   │   │   │       └── route.ts
│       │   │   │   └── projects/
│       │   │   │       ├── route.ts
│       │   │   │       └── [projectId]/
│       │   │   │           ├── route.ts
│       │   │   │           └── [envKey]/
│       │   │   │               └── flags/
│       │   │   │                   ├── route.ts
│       │   │   │                   └── [flagId]/
│       │   │   │                       ├── route.ts
│       │   │   │                       └── audit/
│       │   │   │                           └── route.ts
│       │   │   ├── dashboard/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx
│       │   │   │   └── [projectId]/
│       │   │   │       ├── flags/
│       │   │   │       │   ├── page.tsx
│       │   │   │       │   └── [flagId]/
│       │   │   │       │       └── page.tsx
│       │   │   │       ├── audit/
│       │   │   │       │   └── page.tsx
│       │   │   │       └── settings/
│       │   │   │           └── page.tsx
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── flags/
│       │   │   │   ├── FlagForm.tsx
│       │   │   │   ├── FlagTable.tsx
│       │   │   │   └── RuleBuilder.tsx
│       │   │   └── ui/
│       │   │       ├── Button.tsx
│       │   │       ├── Toggle.tsx
│       │   │       ├── Modal.tsx
│       │   │       └── Badge.tsx
│       │   └── lib/
│       │       ├── client/
│       │       │   └── auth-context.tsx
│       │       └── server/
│       │           ├── firebase-admin.ts
│       │           ├── auth.ts
│       │           ├── audit.ts
│       │           └── db.ts
│       ├── .env.example
│       └── middleware.ts
├── packages/
│   ├── sdk/              ✅ complete
│   ├── sdk-react/        ✅ complete
│   └── types/            ✅ complete
├── firebase.json         (functions block removed)
├── firestore.rules
├── firestore.indexes.json
└── README.md
```