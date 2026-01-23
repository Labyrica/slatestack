import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateEntry, useUpdateEntry } from '@/hooks/use-entries'
import type { Entry } from '@/types/entry'
import type { Collection } from '@/types/collection'
import { toast } from 'sonner'
import { DynamicForm } from '@/components/forms/DynamicForm'

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
  const createMutation = useCreateEntry(collection.id)
  const updateMutation = useUpdateEntry(collection.id)

  const isEdit = !!entry

  const handleSubmit = async (formData: {
    data: Record<string, any>
    status: 'draft' | 'published'
  }) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: entry.id,
          data: formData,
        })
        toast.success('Entry updated successfully')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Entry created successfully')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save entry')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="relative z-50 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-background p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Entry' : 'Create Entry'}
          </DialogTitle>
        </DialogHeader>

        <DialogContent className="mt-4">
          <DynamicForm
            collection={collection}
            defaultValues={entry?.data}
            defaultStatus={entry?.status}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isPending={isPending}
            submitLabel={isEdit ? 'Update Entry' : 'Create Entry'}
          />
        </DialogContent>
      </div>
    </Dialog>
  )
}
