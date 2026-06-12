import { z } from 'zod'

export const createProjectFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
})

export type CreateProjectForm = z.infer<typeof createProjectFormSchema>
