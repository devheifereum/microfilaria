"use client"

import Link from "next/link"
import { Sun, Moon } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useTheme } from "@/components/ThemeProvider"

export function Navbar() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-14 items-center justify-between">
        <NavigationMenu className="max-w-none justify-start">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/">YOLO Detect (10x Image Only)</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/classification-detect">UNET Classification Detect (40x Image Only)</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isDarkMode
              ? "bg-white text-black hover:bg-gray-100"
              : "bg-black text-white hover:bg-gray-800"
          } shadow-md`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>
    </header>
  )
}
