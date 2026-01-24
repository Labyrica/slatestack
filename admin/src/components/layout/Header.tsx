import { useSession } from '@/lib/auth'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h2 className="text-xl font-semibold">{title}</h2>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{session.user.name}</span>
            <span className="text-muted-foreground">({(session.user as any).role})</span>
          </div>
        )}
      </div>
    </header>
  )
}
