import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-[400ms]"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Dialog content */}
      <div
        className={cn(
          "relative z-50 max-h-[90vh] w-full max-w-2xl overflow-auto",
          "rounded-[16px] border border-white/15 bg-black p-6",
          "shadow-[0_16px_32px_rgba(0,0,0,0.5)]",
          "transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}
      >
        {children}
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  children: React.ReactNode
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

interface DialogTitleProps {
  children: React.ReactNode
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <h2 className="text-xl font-semibold tracking-tight">{children}</h2>
}

interface DialogDescriptionProps {
  children: React.ReactNode
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return <p className="text-sm text-white/60 mt-2">{children}</p>
}

interface DialogFooterProps {
  children: React.ReactNode
}

export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      {children}
    </div>
  )
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={cn("mt-4", className)}>{children}</div>
}
