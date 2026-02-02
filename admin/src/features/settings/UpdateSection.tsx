import { useUpdateCheck, UpdateCheckResult } from '@/hooks/use-update-check'
import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface ChangelogResult {
  releases: Array<{
    version: string
    name: string
    body: string
    publishedAt: string
    url: string
  }>
}

export function UpdateSection() {
  const { data: update, isLoading: checkLoading } = useUpdateCheck()

  const { data: changelog } = useQuery({
    queryKey: ['admin', 'update', 'changelog'],
    queryFn: () => fetcher<ChangelogResult>('/admin/update/changelog'),
    enabled: !!update?.updateAvailable,
    staleTime: 5 * 60 * 1000,
  })

  if (checkLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded" />
  }

  const latestRelease = changelog?.releases?.[0]
  const truncatedBody = latestRelease?.body
    ? latestRelease.body.length > 500
      ? latestRelease.body.slice(0, 500) + '...'
      : latestRelease.body
    : null

  return (
    <div className="space-y-4">
      {/* Version info */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Current version: <span className="font-mono text-foreground">{update?.currentVersion || 'Unknown'}</span>
        </span>
        {update?.updateAvailable && (
          <Badge variant="success">v{update.latestVersion} available</Badge>
        )}
      </div>

      {/* Update action */}
      {update?.updateAvailable && update.releaseUrl && (
        <div>
          <a
            href={update.releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on GitHub
          </a>
        </div>
      )}

      {/* Changelog preview */}
      {latestRelease && truncatedBody && (
        <div className="mt-4 p-4 bg-muted/50 rounded">
          <h4 className="font-medium mb-2">What's new in v{latestRelease.version}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{truncatedBody}</p>
        </div>
      )}
    </div>
  )
}
