"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

const emptySubscribe = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg text-foreground hover:bg-muted sm:h-9 sm:w-9"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title="Toggle Light / Dark theme"
      className="h-8 w-8 cursor-pointer rounded-lg text-foreground hover:bg-muted sm:h-9 sm:w-9"
    >
      {isDark ? (
        <Sun className="h-4 w-4 scale-100 rotate-0 text-foreground transition-transform duration-200 sm:h-5 sm:w-5" />
      ) : (
        <Moon className="h-4 w-4 scale-100 rotate-0 text-foreground transition-transform duration-200 sm:h-5 sm:w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
