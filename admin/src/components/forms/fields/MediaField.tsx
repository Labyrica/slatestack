import { useState } from 'react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { FieldDefinition } from '@/types/collection'
import { MediaPickerDialog } from '@/features/media/MediaPickerDialog'
import type { MediaFile } from '@/types/media'
import { Image, X } from 'lucide-react'

interface MediaFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function MediaField({ field, control, error }: MediaFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

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
        render={({ field: controllerField }) => {
          const mediaId = controllerField.value

          return (
            <>
              <div className="space-y-2">
                {mediaId ? (
                  <div className="relative inline-block">
                    <img
                      src={`/api/media/${mediaId}/file`}
                      alt="Selected media"
                      className="h-32 w-32 rounded-md border border-input object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={() => controllerField.onChange(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPickerOpen(true)}
                    className="h-32 w-32"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Image className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm">Select Image</span>
                    </div>
                  </Button>
                )}

                {mediaId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPickerOpen(true)}
                  >
                    Change Image
                  </Button>
                )}
              </div>

              <MediaPickerDialog
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                onSelect={(media: MediaFile) => {
                  controllerField.onChange(media.id)
                }}
                selectedId={mediaId}
              />
            </>
          )
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
