"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type ThemeContextType = {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

/**
 * Reads the stored / system theme preference synchronously-safe:
 * - localStorage "theme" → "dark" | "light"
 * - Falls back to prefers-color-scheme
 */
function getInitialDark(): boolean {
  if (typeof window === "undefined") return false
  try {
    const stored = localStorage.getItem("theme")
    if (stored === "dark") return true
    if (stored === "light") return false
  } catch {
    // localStorage may be blocked
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDark)

  // Keep <html> class and localStorage in sync
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light")
    } catch {
      // ignore
    }
  }, [isDarkMode])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev)
  }, [])

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
