import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import type {
  Entry,
  CreateEntryInput,
  UpdateEntryInput,
  PaginatedEntriesResponse,
} from '@/types/entry'

// Query keys
const entryKeys = {
  all: ['entries'] as const,
  lists: () => [...entryKeys.all, 'list'] as const,
  list: (collectionId: string, params?: Record<string, unknown>) =>
    [...entryKeys.lists(), collectionId, params] as const,
  details: () => [...entryKeys.all, 'detail'] as const,
  detail: (collectionId: string, entryId: string) =>
    [...entryKeys.details(), collectionId, entryId] as const,
}

interface UseEntriesParams {
  q?: string
  status?: 'draft' | 'published' | 'all'
  page?: number
  limit?: number
}

// List entries in a collection
export function useEntries(collectionId: string, params?: UseEntriesParams) {
  const queryParams = new URLSearchParams()

  if (params?.q) {
    queryParams.append('q', params.q)
  }
  if (params?.status && params.status !== 'all') {
    queryParams.append('status', params.status)
  }
  if (params?.page) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString())
  }

  const queryString = queryParams.toString()
  const url = `/admin/collections/${collectionId}/entries${
    queryString ? `?${queryString}` : ''
  }`

  return useQuery({
    queryKey: entryKeys.list(collectionId, params as Record<string, unknown>),
    queryFn: () => fetcher<PaginatedEntriesResponse>(url),
    enabled: !!collectionId,
  })
}

// Get single entry
export function useEntry(collectionId: string, entryId: string) {
  return useQuery({
    queryKey: entryKeys.detail(collectionId, entryId),
    queryFn: () =>
      fetcher<Entry>(`/admin/collections/${collectionId}/entries/${entryId}`),
    enabled: !!collectionId && !!entryId,
  })
}

// Create entry
export function useCreateEntry(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEntryInput) =>
      fetcher<Entry>(`/admin/collections/${collectionId}/entries`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() })
    },
  })
}

// Update entry
export function useUpdateEntry(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryInput }) =>
      fetcher<Entry>(`/admin/collections/${collectionId}/entries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: entryKeys.detail(collectionId, data.id),
      })
    },
  })
}

// Delete entry
export function useDeleteEntry(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetcher<void>(`/admin/collections/${collectionId}/entries/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() })
    },
  })
}
