import type { GeneratedRound, Match, Player, PlayerStats, RotationDiagnostics, Round, Tournament } from "./types";
import { getCombinations, getMatchCandidates } from "./candidate-generator";
import { buildRotationHistory, calculateRestPenalty } from "./penalty-calculator";
import { calculatePlayerStats } from "./statistics";
import { validateTournamentConfig } from "./validators";

const PLAYER_COLORS = ["blue", "red", "olive", "teal", "violet", "amber", "rose", "slate", "cyan", "lime"];

export function createTournamentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tournament-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPlayer(index: number, name: string): Player {
  return {
    id: `player-${index + 1}-${Math.random().toString(16).slice(2, 8)}`,
    name: name.trim(),
    colorToken: PLAYER_COLORS[index % PLAYER_COLORS.length],
    order: index,
  };
}

export function createTournament(playerNames: string[], courtCount: number, name?: string): Tournament {
  const error = validateTournamentConfig(playerNames.length, courtCount);
  if (error) throw new Error(error);

  const id = createTournamentId();
  const now = new Date().toISOString();

  return {
    config: {
      id,
      name: name?.trim() || `Torneo ${new Date().toLocaleDateString("es-MX")}`,
      createdAt: now,
      playerCount: playerNames.length,
      courtCount,
      pointsForWin: 3,
    },
    players: playerNames.map((playerName, index) => createPlayer(index, playerName)),
    rounds: [],
    status: "active",
  };
}

export function generateNextRound(tournament: Tournament): GeneratedRound {
  const error = validateTournamentConfig(tournament.players.length, tournament.config.courtCount);
  if (error) throw new Error(error);

  const activeRound = tournament.rounds.find((round) => round.status !== "completed");
  if (activeRound) {
    throw new Error("Termina la ronda actual antes de generar la siguiente.");
  }

  const roundNumber = tournament.rounds.length + 1;
  const playerStats = calculatePlayerStats(tournament.players, tournament.rounds, tournament.config.pointsForWin);
  const { restingPlayers, restingPenalty, consideredRestGroups } = chooseRestingPlayers(
    tournament.players,
    playerStats,
    tournament.rounds.at(-1),
    tournament.config.courtCount,
  );
  const restingIds = new Set(restingPlayers.map((player) => player.id));
  const activePlayers = rotatePlayers(
    tournament.players.filter((player) => !restingIds.has(player.id)),
    roundNumber,
  );
  const history = buildRotationHistory(tournament.rounds);
  const { matches, matchPenalty, consideredMatchGroups } = buildMatches(activePlayers, tournament.config.courtCount, history, roundNumber);

  const diagnostics: RotationDiagnostics = {
    restingPenalty,
    matchPenalty,
    consideredRestGroups,
    consideredMatchGroups,
  };

  return {
    round: {
      id: `round-${roundNumber}-${Date.now()}`,
      number: roundNumber,
      status: "active",
      matches,
      restingPlayerIds: restingPlayers.map((player) => player.id),
      createdAt: new Date().toISOString(),
    },
    diagnostics,
  };
}

function chooseRestingPlayers(players: Player[], stats: PlayerStats[], previousRound: Round | undefined, courtCount: number) {
  const restingCount = players.length - courtCount * 4;
  if (restingCount <= 0) {
    return { restingPlayers: [], restingPenalty: 0, consideredRestGroups: 1 };
  }

  const restCounts = new Map(stats.map((row) => [row.playerId, row.rests]));
  const playedCounts = new Map(stats.map((row) => [row.playerId, row.played]));
  const lastRestingIds = new Set(previousRound?.restingPlayerIds ?? []);
  const combinations = getCombinations(players, restingCount, 3000);

  if (combinations.length > 0 && combinations.length < 3000) {
    const best = combinations
      .map((restingPlayers) => ({
        restingPlayers,
        penalty: calculateRestPenalty(restingPlayers, lastRestingIds, restCounts, playedCounts),
      }))
      .sort((left, right) => left.penalty - right.penalty || stablePlayers(left.restingPlayers).localeCompare(stablePlayers(right.restingPlayers), "es-MX"))[0];

    return {
      restingPlayers: best.restingPlayers,
      restingPenalty: best.penalty,
      consideredRestGroups: combinations.length,
    };
  }

  const restingPlayers = [...players]
    .sort((left, right) => restScore(right, lastRestingIds, restCounts, playedCounts) - restScore(left, lastRestingIds, restCounts, playedCounts))
    .slice(0, restingCount);

  return {
    restingPlayers,
    restingPenalty: calculateRestPenalty(restingPlayers, lastRestingIds, restCounts, playedCounts),
    consideredRestGroups: combinations.length,
  };
}

