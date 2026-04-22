import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import { useSession } from '@/lib/auth'

interface Stats {
  collections: number
  entries: number
  media: number
  users?: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface EntryStats {
  total: number
}

export function useStats() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'admin'

  return useQuery({
    queryKey: ['stats', { isAdmin }],
    queryFn: async () => {
      // /admin/users is admin-only — only fetch it when the current user can.
      const [collections, media, entryStats, users] = await Promise.all([
        fetcher<Array<{ id: string }>>('/admin/collections'),
        fetcher<PaginatedResponse<{ id: string }>>('/admin/media'),
        fetcher<EntryStats>('/admin/entries/stats'),
        isAdmin ? fetcher<Array<{ id: string }>>('/admin/users') : Promise.resolve(null),
      ])

      const stats: Stats = {
        collections: collections.length,
        entries: entryStats.total,
        media: media.meta.total,
        users: users ? users.length : undefined,
      }

      return stats
    },
    throwOnError: true,
  })
}
