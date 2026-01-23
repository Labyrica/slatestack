import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useCreateEntry, useUpdateEntry } from '@/hooks/use-entries'
import type { Entry } from '@/types/entry'
import type { Collection, FieldDefinition } from '@/types/collection'
import { toast } from 'sonner'

interface EntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Collection
  entry?: Entry | null
  onSuccess?: () => void
}

export function EntryDialog({
  open,
  onOpenChange,
  collection,
  entry,
  onSuccess,
}: EntryDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useCreateEntry(collection.id)
  const updateMutation = useUpdateEntry(collection.id)

  const isEdit = !!entry

  // Initialize form with entry data when editing
  useEffect(() => {
    if (entry) {
      setFormData(entry.data)
      setStatus(entry.status)
    } else {
      // Initialize with empty values based on field types
      const initialData: Record<string, any> = {}
      collection.fields.forEach((field) => {
        if (field.type === 'boolean') {
          initialData[field.name] = false
        } else if (field.type === 'number') {
          initialData[field.name] = ''
        } else if (field.type === 'multi-select') {
          initialData[field.name] = []
        } else {
          initialData[field.name] = ''
        }
      })
      setFormData(initialData)
      setStatus('draft')
    }
    setErrors({})
  }, [entry, collection, open])

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    collection.fields.forEach((field) => {
      const value = formData[field.name]

      // Required field validation
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.name] = `${field.label} is required`
        }
      }

      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        // Number validation
        if (field.type === 'number') {
          const numValue = Number(value)
          if (isNaN(numValue)) {
            newErrors[field.name] = 'Must be a valid number'
          } else {
            if (field.min !== undefined && numValue < field.min) {
              newErrors[field.name] = `Must be at least ${field.min}`
            }
            if (field.max !== undefined && numValue > field.max) {
              newErrors[field.name] = `Must be at most ${field.max}`
            }
          }
        }

        // String length validation
        if (
          field.type === 'string' ||
          field.type === 'text' ||
          field.type === 'slug'
        ) {
          const strValue = String(value)
          if (field.minLength && strValue.length < field.minLength) {
            newErrors[field.name] = `Must be at least ${field.minLength} characters`
          }
          if (field.maxLength && strValue.length > field.maxLength) {
            newErrors[field.name] = `Must be at most ${field.maxLength} characters`
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix validation errors')
      return
    }

    // Convert empty strings to appropriate types
    const cleanedData: Record<string, any> = {}
    collection.fields.forEach((field) => {
      const value = formData[field.name]
      if (field.type === 'number' && value !== '') {
        cleanedData[field.name] = Number(value)
      } else if (field.type === 'boolean') {
        cleanedData[field.name] = Boolean(value)
      } else {
        cleanedData[field.name] = value
      }
    })

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: entry.id,
          data: { data: cleanedData, status },
        })
        toast.success('Entry updated successfully')
      } else {
        await createMutation.mutateAsync({
          data: cleanedData,
          status,
        })
        toast.success('Entry created successfully')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      // Handle validation errors from backend
      if (error?.details && Array.isArray(error.details)) {
        const backendErrors: Record<string, string> = {}
        error.details.forEach((detail: { field: string; message: string }) => {
          backendErrors[detail.field] = detail.message
        })
        setErrors(backendErrors)
        toast.error('Validation failed')
      } else {
        toast.error(error?.message || 'Failed to save entry')
      }
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.name] ?? ''

    switch (field.type) {
      case 'string':
      case 'slug':
        return (
          <Input
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            disabled={isPending}
          />
        )

      case 'text':
      case 'rich-text':
        return (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            disabled={isPending}
            rows={field.type === 'rich-text' ? 8 : 4}
          />
        )

      case 'number':
        return (
          <Input
            id={field.name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            disabled={isPending}
            min={field.min}
            max={field.max}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.name}
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        )

      case 'date':
        return (
          <Input
            id={field.name}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isPending}
          />
        )

      case 'select':
        return (
          <Select
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isPending}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        )

      case 'multi-select':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`${field.name}-${option}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v) => v !== option)
                    handleFieldChange(field.name, newValues)
                  }}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-input"
                />
                <Label
                  htmlFor={`${field.name}-${option}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'media':
        return (
          <div className="rounded-md border border-input p-4 text-center text-sm text-muted-foreground">
            Media picker will be implemented in Plan 06
          </div>
        )

      default:
        return (
          <Input
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            disabled={isPending}
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="relative z-50 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-background p-6 shadow-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Entry' : 'Create Entry'}
            </DialogTitle>
          </DialogHeader>

          <DialogContent className="space-y-4">
            {/* Status selector */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'draft' | 'published')
                }
                disabled={isPending}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>

            {/* Dynamic fields based on collection schema */}
            {collection.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type !== 'boolean' && (
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                )}
                {renderField(field)}
                {errors[field.name] && (
                  <p className="text-sm text-destructive">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? 'Updating...'
                  : 'Creating...'
                : isEdit
                  ? 'Update Entry'
                  : 'Create Entry'}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  )
}
