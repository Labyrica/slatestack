import { Shell } from '@/components/layout/Shell'
import { StatsCard } from './StatsCard'
import { useStats } from '@/hooks/use-stats'
import { FolderOpen, FileText, Image, Users } from 'lucide-react'

export function DashboardPage() {
  const { data: stats, isLoading } = useStats()

  return (
    <Shell title="Dashboard">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of your Slatestack CMS
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Collections"
            value={stats?.collections ?? 0}
            icon={FolderOpen}
            isLoading={isLoading}
          />
          <StatsCard
            title="Entries"
            value={stats?.entries ?? 0}
            icon={FileText}
            isLoading={isLoading}
          />
          <StatsCard
            title="Media Files"
            value={stats?.media ?? 0}
            icon={Image}
            isLoading={isLoading}
          />
          <StatsCard
            title="Users"
            value={stats?.users ?? 0}
            icon={Users}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Shell>
  )
}
