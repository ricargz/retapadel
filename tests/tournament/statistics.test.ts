import { describe, expect, it } from "vitest";
import { createTournament, generateNextRound } from "@/core/tournament/rotation-engine";
import { updateMatchScore } from "@/core/tournament/scoring";
import { calculateStandings } from "@/core/tournament/statistics";

describe("statistics", () => {
  it("calculates points, differences and stable standings", () => {
    let tournament = createTournament(["Ana", "Bruno", "Carla", "Diego"], 1, "Tabla");
    const { round } = generateNextRound(tournament);
    const completed = updateMatchScore(round, round.matches[0].id, 7, 5);
    tournament = { ...tournament, rounds: [completed] };

    const standings = calculateStandings(tournament.players, tournament.rounds, tournament.config.pointsForWin);
    const winners = round.matches[0].teamA.map((id) => standings.find((row) => row.playerId === id));
    const losers = round.matches[0].teamB.map((id) => standings.find((row) => row.playerId === id));

    expect(winners.every((row) => row?.points === 3 && row.difference === 2)).toBe(true);
    expect(losers.every((row) => row?.points === 0 && row.difference === -2)).toBe(true);
    expect(standings[0].points).toBe(3);
  });

  it("counts tied matches without assigning a win or loss", () => {
    let tournament = createTournament(["Ana", "Bruno", "Carla", "Diego"], 1, "Tabla");
    const { round } = generateNextRound(tournament);
    const completed = updateMatchScore(round, round.matches[0].id, 4, 4);
    tournament = { ...tournament, rounds: [completed] };

    const standings = calculateStandings(tournament.players, tournament.rounds, tournament.config.pointsForWin);

    expect(completed.matches[0].winner).toBe("draw");
    expect(standings.every((row) => row.played === 1 && row.won === 0 && row.lost === 0 && row.points === 0 && row.difference === 0)).toBe(true);
  });
});
