"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className="p-2 rounded-full w-9 h-9 opacity-0">
                <span className="sr-only">Toggle theme</span>
            </button>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors relative w-9 h-9 flex items-center justify-center border border-transparent dark:border-white/5"
            aria-label="Toggle theme"
        >
            <Sun className="h-5 w-5 text-orange-500 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
            <Moon className="h-5 w-5 text-cyan-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
        </button>
    )
}
