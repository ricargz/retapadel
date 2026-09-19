import type { Match, Player, PlayerStats, Round, StandingRow } from "./types";

function createEmptyStats(playerId: string): PlayerStats {
  return {
    playerId,
    played: 0,
    won: 0,
    lost: 0,
    scoreFor: 0,
    scoreAgainst: 0,
    difference: 0,
    points: 0,
    rests: 0,
  };
}

function applyTeamStats(stats: Map<string, PlayerStats>, ids: [string, string], scoreFor: number, scoreAgainst: number, won: boolean, pointsForWin: number) {
  for (const playerId of ids) {
    const row = stats.get(playerId);
    if (!row) continue;

    row.played += 1;
    row.scoreFor += scoreFor;
    row.scoreAgainst += scoreAgainst;
    row.difference = row.scoreFor - row.scoreAgainst;
    if (won) {
      row.won += 1;
      row.points += pointsForWin;
    } else {
      row.lost += 1;
    }
  }
}

export function calculatePlayerStats(players: Player[], rounds: Round[], pointsForWin: number): PlayerStats[] {
  const stats = new Map(players.map((player) => [player.id, createEmptyStats(player.id)]));

  for (const round of rounds) {
    for (const playerId of round.restingPlayerIds) {
      const row = stats.get(playerId);
      if (row) row.rests += 1;
    }

    for (const match of round.matches) {
      if (!isCompletedMatch(match)) continue;

      applyTeamStats(stats, match.teamA, match.scoreA, match.scoreB, match.winner === "A", pointsForWin);
      applyTeamStats(stats, match.teamB, match.scoreB, match.scoreA, match.winner === "B", pointsForWin);
    }
  }

  return Array.from(stats.values());
}

export function calculateStandings(players: Player[], rounds: Round[], pointsForWin: number): StandingRow[] {
  const stats = calculatePlayerStats(players, rounds, pointsForWin);
  const playerById = new Map(players.map((player) => [player.id, player]));

  return stats
    .map((row) => {
      const player = playerById.get(row.playerId);
      if (!player) throw new Error(`Jugador desconocido: ${row.playerId}`);
      return { ...row, player, position: 0 };
    })
    .sort(compareStandingRows)
    .map((row, index) => ({ ...row, position: index + 1 }));
}

export function compareStandingRows(a: StandingRow, b: StandingRow) {
  return (
    b.points - a.points ||
    b.won - a.won ||
    b.difference - a.difference ||
    b.scoreFor - a.scoreFor ||
    a.lost - b.lost ||
    a.player.name.localeCompare(b.player.name, "es-MX")
  );
}

export function getTournamentTotals(rounds: Round[]) {
  const completedMatches = rounds.flatMap((round) => round.matches).filter(isCompletedMatch);
  const scoreTotal = completedMatches.reduce((sum, match) => sum + match.scoreA + match.scoreB, 0);

  return {
    completedRounds: rounds.filter((round) => round.status === "completed").length,
    completedMatches: completedMatches.length,
    scoreTotal,
  };
}

export function isCompletedMatch(match: Match): match is Match & { scoreA: number; scoreB: number; winner: "A" | "B" } {
  return match.status === "completed" && typeof match.scoreA === "number" && typeof match.scoreB === "number" && match.winner !== undefined;
}
