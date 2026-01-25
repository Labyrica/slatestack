import { Shell } from '@/components/layout/Shell'
import { useSession } from '@/lib/auth'
import { ProfileSection } from './ProfileSection'
import { PasswordSection } from './PasswordSection'
import { SystemInfoSection } from './SystemInfoSection'
import { PresetSelector } from './PresetSelector'

export function SettingsPage() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  const isAdmin = (session.user as any).role === 'admin'

  return (
    <Shell title="Settings">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and preferences
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Left column: Profile and Password */}
          <div className="space-y-6">
            <div
              className="animate-slide-up opacity-0"
              style={{ animationDelay: '500ms' }}
            >
              <ProfileSection session={session as any} />
            </div>
            <div
              className="animate-slide-up opacity-0"
              style={{ animationDelay: '620ms' }}
            >
              <PasswordSection />
            </div>
            <div
              className="animate-slide-up opacity-0"
              style={{ animationDelay: '740ms' }}
            >
              <PresetSelector />
            </div>
          </div>

          {/* Right column: System Info (admin only) */}
          {isAdmin && (
            <div
              className="animate-slide-up opacity-0"
              style={{ animationDelay: '500ms' }}
            >
              <SystemInfoSection session={session as any} />
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
