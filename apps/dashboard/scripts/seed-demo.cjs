/*
 * Seeds a demo project with a spread of flags so you can exercise the whole
 * dashboard + SDK against real data.
 *
 * Run from the repo root:
 *   node --env-file=apps/dashboard/.env apps/dashboard/scripts/seed-demo.cjs
 *
 * It creates one project owned by your account (development + production flags
 * + audit history) and prints the project id, dashboard link and SDK config.
 * Delete it later from the project's Settings page.
 */
const { randomBytes } = require('crypto')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

const OWNER_EMAIL = 'fadixsrour1@gmail.com'

let pk = process.env.FIREBASE_PRIVATE_KEY || ''
if (pk.includes('\\n')) pk = pk.replace(/\\n/g, '\n')
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: pk,
  }),
})

const db = getFirestore()
const now = () => new Date().toISOString()
const apiKey = () => `fb_${randomBytes(24).toString('hex')}`

function flag(overrides) {
  const ts = now()
  return {
    name: '',
    description: '',
    type: 'boolean',
    enabled: true,
    defaultValue: false,
    rolloutPercentage: 100,
    rules: [],
    tags: [],
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  }
}

const developmentFlags = [
  flag({ key: 'new-checkout', name: 'New checkout', type: 'boolean', enabled: true, defaultValue: false, rolloutPercentage: 50, tags: ['checkout', 'beta'] }),
  flag({ key: 'welcome-banner', name: 'Welcome banner', type: 'string', defaultValue: 'Welcome back', description: 'Greeting shown on the home page.' }),
  flag({ key: 'items-per-page', name: 'Items per page', type: 'number', defaultValue: 20 }),
  flag({ key: 'theme-tokens', name: 'Theme tokens', type: 'json', defaultValue: { accent: 'amber', radius: 8 } }),
  flag({
    key: 'beta-dashboard',
    name: 'Beta dashboard',
    type: 'boolean',
    defaultValue: false,
    rolloutPercentage: 100,
    rules: [
      {
        id: randomBytes(8).toString('hex'),
        name: 'Internal regions',
        priority: 0,
        serveValue: true,
        conditions: [{ attribute: 'country', operator: 'in', value: ['LB', 'US'] }],
      },
    ],
    tags: ['beta'],
  }),
  flag({ key: 'dark-mode', name: 'Dark mode', type: 'boolean', defaultValue: true }),
  flag({ key: 'legacy-export', name: 'Legacy export', type: 'boolean', enabled: false, defaultValue: true, tags: ['deprecated'] }),
]

const productionFlags = [
  flag({ key: 'new-checkout', name: 'New checkout', type: 'boolean', enabled: true, defaultValue: false, rolloutPercentage: 10, tags: ['checkout'] }),
  flag({ key: 'maintenance-mode', name: 'Maintenance mode', type: 'boolean', enabled: false, defaultValue: false }),
]

;(async () => {
  const owner = await getAuth().getUserByEmail(OWNER_EMAIL)

  const projectRef = db.collection('projects').doc()
  const environments = ['development', 'staging', 'production'].map((key) => ({
    id: key,
    key,
    name: key[0].toUpperCase() + key.slice(1),
    apiKey: apiKey(),
    createdAt: now(),
  }))

  const batch = db.batch()
  batch.set(projectRef, {
    id: projectRef.id,
    name: 'Acme Web (demo)',
    slug: 'acme-web-demo',
    ownerId: owner.uid,
    environments,
    createdAt: now(),
    updatedAt: now(),
  })
  for (const env of environments) {
    batch.set(projectRef.collection('environments').doc(env.key), env)
  }

  const seedFlags = (envKey, flags) => {
    for (const data of flags) {
      const ref = projectRef.collection('environments').doc(envKey).collection('flags').doc()
      const flagDoc = { id: ref.id, createdBy: owner.uid, ...data }
      batch.set(ref, flagDoc)
      const auditRef = ref.collection('audit').doc()
      batch.set(auditRef, {
        id: auditRef.id,
        flagId: ref.id,
        flagKey: data.key,
        action: 'flag.created',
        before: null,
        after: flagDoc,
        performedBy: owner.uid,
        performedAt: now(),
      })
    }
  }
  seedFlags('development', developmentFlags)
  seedFlags('production', productionFlags)

  await batch.commit()

  const devKey = environments.find((e) => e.key === 'development').apiKey
  console.log('\nDemo project seeded.')
  console.log('  project id : ' + projectRef.id)
  console.log('  dashboard  : http://localhost:3000/dashboard/' + projectRef.id + '/flags')
  console.log('  dev flags  : ' + developmentFlags.length + ' | prod flags: ' + productionFlags.length)
  console.log('\n  SDK config (development):')
  console.log('    projectId      : ' + projectRef.id)
  console.log('    environmentKey : development')
  console.log('    apiKey         : ' + devKey)
})().catch((e) => {
  console.error('SEED FAILED:', e.message)
  process.exit(1)
})
