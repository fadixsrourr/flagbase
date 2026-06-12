'use client'

import { useState, type ReactNode } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Warning } from '@phosphor-icons/react'
import type { Flag, FlagType } from '@flagbase/types'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { TextField } from '@/components/ui/TextField'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { TagInput } from '@/components/ui/TagInput'
import { ApiError } from '@/lib/client/api'
import { slugify } from '@/lib/utils/slugify'
import { TypedValueField } from './TypedValueField'
import { RuleBuilder } from './RuleBuilder'
import { useCreateFlag, useUpdateFlag } from './hooks'
import {
  flagFormSchema,
  flagToFormValues,
  emptyFormValues,
  formToCreateInput,
  defaultValueForType,
  FLAG_TYPE_OPTIONS,
  type FlagFormValues,
} from './flag-form'

interface FlagFormProps {
  projectId: string
  env: string
  flag?: Flag
  onSaved: (flag: Flag) => void
}

export function FlagForm({ projectId, env, flag, onSaved }: FlagFormProps) {
  const mode = flag ? 'edit' : 'create'
  const create = useCreateFlag(projectId, env)
  const update = useUpdateFlag(projectId, env, flag?.id ?? '')
  const [keyEdited, setKeyEdited] = useState(mode === 'edit')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FlagFormValues>({
    resolver: zodResolver(flagFormSchema),
    defaultValues: flag ? flagToFormValues(flag) : emptyFormValues(),
  })

  const type = watch('type')
  const nameField = register('name')
  const keyField = register('key')

  function changeType(next: FlagType) {
    setValue('type', next)
    setValue('defaultValue', defaultValueForType(next))
    getValues('rules').forEach((_, index) =>
      setValue(`rules.${index}.serveValue`, defaultValueForType(next))
    )
  }

  async function onSubmit(values: FlagFormValues) {
    const input = formToCreateInput(values)
    try {
      const saved =
        mode === 'create'
          ? await create.mutateAsync(input)
          : await update.mutateAsync(input)
      onSaved(saved)
    } catch (error) {
      setError('root', {
        message: error instanceof ApiError ? error.message : 'Could not save flag',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <Section title="Details">
        <TextField
          label="Name"
          placeholder="Beta banner"
          error={errors.name?.message}
          {...nameField}
          onChange={(e) => {
            nameField.onChange(e)
            if (!keyEdited) setValue('key', slugify(e.target.value), { shouldValidate: true })
          }}
        />
        <TextField
          label="Key"
          placeholder="beta-banner"
          disabled={mode === 'edit'}
          hint={mode === 'edit' ? 'Keys are locked after creation.' : 'Lowercase, numbers, - or _'}
          error={errors.key?.message}
          {...keyField}
          onChange={(e) => {
            setKeyEdited(true)
            keyField.onChange(e)
          }}
        />
        <Textarea
          label="Description"
          placeholder="What does this flag control?"
          {...register('description')}
        />
      </Section>

      <Section title="Value and rollout">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label="Type"
              options={FLAG_TYPE_OPTIONS}
              value={field.value}
              onChange={(e) => changeType(e.target.value as FlagType)}
            />
          )}
        />

        <TypedValueField
          control={control}
          name="defaultValue"
          type={type}
          label="Default value"
          error={errors.defaultValue?.message}
        />

        <Controller
          control={control}
          name="rolloutPercentage"
          render={({ field }) => (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-content-muted">Rollout</label>
                <span className="font-mono text-sm text-accent">{field.value}%</span>
              </div>
              <Slider
                value={Number(field.value)}
                onChange={field.onChange}
                aria-label="Rollout percentage"
              />
              <p className="text-xs text-content-faint">
                Share of users (by id) that get the rollout. Targeting rules always win.
              </p>
            </div>
          )}
        />

        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-control border border-line bg-surface-raised px-3.5 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-content">Enabled</span>
                <span className="text-xs text-content-faint">
                  When off, the flag serves its default with reason &quot;disabled&quot;.
                </span>
              </div>
              <Toggle checked={field.value} onChange={field.onChange} label="Enabled" />
            </div>
          )}
        />

        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-content-muted">Tags</label>
              <TagInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Add a tag and press Enter"
              />
            </div>
          )}
        />
      </Section>

      <Section title="Targeting">
        <RuleBuilder control={control} register={register} errors={errors} type={type} />
      </Section>

      {errors.root && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-control border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
        >
          <Warning weight="fill" className="size-4 shrink-0" aria-hidden />
          <span>{errors.root.message}</span>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <ButtonLink href={`/dashboard/${projectId}/flags?env=${env}`} variant="ghost">
          Cancel
        </ButtonLink>
        <Button type="submit" loading={isSubmitting}>
          {mode === 'create' ? 'Create flag' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="flex flex-col gap-5 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-content-faint">{title}</h2>
      {children}
    </Panel>
  )
}
