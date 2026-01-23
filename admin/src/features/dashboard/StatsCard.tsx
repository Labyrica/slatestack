import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  isLoading?: boolean
}

export function StatsCard({ title, value, icon: Icon, isLoading }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-3xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
