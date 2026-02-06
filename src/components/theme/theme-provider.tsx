"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

const THEMES = ["cyberpunk", "modern-light", "modern-dark", "high-contrast"] as const

export type ThemeName = (typeof THEMES)[number]

interface ThemeProviderProps {
  readonly children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="cyberpunk"
      themes={[...THEMES]}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
