import type { Match, Player, RotationHistory, Round } from "./types";

export function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

export function matchKey(teamA: [string, string], teamB: [string, string]) {
  return [pairKey(teamA[0], teamA[1]), pairKey(teamB[0], teamB[1])].sort().join("::");
}

export function buildRotationHistory(rounds: Round[]): RotationHistory {
  const pairCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const exactMatchCounts = new Map<string, number>();
  const courtCounts = new Map<string, Map<number, number>>();

  for (const round of rounds) {
    for (const match of round.matches) {
      increment(pairCounts, pairKey(match.teamA[0], match.teamA[1]));
      increment(pairCounts, pairKey(match.teamB[0], match.teamB[1]));
      increment(exactMatchCounts, matchKey(match.teamA, match.teamB));

      for (const playerId of [...match.teamA, ...match.teamB]) {
        const byCourt = courtCounts.get(playerId) ?? new Map<number, number>();
        byCourt.set(match.courtNumber, (byCourt.get(match.courtNumber) ?? 0) + 1);
        courtCounts.set(playerId, byCourt);
      }

      for (const a of match.teamA) {
        for (const b of match.teamB) {
          increment(opponentCounts, pairKey(a, b));
        }
      }
    }
  }

  return { pairCounts, opponentCounts, exactMatchCounts, courtCounts };
}

export function calculateMatchPenalty(teamA: [Player, Player], teamB: [Player, Player], courtNumber: number, history: RotationHistory) {
  const teamAIds: [string, string] = [teamA[0].id, teamA[1].id];
  const teamBIds: [string, string] = [teamB[0].id, teamB[1].id];

  const repeatedPairPenalty =
    (history.pairCounts.get(pairKey(teamAIds[0], teamAIds[1])) ?? 0) * 180 +
    (history.pairCounts.get(pairKey(teamBIds[0], teamBIds[1])) ?? 0) * 180;

  const exactMatchPenalty = (history.exactMatchCounts.get(matchKey(teamAIds, teamBIds)) ?? 0) * 420;

  let repeatedOpponentPenalty = 0;
  for (const a of teamAIds) {
    for (const b of teamBIds) {
      repeatedOpponentPenalty += (history.opponentCounts.get(pairKey(a, b)) ?? 0) * 28;
    }
  }

  const courtPenalty = [...teamAIds, ...teamBIds].reduce((sum, playerId) => {
    return sum + (history.courtCounts.get(playerId)?.get(courtNumber) ?? 0) * 3;
  }, 0);

  return repeatedPairPenalty + exactMatchPenalty + repeatedOpponentPenalty + courtPenalty;
}

export function calculateRestPenalty(resting: Player[], lastRestingIds: Set<string>, restCounts: Map<string, number>, playedCounts: Map<string, number>) {
  if (resting.length === 0) return 0;

  const restValues = resting.map((player) => restCounts.get(player.id) ?? 0);
  const playedValues = resting.map((player) => playedCounts.get(player.id) ?? 0);
  const averageRests = average(Array.from(restCounts.values()));
  const averagePlayed = average(Array.from(playedCounts.values()));

  return resting.reduce((sum, player, index) => {
    const consecutivePenalty = lastRestingIds.has(player.id) ? 300 : 0;
    const underPlayedPenalty = Math.max(0, averagePlayed - playedValues[index]) * 80;
    const overRestedPenalty = Math.max(0, restValues[index] - averageRests) * 80;
    return sum + consecutivePenalty + underPlayedPenalty + overRestedPenalty;
  }, 0);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function summarizeMatch(match: Match) {
  return `${match.teamA.join("/")} vs ${match.teamB.join("/")}`;
}
