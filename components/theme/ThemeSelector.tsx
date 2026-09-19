"use client";

import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { usePreferencesStore } from "@/stores/preferences-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const theme = usePreferencesStore((state) => state.theme);
  const resolvedTheme = usePreferencesStore((state) => state.resolvedTheme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");
  const label = isDark ? "Oscuro" : "Claro";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={`Tema ${label.toLowerCase()}`}
            className={cn(
              "group inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface p-1 shadow-sm transition hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              compact ? "w-[86px]" : "px-1.5 pr-3",
            )}
            onClick={() => void setTheme(isDark ? "light" : "dark")}
          >
            <span className="relative grid h-9 w-[76px] shrink-0 grid-cols-2 rounded-full bg-surface-muted p-1">
              <motion.span
                className="absolute left-1 top-1 h-7 w-7 rounded-full bg-primary shadow-md"
                animate={{ x: isDark ? 40 : 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              />
              <span className={cn("relative z-10 grid h-7 place-items-center transition-colors", !isDark ? "text-primary-contrast" : "text-text-secondary")}>
                <Sun className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className={cn("relative z-10 grid h-7 place-items-center transition-colors", isDark ? "text-primary-contrast" : "text-text-secondary")}>
                <Moon className="h-4 w-4" aria-hidden="true" />
              </span>
            </span>
            {!compact ? <span className="text-sm font-bold text-text-primary">{label}</span> : null}
          </button>
        </TooltipTrigger>
        <TooltipContent>Cambiar a {isDark ? "claro" : "oscuro"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
