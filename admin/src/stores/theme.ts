import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      toggleTheme: () =>
        set((state) => {
          const themes: Theme[] = ['light', 'dark', 'system']
          const currentIndex = themes.indexOf(state.theme)
          const nextIndex = (currentIndex + 1) % themes.length
          return { theme: themes[nextIndex] }
        }),
    }),
    {
      name: 'slatestack-theme',
    }
  )
)