function restScore(player: Player, lastRestingIds: Set<string>, restCounts: Map<string, number>, playedCounts: Map<string, number>) {
  return (playedCounts.get(player.id) ?? 0) * 12 - (restCounts.get(player.id) ?? 0) * 14 - (lastRestingIds.has(player.id) ? 80 : 0) - player.order / 100;
}

function buildMatches(activePlayers: Player[], courtCount: number, history: ReturnType<typeof buildRotationHistory>, roundNumber: number) {
  const pool = [...activePlayers];
  const matches: Match[] = [];
  let matchPenalty = 0;
  let consideredMatchGroups = 0;

  for (let courtNumber = 1; courtNumber <= courtCount; courtNumber += 1) {
    const groups = getCombinations(pool, 4);
    consideredMatchGroups += groups.length;
    const bestGroup = groups
      .map((group) => {
        const candidates = getMatchCandidates(group as [Player, Player, Player, Player], courtNumber, history);
        return { group, candidate: candidates[0], penalty: candidates[0].penalty };
      })
      .sort((left, right) => left.penalty - right.penalty || stablePlayers(left.group).localeCompare(stablePlayers(right.group), "es-MX"))[0];

    if (!bestGroup) {
      throw new Error("No fue posible formar una cancha completa.");
    }

    matchPenalty += bestGroup.penalty;
    for (const player of bestGroup.group) {
      pool.splice(
        pool.findIndex((candidate) => candidate.id === player.id),
        1,
      );
    }

    matches.push({
      id: `round-${roundNumber}-court-${courtNumber}`,
      courtNumber,
      teamA: [bestGroup.candidate.teamA[0].id, bestGroup.candidate.teamA[1].id],
      teamB: [bestGroup.candidate.teamB[0].id, bestGroup.candidate.teamB[1].id],
      status: "pending",
    });
  }

  return { matches, matchPenalty, consideredMatchGroups };
}

function rotatePlayers(players: Player[], roundNumber: number) {
  const offset = players.length === 0 ? 0 : roundNumber % players.length;
  return [...players.slice(offset), ...players.slice(0, offset)];
}

function stablePlayers(players: Player[]) {
  return players.map((player) => `${player.order}:${player.name}`).join("|");
}

export function assertRoundInvariants(round: Round, players: Player[], courtCount: number) {
  const allRoundIds = [...round.restingPlayerIds, ...round.matches.flatMap((match) => [...match.teamA, ...match.teamB])];
  const unique = new Set(allRoundIds);

  if (unique.size !== allRoundIds.length) {
    throw new Error(`La ronda ${round.number} duplica jugadores.`);
  }

  if (unique.size !== players.length) {
    throw new Error(`La ronda ${round.number} no cubre a todos los jugadores.`);
  }

  if (round.matches.length !== courtCount) {
    throw new Error(`La ronda ${round.number} no coincide con las canchas configuradas.`);
  }

  for (const match of round.matches) {
    const matchIds = [...match.teamA, ...match.teamB];
    if (new Set(matchIds).size !== 4) {
      throw new Error(`La cancha ${match.courtNumber} no tiene cuatro jugadores diferentes.`);
    }
  }
}
