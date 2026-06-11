import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'
import { flagsRouter } from './routes/flags'
import { projectsRouter } from './routes/projects'

admin.initializeApp()

// Flags CRUD: /flags/:projectId/:environmentKey
export const flags = onRequest({ region: 'us-central1' }, flagsRouter)

// Projects CRUD: /projects
export const projects = onRequest({ region: 'us-central1' }, projectsRouter)
