import type { ThemeMode, Tournament } from "@/core/tournament/types";
import { db } from "@/db/database";

const ACTIVE_TOURNAMENT_ID = "active" as const;
const THEME_KEY = "theme" as const;

export async function getActiveTournament() {
  const record = await db.tournaments.get(ACTIVE_TOURNAMENT_ID);
  return record?.tournament ?? null;
}

export async function saveActiveTournament(tournament: Tournament) {
  await db.tournaments.put({
    id: ACTIVE_TOURNAMENT_ID,
    tournament,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteActiveTournament() {
  await db.tournaments.delete(ACTIVE_TOURNAMENT_ID);
}

export async function getThemePreference(): Promise<ThemeMode | null> {
  const record = await db.preferences.get(THEME_KEY);
  return record?.value ?? null;
}

export async function saveThemePreference(value: ThemeMode) {
  await db.preferences.put({
    key: THEME_KEY,
    value,
    updatedAt: new Date().toISOString(),
  });
}
