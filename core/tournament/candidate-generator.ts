import type { Player, RotationHistory } from "./types";
import { calculateMatchPenalty } from "./penalty-calculator";

export interface MatchCandidate {
  teamA: [Player, Player];
  teamB: [Player, Player];
  penalty: number;
}

export function getCombinations<T>(items: T[], size: number, limit = Number.POSITIVE_INFINITY): T[][] {
  const result: T[][] = [];
  const current: T[] = [];

  function walk(start: number) {
    if (result.length >= limit) return;
    if (current.length === size) {
      result.push([...current]);
      return;
    }

    for (let index = start; index <= items.length - (size - current.length); index += 1) {
      current.push(items[index]);
      walk(index + 1);
      current.pop();
    }
  }

  walk(0);
  return result;
}

export function getMatchCandidates(group: [Player, Player, Player, Player], courtNumber: number, history: RotationHistory): MatchCandidate[] {
  const [a, b, c, d] = group;
  const candidates: Array<[[Player, Player], [Player, Player]]> = [
    [
      [a, b],
      [c, d],
    ],
    [
      [a, c],
      [b, d],
    ],
    [
      [a, d],
      [b, c],
    ],
  ];

  return candidates
    .map(([teamA, teamB]) => ({
      teamA,
      teamB,
      penalty: calculateMatchPenalty(teamA, teamB, courtNumber, history),
    }))
    .sort((left, right) => left.penalty - right.penalty || stableTeamName(left).localeCompare(stableTeamName(right), "es-MX"));
}

function stableTeamName(candidate: MatchCandidate) {
  return [...candidate.teamA, ...candidate.teamB].map((player) => player.name).sort().join("|");
}
