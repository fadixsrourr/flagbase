'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Warning } from '@phosphor-icons/react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { ApiError } from '@/lib/client/api'
import { slugify } from '@/lib/utils/slugify'
import { createProjectFormSchema, type CreateProjectForm } from './project-schema'
import { useCreateProject } from './hooks'

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const create = useCreateProject()
  const [slugEdited, setSlugEdited] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: { name: '', slug: '' },
  })

  const nameField = register('name')
  const slugField = register('slug')

  function close() {
    reset()
    setSlugEdited(false)
    onClose()
  }

  async function onSubmit(values: CreateProjectForm) {
    try {
      const project = await create.mutateAsync(values)
      close()
      router.push(`/dashboard/${project.id}/flags`)
    } catch (error) {
      setError('root', {
        message: error instanceof ApiError ? error.message : 'Could not create project',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New project"
      description="Projects ship with development, staging and production environments."
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="new-project-form" loading={isSubmitting}>
            Create project
          </Button>
        </>
      }
    >
      <form
        id="new-project-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <TextField
          label="Name"
          placeholder="Checkout Service"
          autoFocus
          error={errors.name?.message}
          {...nameField}
          onChange={(e) => {
            nameField.onChange(e)
            if (!slugEdited) setValue('slug', slugify(e.target.value), { shouldValidate: true })
          }}
        />
        <TextField
          label="Slug"
          placeholder="checkout-service"
          hint="Used in URLs and the SDK config."
          error={errors.slug?.message}
          {...slugField}
          onChange={(e) => {
            setSlugEdited(true)
            slugField.onChange(e)
          }}
        />
        {errors.root && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-control border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          >
            <Warning weight="fill" className="size-4 shrink-0" aria-hidden />
            <span>{errors.root.message}</span>
          </div>
        )}
      </form>
    </Modal>
  )
}
