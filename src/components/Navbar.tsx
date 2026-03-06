"use client"

import Link from "next/link"
import Image from "next/image"
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
      <nav className="container grid h-14 grid-cols-[1fr_auto_1fr] items-center w-full max-w-full">
        <Link href="/" className="flex items-center gap-2 justify-self-start min-w-0">
          <Image
            src="/favicon.ico"
            alt=""
            width={28}
            height={28}
            className="rounded-md shrink-0"
          />
          <span className="font-semibold text-lg tracking-tight truncate">
            Microfilaria <span className="font-analyser font-normal lowercase">analyser</span>
          </span>
        </Link>

        <NavigationMenu className="max-w-none justify-center hidden sm:flex justify-self-center">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/detect">Detect</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/classification-detect">Classification</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center justify-end justify-self-end">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-muted"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>
    </header>
  )
}
