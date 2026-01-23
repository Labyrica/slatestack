import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'secondary'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
            variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
            variant === 'warning',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
