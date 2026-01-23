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
    <div className="flex h-screen w-60 flex-col border-r border-white/15 bg-black">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Slatestack</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[3px]",
                  "transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isActive
                    ? "bg-white/5 text-white border-b border-white"
                    : "text-white/60 hover:text-white hover:bg-white/[0.02] hover:scale-105"
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/15 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-white/[0.02] hover:scale-105 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
