import { motion } from "motion/react";
import type { Player, PlayerStats } from "@/core/tournament/types";
import { PlayerChip } from "@/components/padel/PlayerChip";
import { Badge } from "@/components/ui/badge";

interface RestingPlayersProps {
  players: Player[];
  stats: PlayerStats[];
}

export function RestingPlayers({ players, stats }: RestingPlayersProps) {
  if (players.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-3 text-sm text-text-secondary">
        Todos juegan esta ronda.
      </div>
    );
  }

  const statsById = new Map(stats.map((row) => [row.playerId, row]));

  return (
    <section className="rounded-md border border-border bg-surface p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-text-primary">Descanso</h3>
        <Badge>{players.length} jugador{players.length === 1 ? "" : "es"}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {players.map((player, index) => (
          <motion.span
            key={player.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="inline-flex items-center gap-2"
          >
            <PlayerChip player={player} state="resting" compact />
            <Badge tone="ball">{statsById.get(player.id)?.rests ?? 0}</Badge>
          </motion.span>
        ))}
      </div>
    </section>
  );
}
