import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHealth } from '@/hooks/use-health'
import { useSystemInfo } from '@/hooks/use-system-info'
import { Server } from 'lucide-react'

interface Session {
  user: {
    role: string
  }
}

interface SystemInfoSectionProps {
  session: Session
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export function SystemInfoSection({ session }: SystemInfoSectionProps) {
  const { data, isLoading } = useSystemInfo()
  const { data: health, isLoading: isHealthLoading } = useHealth({ polling: false })

  // Only render for admins
  if (session.user.role !== 'admin') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          System Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || isHealthLoading ? (
          <div className="space-y-3">
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">{data?.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Database</p>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    health?.database === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <p className="font-medium capitalize">{health?.database}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Node.js</p>
              <p className="font-medium">{data?.nodeVersion}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="font-medium">{data?.uptime ? formatUptime(data.uptime) : '-'}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
