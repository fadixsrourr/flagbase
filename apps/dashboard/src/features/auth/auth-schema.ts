import { z } from 'zod'

export const MIN_PASSWORD_LENGTH = 8

export const authSchema = z
  .object({
    mode: z.enum(['signin', 'register']),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'register' && values.password.length < MIN_PASSWORD_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: `Use at least ${MIN_PASSWORD_LENGTH} characters`,
      })
    }
  })

export type AuthValues = z.infer<typeof authSchema>
