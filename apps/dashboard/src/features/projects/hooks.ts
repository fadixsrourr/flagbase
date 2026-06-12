'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Project } from '@flagbase/types'
import { api } from '@/lib/client/api'
import { projectKeys } from './queryKeys'

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => api.get<{ projects: Project[] }>('/api/projects').then((r) => r.projects),
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () =>
      api.get<{ project: Project }>(`/api/projects/${projectId}`).then((r) => r.project),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; slug: string }) =>
      api.post<{ project: Project }>('/api/projects', input).then((r) => r.project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
  })
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api.patch<{ project: Project }>(`/api/projects/${projectId}`, input).then((r) => r.project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => api.delete<void>(`/api/projects/${projectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
  })
}

export function useRegenerateApiKey(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (envKey: string) =>
      api
        .post<{ apiKey: string }>(`/api/projects/${projectId}/environments/${envKey}/regenerate-key`)
        .then((r) => r.apiKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  })
}
