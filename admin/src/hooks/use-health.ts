import { useQuery, queryOptions } from '@tanstack/react-query'

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  database: 'connected' | 'disconnected'
  media: 'writable' | 'unavailable'
}

export interface UseHealthOptions {
  polling?: boolean  // true = 30s interval (header), false = single fetch (login)
}

export const healthQueryOptions = queryOptions({
  queryKey: ['health'] as const,
  queryFn: async (): Promise<HealthResponse> => {
    const response = await fetch('/api/health')
    if (!response.ok) {
      // Treat HTTP errors as system error
      return { status: 'error', database: 'disconnected', media: 'unavailable' }
    }
    return response.json()
  },
  staleTime: 25000,
  retry: 1,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})

export function useHealth(options: UseHealthOptions = { polling: true }) {
  return useQuery({
    ...healthQueryOptions,
    refetchInterval: options.polling ? 30000 : false,
    refetchIntervalInBackground: false,
  })
}
