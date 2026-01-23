import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import { toast } from 'sonner'
import type { MediaFile, MediaListResponse, ImageInfo, MediaType, CropData } from '@/types/media'

interface UseMediaParams {
  type?: MediaType
  search?: string
  page?: number
  limit?: number
}

export function useMedia(params: UseMediaParams = {}) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.type && params.type !== 'all') queryParams.append('type', params.type)
  if (params.search) queryParams.append('q', params.search)

  const queryString = queryParams.toString()

  return useQuery({
    queryKey: ['media', params],
    queryFn: () => fetcher<MediaListResponse>(`/admin/media${queryString ? `?${queryString}` : ''}`),
  })
}

export function useSingleMedia(id: string) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: () => fetcher<MediaFile>(`/admin/media/${id}`),
    enabled: !!id,
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const formData = new FormData()

      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast.success('File(s) uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Upload failed')
    },
  })
}

export function useUpdateMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, altText }: { id: string; altText?: string }) => {
      return fetcher<MediaFile>(`/admin/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ altText }),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      queryClient.invalidateQueries({ queryKey: ['media', data.id] })
      toast.success('Media updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Update failed')
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast.success('Media deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Delete failed')
    },
  })
}

export function useImageInfo(id: string) {
  return useQuery({
    queryKey: ['media', id, 'info'],
    queryFn: () => fetcher<ImageInfo>(`/admin/media/${id}/info`),
    enabled: !!id,
  })
}

export function useCropImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, crop }: { id: string; crop: CropData }) => {
      return fetcher<MediaFile>(`/admin/media/${id}/crop`, {
        method: 'POST',
        body: JSON.stringify(crop),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast.success('Image cropped successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Crop failed')
    },
  })
}
