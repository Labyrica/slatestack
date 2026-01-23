import { useEffect } from 'react'

export function useTheme() {
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')  // Always dark for Arsenal
  }, [])

  return { theme: 'dark' as const, isDark: true }
}
