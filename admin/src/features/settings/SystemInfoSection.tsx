import { useSystemInfo } from '@/hooks/use-system-info'
import { Activity } from 'lucide-react'
import { HealthDashboard } from './HealthDashboard'

interface Session {
  user: {
    role: string
  }
}

interface SystemInfoSectionProps {
  session: Session
}

export function SystemInfoSection({ session }: SystemInfoSectionProps) {
  const { data } = useSystemInfo()

  // Only render for admins
  if (session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold">System Health</h2>
        </div>
        {data?.version && (
          <p className="text-sm text-muted-foreground">Version {data.version}</p>
        )}
      </div>
      <HealthDashboard />
    </div>
  )
}
