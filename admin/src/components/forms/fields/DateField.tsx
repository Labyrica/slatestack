import { Controller, Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'

interface DateFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function DateField({ field, control, error }: DateFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        rules={{
          required: field.required ? `${field.label} is required` : false,
        }}
        render={({ field: controllerField }) => (
          <Input
            {...controllerField}
            id={field.name}
            type="date"
          />
        )}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
