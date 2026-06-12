'use client'

import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form'
import { Plus, Trash, Target } from '@phosphor-icons/react'
import type { FlagType } from '@flagbase/types'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils/cn'
import { TypedValueField } from './TypedValueField'
import { OPERATOR_OPTIONS, defaultValueForType, type FlagFormValues } from './flag-form'

const inputClasses =
  'h-10 w-full rounded-control border border-line bg-surface-raised px-3 text-sm text-content placeholder:text-content-faint transition-colors hover:border-line-strong focus:border-accent/60'

interface RuleBuilderProps {
  control: Control<FlagFormValues>
  register: UseFormRegister<FlagFormValues>
  errors: FieldErrors<FlagFormValues>
  type: FlagType
}

export function RuleBuilder({ control, register, errors, type }: RuleBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'rules' })

  function addRule() {
    append({
      id: crypto.randomUUID(),
      name: '',
      priority: fields.length,
      serveValue: defaultValueForType(type),
      conditions: [{ attribute: '', operator: 'equals', value: '' }],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-content">Targeting rules</h3>
          <p className="text-sm text-content-faint">
            Serve a specific value when all of a rule&apos;s conditions match. Rules run by
            priority, lowest first.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addRule}>
          <Plus weight="bold" className="size-4" aria-hidden />
          Add rule
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-control border border-dashed border-line px-4 py-5 text-sm text-content-faint">
          <Target className="size-4" aria-hidden />
          No targeting rules. The default value is served to everyone in the rollout.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <RuleCard
              key={field.id}
              control={control}
              register={register}
              errors={errors}
              type={type}
              index={index}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RuleCard({
  control,
  register,
  errors,
  type,
  index,
  onRemove,
}: RuleBuilderProps & { index: number; onRemove: () => void }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `rules.${index}.conditions`,
  })
  const ruleErrors = errors.rules?.[index]

  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface-raised/40 p-4">
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-content-faint">Rule name</label>
          <input
            placeholder="Beta testers"
            className={cn(inputClasses, ruleErrors?.name && 'border-danger/70')}
            {...register(`rules.${index}.name`)}
          />
        </div>
        <div className="flex w-20 flex-col gap-1.5">
          <label className="text-xs font-medium text-content-faint">Priority</label>
          <input
            type="number"
            min={0}
            className={inputClasses}
            {...register(`rules.${index}.priority`)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove rule"
          className="mb-0.5 cursor-pointer rounded-control border border-line p-2 text-content-faint transition-colors hover:border-danger/40 hover:text-danger"
        >
          <Trash className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-2.5 rounded-control border border-line/60 bg-carbon/40 p-3">
        <span className="text-xs uppercase tracking-[0.12em] text-content-faint">When all match</span>
        {fields.map((condition, conditionIndex) => (
          <div key={condition.id} className="flex items-center gap-2">
            <input
              placeholder="attribute (e.g. country)"
              className={cn(inputClasses, 'flex-1')}
              {...register(`rules.${index}.conditions.${conditionIndex}.attribute`)}
            />
            <Select
              className="h-10 w-auto min-w-[150px]"
              options={OPERATOR_OPTIONS}
              {...register(`rules.${index}.conditions.${conditionIndex}.operator`)}
            />
            <input
              placeholder="value"
              className={cn(inputClasses, 'flex-1')}
              {...register(`rules.${index}.conditions.${conditionIndex}.value`)}
            />
            <button
              type="button"
              onClick={() => fields.length > 1 && remove(conditionIndex)}
              disabled={fields.length === 1}
              aria-label="Remove condition"
              className="cursor-pointer rounded-control p-2 text-content-faint transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ attribute: '', operator: 'equals', value: '' })}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-bright"
        >
          <Plus weight="bold" className="size-3.5" aria-hidden />
          Add condition
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <label className="text-xs font-medium text-content-faint">Serve value</label>
        <TypedValueField
          control={control}
          name={`rules.${index}.serveValue`}
          type={type}
          compact
          error={ruleErrors?.serveValue?.message}
        />
      </div>
    </div>
  )
}
