import { z } from "zod";

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 20;
export const DEFAULT_POINTS_FOR_WIN = 3;

export const playerNameSchema = z
  .string()
  .trim()
  .min(1, "Escribe un nombre.")
  .max(36, "Usa 36 caracteres o menos.");

export const scoreSchema = z
  .number()
  .int("El marcador debe ser entero.")
  .min(0, "El marcador no puede ser negativo.")
  .max(999, "El marcador es demasiado alto.");

export function getMaximumCourts(playerCount: number) {
  return Math.floor(playerCount / 4);
}

export function clampCourtCount(playerCount: number, requestedCourtCount: number) {
  return Math.min(Math.max(1, requestedCourtCount), getMaximumCourts(playerCount));
}

export function validateTournamentConfig(playerCount: number, courtCount: number) {
  if (!Number.isInteger(playerCount) || playerCount < MIN_PLAYERS) {
    return "Retapadel necesita al menos cuatro jugadores.";
  }

  if (playerCount > MAX_PLAYERS) {
    return `La V1 admite hasta ${MAX_PLAYERS} jugadores por dispositivo.`;
  }

  const maximumCourts = getMaximumCourts(playerCount);
  if (!Number.isInteger(courtCount) || courtCount < 1) {
    return "Selecciona al menos una cancha.";
  }

  if (courtCount > maximumCourts) {
    return `Con ${playerCount} jugadores solo puedes usar ${maximumCourts} cancha${maximumCourts === 1 ? "" : "s"}.`;
  }

  return null;
}

export function validatePlayerNames(names: string[]) {
  const normalized = names.map((name) => playerNameSchema.safeParse(name));
  const firstInvalid = normalized.find((result) => !result.success);
  if (firstInvalid && !firstInvalid.success) {
    return firstInvalid.error.issues[0]?.message ?? "Revisa los nombres.";
  }

  const lowered = names.map((name) => name.trim().toLocaleLowerCase("es-MX"));
  const duplicates = lowered.filter((name, index) => lowered.indexOf(name) !== index);
  if (duplicates.length > 0) {
    return "No se permiten nombres duplicados.";
  }

  return null;
}

export function validateScore(scoreA: number, scoreB: number) {
  const a = scoreSchema.safeParse(scoreA);
  const b = scoreSchema.safeParse(scoreB);

  if (!a.success) return a.error.issues[0]?.message ?? "Revisa el marcador A.";
  if (!b.success) return b.error.issues[0]?.message ?? "Revisa el marcador B.";
  return null;
}
