import type { MediaFile } from '@/types/media'

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaFile) => void
  selectedId?: string
}

export function MediaPickerDialog({ open, onOpenChange, onSelect, selectedId }: MediaPickerDialogProps) {
  // Will be implemented in Task 3
  return null
}
