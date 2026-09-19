"use client";

import { create } from "zustand";
import type { ThemeMode } from "@/core/tournament/types";
import { getThemePreference, saveThemePreference } from "@/db/repositories/tournament-repository";

interface PreferencesState {
  hydrated: boolean;
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  refreshResolvedTheme: () => void;
}

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hydrated: false,
  theme: "system",
  resolvedTheme: "light",
  hydrate: async () => {
    const savedTheme = await getThemePreference();
    const theme = savedTheme ?? "system";
    set({ hydrated: true, theme, resolvedTheme: resolveTheme(theme) });
    applyDocumentTheme(theme);
  },
  setTheme: async (theme) => {
    set({ theme, resolvedTheme: resolveTheme(theme) });
    applyDocumentTheme(theme);
    await saveThemePreference(theme);
  },
  refreshResolvedTheme: () => {
    const { theme } = get();
    set({ resolvedTheme: resolveTheme(theme) });
    applyDocumentTheme(theme);
  },
}));

export function applyDocumentTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;

  const meta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
  if (meta) {
    meta.content = resolved === "dark" ? "#121514" : "#F4F5F2";
  }
}
