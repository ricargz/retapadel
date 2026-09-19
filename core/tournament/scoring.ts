import type { Match, Round } from "./types";
import { validateScore } from "./validators";

export function completeMatch(match: Match, scoreA: number, scoreB: number): Match {
  const error = validateScore(scoreA, scoreB);
  if (error) {
    throw new Error(error);
  }

  return {
    ...match,
    scoreA,
    scoreB,
    winner: scoreA === scoreB ? "draw" : scoreA > scoreB ? "A" : "B",
    status: "completed",
  };
}

export function recalculateRoundStatus(round: Round): Round {
  const completed = round.matches.every((match) => match.status === "completed");

  return {
    ...round,
    status: completed ? "completed" : "active",
    completedAt: completed ? round.completedAt ?? new Date().toISOString() : undefined,
  };
}

export function updateMatchScore(round: Round, matchId: string, scoreA: number, scoreB: number): Round {
  const nextRound = {
    ...round,
    matches: round.matches.map((match) => (match.id === matchId ? completeMatch(match, scoreA, scoreB) : match)),
  };

  return recalculateRoundStatus(nextRound);
}
