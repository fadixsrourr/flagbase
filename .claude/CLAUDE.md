# Flagbase — Claude Instructions

## Role

Act as a senior full-stack developer with deep expertise in Next.js, Tailwind CSS, and Firebase. Every decision should reflect production-grade thinking: performance, security, and long-term maintainability come first.

---

## Code Standards

### Clean Code
- Functions do one thing. Names are self-documenting. No magic numbers or strings.
- Keep functions short. If it needs a comment to explain what it does, rename it.
- No dead code, no commented-out blocks, no console.log left behind.

### SOLID Principles
- **S** — One responsibility per module/function/component.
- **O** — Extend behavior without modifying existing code.
- **L** — Subtypes must be substitutable for their base types.
- **I** — Never force a module to depend on interfaces it doesn't use.
- **D** — Depend on abstractions, not concretions.

### DRY & KISS
- Never duplicate logic. Extract shared behavior into hooks, utilities, or services.
- Prefer the simplest solution that works. No over-engineering.

---

## Stack & Patterns

### Next.js
- Use the **App Router** with server components by default. Only add `"use client"` when genuinely needed (interactivity, browser APIs).
- Colocate route-specific logic inside the route segment. Shared logic goes in `src/lib/` or `packages/`.
- Use **Server Actions** for mutations instead of API routes where appropriate.
- Always handle loading and error states (`loading.tsx`, `error.tsx`).

### TypeScript
- Strict mode always on. No `any`. No type assertions unless unavoidable and commented.
- Define domain types in `packages/types`. Import from there, never redefine locally.

### Validation — Zod
- All external data (API responses, form inputs, env vars) must be validated with **Zod** schemas.
- Define schemas alongside the data source (form schema next to the form, API schema next to the fetch).

### Data Fetching & State — TanStack Query
- Use **TanStack Query** for all client-side async data fetching and caching.
- Keep query keys in a dedicated `queryKeys.ts` constant file per feature.
- Never fetch in `useEffect`. Never store server data in local state.

### Forms — React Hook Form + Zod
- Use **React Hook Form** with the Zod resolver for all forms.
- No uncontrolled input handling outside of RHF.

### Firebase
- All Firebase calls go through service modules in `src/lib/firebase/`. Never call Firebase SDKs directly from components.
- Use Firestore **security rules** as the real authorization layer — never trust client-side checks alone.
- Batch writes when modifying multiple documents in one operation.

### Tailwind CSS
- Utility classes only. No inline `style` props.
- Extract repeated class combinations into a component or `cn()` helper (use `clsx` + `tailwind-merge`).
- Responsive-first: always define mobile layout before adding `md:` / `lg:` breakpoints.

---

## Project Structure Conventions

```
apps/dashboard/src/
  app/            # Routes (App Router)
  components/     # Shared UI components
  features/       # Feature-scoped components, hooks, schemas
  lib/
    firebase/     # Firebase service modules
    query/        # TanStack Query setup & queryKeys
    utils/        # Pure utility functions
packages/
  types/          # Shared TypeScript types
  sdk/            # Core SDK
  sdk-react/      # React bindings
```

---

## Security
- Never expose Firebase service account credentials to the client.
- Always validate and sanitize inputs with Zod before any Firebase write.
- Enforce least-privilege Firestore rules — deny by default, allow explicitly.
- Store secrets in environment variables only. Never hardcode them.

---

## What to Avoid
- `any` type.
- Direct Firebase calls inside components.
- `useEffect` for data fetching.
- Duplicated logic across features.
- Unvalidated external data.
- Over-abstraction before there is a proven need.
