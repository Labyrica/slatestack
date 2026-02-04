import { useSystemInfo } from '@/hooks/use-system-info'
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

  if (session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-4">
      {data?.version && (
        <p className="text-sm text-muted-foreground">Version {data.version}</p>
      )}
      <HealthDashboard />
    </div>
  )
}
