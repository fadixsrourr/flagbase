export const flagKeys = {
  scope: (projectId: string, env: string) => ['flags', projectId, env] as const,
  list: (projectId: string, env: string) => [...flagKeys.scope(projectId, env), 'list'] as const,
  detail: (projectId: string, env: string, flagId: string) =>
    [...flagKeys.scope(projectId, env), 'detail', flagId] as const,
  flagAudit: (projectId: string, env: string, flagId: string) =>
    [...flagKeys.scope(projectId, env), 'audit', flagId] as const,
  projectAudit: (projectId: string, env: string) =>
    ['audit', projectId, env] as const,
}
