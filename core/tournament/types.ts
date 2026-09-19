export type ThemeMode = "system" | "light" | "dark";

export type TournamentStatus = "draft" | "active" | "completed";

export interface TournamentConfig {
  id: string;
  name?: string;
  createdAt: string;
  playerCount: number;
  courtCount: number;
  pointsForWin: number;
}

export interface Player {
  id: string;
  name: string;
  colorToken: string;
  order: number;
}

export interface Round {
  id: string;
  number: number;
  status: "pending" | "active" | "completed";
  matches: Match[];
  restingPlayerIds: string[];
  createdAt: string;
  completedAt?: string;
}

export interface Match {
  id: string;
  courtNumber: number;
  teamA: [string, string];
  teamB: [string, string];
  scoreA?: number;
  scoreB?: number;
  winner?: "A" | "B";
  status: "pending" | "completed";
}

export interface PlayerStats {
  playerId: string;
  played: number;
  won: number;
  lost: number;
  scoreFor: number;
  scoreAgainst: number;
  difference: number;
  points: number;
  rests: number;
}

export interface StandingRow extends PlayerStats {
  player: Player;
  position: number;
}

export interface Tournament {
  config: TournamentConfig;
  players: Player[];
  rounds: Round[];
  status: TournamentStatus;
  completedAt?: string;
}

export interface RotationHistory {
  pairCounts: Map<string, number>;
  opponentCounts: Map<string, number>;
  exactMatchCounts: Map<string, number>;
  courtCounts: Map<string, Map<number, number>>;
}

export interface RotationDiagnostics {
  restingPenalty: number;
  matchPenalty: number;
  consideredRestGroups: number;
  consideredMatchGroups: number;
}

export interface GeneratedRound {
  round: Round;
  diagnostics: RotationDiagnostics;
}
