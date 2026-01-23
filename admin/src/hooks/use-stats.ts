import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'

interface Stats {
  collections: number
  entries: number
  media: number
  users: number
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      // Fetch all the data in parallel
      const [collections, media, users] = await Promise.all([
        fetcher<Array<{ id: string }>>('/admin/collections'),
        fetcher<{ items: Array<{ id: string }> }>('/admin/media'),
        fetcher<Array<{ id: string }>>('/admin/users'),
      ])

      const stats: Stats = {
        collections: collections.length,
        entries: 0, // TODO: Need a way to get total entries count across all collections
        media: media.items.length,
        users: users.length,
      }

      return stats
    },
  })
}
