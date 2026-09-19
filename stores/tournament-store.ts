"use client";

import { create } from "zustand";
import type { Match, Round, Tournament } from "@/core/tournament/types";
import { createTournament, generateNextRound as generateRound, assertRoundInvariants } from "@/core/tournament/rotation-engine";
import { updateMatchScore } from "@/core/tournament/scoring";
import { calculateStandings } from "@/core/tournament/statistics";
import { clampCourtCount, getMaximumCourts, validatePlayerNames, validateTournamentConfig } from "@/core/tournament/validators";
import { deleteActiveTournament, getActiveTournament, saveActiveTournament } from "@/db/repositories/tournament-repository";

export type AppScreen = "home" | "config" | "players" | "tournament" | "results";
export type TournamentTab = "round" | "history" | "standings";

interface TournamentDraft {
  playerCount: number;
  courtCount: number;
  name: string;
}

interface TournamentState {
  hydrated: boolean;
  tournament: Tournament | null;
  screen: AppScreen;
  selectedTab: TournamentTab;
  draft: TournamentDraft;
  playerNames: string[];
  error: string | null;
  lastSavedAt: string | null;
  hydrate: (preferredScreen?: AppScreen) => Promise<void>;
  goTo: (screen: AppScreen) => void;
  setSelectedTab: (tab: TournamentTab) => void;
  setDraft: (draft: Partial<TournamentDraft>) => void;
  beginNewTournament: () => void;
  proceedToPlayers: () => void;
  updatePlayerName: (index: number, name: string) => void;
  removePlayer: (index: number) => void;
  autofillPlayers: () => void;
  startTournament: () => Promise<void>;
  continueTournament: () => void;
  generateNextRound: () => Promise<void>;
  submitScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => Promise<void>;
  finishTournament: () => Promise<void>;
  deleteTournament: () => Promise<void>;
  clearError: () => void;
}

const demoNames = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elena",
  "Fer",
  "Gaby",
  "Hugo",
  "Iris",
  "Jorge",
  "Karla",
  "Leo",
  "Maya",
  "Nico",
  "Olga",
  "Pablo",
  "Rafa",
  "Sofi",
  "Tono",
  "Vera",
];

const initialDraft: TournamentDraft = {
  playerCount: 8,
  courtCount: 1,
  name: "Reta de padel",
};

