import { useQuery } from '@tanstack/react-query'

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  database: 'connected' | 'disconnected'
  media: 'writable' | 'unavailable'
}

interface UseHealthOptions {
  polling?: boolean  // true = 30s interval (header), false = single fetch (login)
}

export function useHealth(options: UseHealthOptions = { polling: true }) {
  return useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<HealthResponse> => {
      const response = await fetch('/api/health')
      if (!response.ok) {
        // Treat HTTP errors as system error
        return { status: 'error', database: 'disconnected', media: 'unavailable' }
      }
      return response.json()
    },
    refetchInterval: options.polling ? 30000 : false,
    refetchIntervalInBackground: false,
    staleTime: 25000,
    retry: 1,
  })
}
