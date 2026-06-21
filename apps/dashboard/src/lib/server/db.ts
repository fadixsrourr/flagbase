import { adminDb } from './firebase-admin'

export function projectsCollection() {
  return adminDb().collection('projects')
}

export function projectDoc(projectId: string) {
  return projectsCollection().doc(projectId)
}

export function environmentDoc(projectId: string, environmentKey: string) {
  return projectDoc(projectId).collection('environments').doc(environmentKey)
}

export function flagsCollection(projectId: string, environmentKey: string) {
  return environmentDoc(projectId, environmentKey).collection('flags')
}

export function auditCollection(
  projectId: string,
  environmentKey: string,
  flagId: string
) {
  return flagsCollection(projectId, environmentKey).doc(flagId).collection('audit')
}