export const useTournamentStore = create<TournamentState>((set, get) => ({
  hydrated: false,
  tournament: null,
  screen: "home",
  selectedTab: "round",
  draft: initialDraft,
  playerNames: Array.from({ length: initialDraft.playerCount }, (_, index) => `Jugador ${index + 1}`),
  error: null,
  lastSavedAt: null,
  hydrate: async (preferredScreen) => {
    const tournament = await getActiveTournament();
    set({
      hydrated: true,
      tournament,
      screen: preferredScreen === "tournament" && tournament ? "tournament" : preferredScreen === "results" && tournament?.status === "completed" ? "results" : "home",
      error: null,
    });
  },
  goTo: (screen) => set({ screen, error: null }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),
  setDraft: (partial) => {
    const current = get().draft;
    const nextPlayerCount = partial.playerCount ?? current.playerCount;
    const nextCourtCount = clampCourtCount(nextPlayerCount, partial.courtCount ?? current.courtCount);
    const names = resizeNames(get().playerNames, nextPlayerCount);

    set({
      draft: {
        ...current,
        ...partial,
        playerCount: nextPlayerCount,
        courtCount: nextCourtCount,
      },
      playerNames: names,
      error: null,
    });
  },
  beginNewTournament: () => {
    set({
      tournament: null,
      screen: "config",
      draft: initialDraft,
      playerNames: Array.from({ length: initialDraft.playerCount }, (_, index) => `Jugador ${index + 1}`),
      selectedTab: "round",
      error: null,
    });
  },
  proceedToPlayers: () => {
    const { draft } = get();
    const error = validateTournamentConfig(draft.playerCount, draft.courtCount);
    set(error ? { error } : { screen: "players", error: null });
  },
  updatePlayerName: (index, name) => {
    const playerNames = [...get().playerNames];
    playerNames[index] = name;
    set({ playerNames, error: null });
  },
  removePlayer: (index) => {
    const { playerNames, draft } = get();
    if (playerNames.length <= 4) {
      set({ error: "No puedes bajar de cuatro jugadores." });
      return;
    }

    const nextNames = playerNames.filter((_, candidateIndex) => candidateIndex !== index);
    const playerCount = nextNames.length;
    set({
      playerNames: nextNames,
      draft: {
        ...draft,
        playerCount,
        courtCount: clampCourtCount(playerCount, draft.courtCount),
      },
      error: null,
    });
  },
  autofillPlayers: () => {
    const playerNames = Array.from({ length: get().draft.playerCount }, (_, index) => demoNames[index] ?? `Jugador ${index + 1}`);
    set({ playerNames, error: null });
  },
  startTournament: async () => {
    const { draft, playerNames } = get();
    const configError = validateTournamentConfig(draft.playerCount, draft.courtCount);
    const nameError = validatePlayerNames(playerNames);
    const error = configError ?? nameError;
    if (error) {
      set({ error });
      return;
    }

    try {
      const tournament = createTournament(playerNames, draft.courtCount, draft.name);
      const { round } = generateRound(tournament);
      assertRoundInvariants(round, tournament.players, tournament.config.courtCount);
      const nextTournament = { ...tournament, rounds: [round] };
      await persist(nextTournament);
      set({ tournament: nextTournament, screen: "tournament", selectedTab: "round", error: null, lastSavedAt: new Date().toISOString() });
    } catch (errorValue) {
      set({ error: getErrorMessage(errorValue) });
    }
  },
  continueTournament: () => {
    const tournament = get().tournament;
    set({ screen: tournament?.status === "completed" ? "results" : "tournament", error: null });
  },
  generateNextRound: async () => {
    const tournament = get().tournament;
    if (!tournament) return;

    try {
      const { round } = generateRound(tournament);
      assertRoundInvariants(round, tournament.players, tournament.config.courtCount);
      const nextTournament = { ...tournament, rounds: [...tournament.rounds, round] };
      await persist(nextTournament);
      set({ tournament: nextTournament, selectedTab: "round", error: null, lastSavedAt: new Date().toISOString() });
    } catch (errorValue) {
      set({ error: getErrorMessage(errorValue) });
    }
  },
  submitScore: async (roundId, matchId, scoreA, scoreB) => {
    const tournament = get().tournament;
    if (!tournament) return;

    try {
      const rounds = tournament.rounds.map((round) => (round.id === roundId ? updateMatchScore(round, matchId, scoreA, scoreB) : round));
      const nextTournament = { ...tournament, rounds };
      await persist(nextTournament);
      set({ tournament: nextTournament, error: null, lastSavedAt: new Date().toISOString() });
    } catch (errorValue) {
      set({ error: getErrorMessage(errorValue) });
    }
  },
  finishTournament: async () => {
    const tournament = get().tournament;
    if (!tournament) return;

    const hasPendingMatches = tournament.rounds.some((round) => round.matches.some((match) => match.status !== "completed"));
    if (hasPendingMatches) {
      set({ error: "Hay partidos pendientes. Cierralos antes de finalizar el torneo." });
      return;
    }

    const nextTournament: Tournament = {
      ...tournament,
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    await persist(nextTournament);
    set({ tournament: nextTournament, screen: "results", error: null, lastSavedAt: new Date().toISOString() });
  },
  deleteTournament: async () => {
    await deleteActiveTournament();
    set({
      tournament: null,
      screen: "home",
      selectedTab: "round",
      error: null,
      lastSavedAt: null,
    });
  },
  clearError: () => set({ error: null }),
}));

export function selectActiveRound(tournament: Tournament | null): Round | null {
  if (!tournament) return null;
  return tournament.rounds.find((round) => round.status !== "completed") ?? tournament.rounds.at(-1) ?? null;
}

export function selectMatchById(round: Round, matchId: string): Match | undefined {
  return round.matches.find((match) => match.id === matchId);
}

export function selectStandings(tournament: Tournament | null) {
  if (!tournament) return [];
  return calculateStandings(tournament.players, tournament.rounds, tournament.config.pointsForWin);
}

export function getPlayerName(tournament: Tournament, playerId: string) {
  return tournament.players.find((player) => player.id === playerId)?.name ?? "Jugador";
}

export function canGenerateNextRound(tournament: Tournament | null) {
  const round = selectActiveRound(tournament);
  return Boolean(tournament && round && round.status === "completed" && tournament.status === "active");
}

function resizeNames(names: string[], playerCount: number) {
  return Array.from({ length: playerCount }, (_, index) => names[index] ?? `Jugador ${index + 1}`);
}

async function persist(tournament: Tournament) {
  await saveActiveTournament(tournament);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrio un problema inesperado.";
}

export function getMaximumCourtOptions(playerCount: number) {
  return Array.from({ length: getMaximumCourts(playerCount) }, (_, index) => index + 1);
}
