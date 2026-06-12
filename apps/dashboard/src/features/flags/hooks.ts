'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuditLogEntry, CreateFlagInput, Flag, UpdateFlagInput } from '@flagbase/types'
import { api } from '@/lib/client/api'
import { flagKeys } from './queryKeys'

function flagsUrl(projectId: string, env: string) {
  return `/api/projects/${projectId}/${env}/flags`
}

export function useFlags(projectId: string, env: string) {
  return useQuery({
    queryKey: flagKeys.list(projectId, env),
    queryFn: () => api.get<{ flags: Flag[] }>(flagsUrl(projectId, env)).then((r) => r.flags),
  })
}

export function useFlag(projectId: string, env: string, flagId: string) {
  return useQuery({
    queryKey: flagKeys.detail(projectId, env, flagId),
    queryFn: () =>
      api.get<{ flag: Flag }>(`${flagsUrl(projectId, env)}/${flagId}`).then((r) => r.flag),
  })
}

export function useCreateFlag(projectId: string, env: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFlagInput) =>
      api.post<{ flag: Flag }>(flagsUrl(projectId, env), input).then((r) => r.flag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: flagKeys.list(projectId, env) }),
  })
}

export function useUpdateFlag(projectId: string, env: string, flagId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateFlagInput) =>
      api.put<{ flag: Flag }>(`${flagsUrl(projectId, env)}/${flagId}`, input).then((r) => r.flag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flagKeys.list(projectId, env) })
      queryClient.invalidateQueries({ queryKey: flagKeys.detail(projectId, env, flagId) })
      queryClient.invalidateQueries({ queryKey: flagKeys.flagAudit(projectId, env, flagId) })
    },
  })
}

export function useDeleteFlag(projectId: string, env: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (flagId: string) => api.delete<void>(`${flagsUrl(projectId, env)}/${flagId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: flagKeys.list(projectId, env) }),
  })
}

/** Inline enable/disable with optimistic cache update and rollback on failure. */
export function useToggleFlag(projectId: string, env: string) {
  const queryClient = useQueryClient()
  const listKey = flagKeys.list(projectId, env)

  return useMutation({
    mutationFn: ({ flagId, enabled }: { flagId: string; enabled: boolean }) =>
      api.put<{ flag: Flag }>(`${flagsUrl(projectId, env)}/${flagId}`, { enabled }),
    onMutate: async ({ flagId, enabled }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<Flag[]>(listKey)
      queryClient.setQueryData<Flag[]>(listKey, (flags) =>
        flags?.map((flag) => (flag.id === flagId ? { ...flag, enabled } : flag))
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useFlagAudit(projectId: string, env: string, flagId: string) {
  return useQuery({
    queryKey: flagKeys.flagAudit(projectId, env, flagId),
    queryFn: () =>
      api
        .get<{ entries: AuditLogEntry[] }>(`${flagsUrl(projectId, env)}/${flagId}/audit`)
        .then((r) => r.entries),
  })
}

export function useProjectAudit(projectId: string, env: string) {
  return useQuery({
    queryKey: flagKeys.projectAudit(projectId, env),
    queryFn: () =>
      api
        .get<{ entries: AuditLogEntry[] }>(`/api/projects/${projectId}/${env}/audit`)
        .then((r) => r.entries),
  })
}
