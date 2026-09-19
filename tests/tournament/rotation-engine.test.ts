import { describe, expect, it } from "vitest";
import { assertRoundInvariants, createTournament, generateNextRound } from "@/core/tournament/rotation-engine";
import { updateMatchScore } from "@/core/tournament/scoring";
import { calculatePlayerStats } from "@/core/tournament/statistics";
import { getMaximumCourts } from "@/core/tournament/validators";
import type { Round, Tournament } from "@/core/tournament/types";

describe("rotation engine", () => {
  it("generates valid rounds for 4 to 20 players", () => {
    for (let playerCount = 4; playerCount <= 20; playerCount += 1) {
      const maxCourts = getMaximumCourts(playerCount);

      for (let courtCount = 1; courtCount <= maxCourts; courtCount += 1) {
        let tournament = createTournament(names(playerCount), courtCount, `Caso ${playerCount}-${courtCount}`);

        for (let index = 0; index < 10; index += 1) {
          const { round } = generateNextRound(tournament);
          assertRoundInvariants(round, tournament.players, courtCount);
          expect(round.matches).toHaveLength(courtCount);
          expect(round.restingPlayerIds).toHaveLength(playerCount - courtCount * 4);
          tournament = { ...tournament, rounds: [...tournament.rounds, completeRound(round)] };
        }
      }
    }
  });

  it("keeps rests reasonably balanced in repeated rounds", () => {
    let tournament: Tournament = createTournament(names(11), 2, "Equilibrio");

    for (let index = 0; index < 30; index += 1) {
      const { round } = generateNextRound(tournament);
      tournament = { ...tournament, rounds: [...tournament.rounds, completeRound(round)] };
    }

    const restCounts = calculatePlayerStats(tournament.players, tournament.rounds, tournament.config.pointsForWin).map((row) => row.rests);
    expect(Math.max(...restCounts) - Math.min(...restCounts)).toBeLessThanOrEqual(2);
  });
});

function names(count: number) {
  return Array.from({ length: count }, (_, index) => `Jugador ${index + 1}`);
}

function completeRound(round: Round) {
  return round.matches.reduce((currentRound, match, index) => {
    const scoreA = 6 + (index % 2);
    const scoreB = 3 + (index % 2);
    return updateMatchScore(currentRound, match.id, scoreA, scoreB);
  }, round);
}
