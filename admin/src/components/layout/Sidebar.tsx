import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Image, Users, LogOut, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from '@/lib/auth'

export function Sidebar() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut()
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/collections', label: 'Collections', icon: FolderOpen },
    { to: '/metrics', label: 'Metrics', icon: BarChart3 },
    { to: '/media', label: 'Media', icon: Image },
  ]

  // Only show Users link if user is admin
  if (session?.user && (session.user as any).role === 'admin') {
    navItems.push({ to: '/users', label: 'Users', icon: Users })
  }

  return (
    <div className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Slatestack</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
