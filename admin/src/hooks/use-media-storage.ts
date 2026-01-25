import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'

interface StorageStats {
  total: number
  breakdown: {
    images: number
    videos: number
    documents: number
    audio: number
  }
}

export function useMediaStorage() {
  return useQuery({
    queryKey: ['media', 'storage'],
    queryFn: () => fetcher<StorageStats>('/admin/media/storage'),
    staleTime: 5 * 60 * 1000, // 5 minutes - storage changes infrequently
  })
}
