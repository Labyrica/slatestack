import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'accent'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'transition-all duration-[300ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:scale-105',
        {
          // Default - white on dark
          'bg-white/10 text-white border border-white/20': variant === 'default',
          // Success - green
          'bg-green-500/20 text-green-400 border border-green-500/30': variant === 'success',
          // Warning - orange
          'bg-orange-500/20 text-orange-400 border border-orange-500/30': variant === 'warning',
          // Destructive - red
          'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'destructive',
          // Secondary - subtle gray
          'bg-white/5 text-white/60 border border-white/10': variant === 'secondary',
          // Accent - blue (Arsenal primary accent)
          'bg-blue-500/20 text-blue-400 border border-blue-500/30': variant === 'accent',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
