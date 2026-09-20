 "use client";

import { motion } from "motion/react";
import type { Tournament } from "@/core/tournament/types";
import { calculateStandings } from "@/core/tournament/statistics";
import { Badge } from "@/components/ui/badge";

interface LiveStandingsTableProps {
  tournament: Tournament;
  mode?: "provisional" | "final";
}

export function LiveStandingsTable({ tournament, mode = "provisional" }: LiveStandingsTableProps) {
  const rows = calculateStandings(tournament.players, tournament.rounds, tournament.config.pointsForWin);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border p-3">
        <h2 className="text-sm font-bold text-text-primary">{mode === "final" ? "Clasificacion final" : "Clasificacion provisional"}</h2>
        <Badge tone="primary">Puntos por marcador</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-normal text-text-secondary">
            <tr>
              <th className="sticky left-0 bg-surface-muted px-3 py-3 text-right">Pos.</th>
              <th className="px-3 py-3 text-left">Jugador</th>
              <th className="px-3 py-3 text-right">PJ</th>
              <th className="px-3 py-3 text-right">PG</th>
              <th className="px-3 py-3 text-right">DIF</th>
              <th className="px-3 py-3 text-right">PTS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={row.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.035, 0.25) }}
                className="border-t border-border"
              >
                <td className="sticky left-0 bg-surface px-3 py-3 text-right font-bold text-text-primary">
                  <RankingPosition position={row.position} />
                </td>
                <td className="px-3 py-3 font-semibold text-text-primary">
                  <details>
                    <summary className="cursor-pointer list-none">{row.player.name}</summary>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-medium text-text-secondary sm:grid-cols-4">
                      <span>PF {row.scoreFor}</span>
                      <span>PC {row.scoreAgainst}</span>
                      <span>PP {row.lost}</span>
                      <span>Desc. {row.rests}</span>
                    </div>
                  </details>
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">{row.played}</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">{row.won}</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">{row.difference}</td>
                <td className="px-3 py-3 text-right font-mono font-bold tabular-nums">{row.points}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankingPosition({ position }: { position: number }) {
  const tone = position === 1 ? "bg-[#c7b36b]/30" : position === 2 ? "bg-[#a9afb2]/35" : position === 3 ? "bg-[#b88961]/30" : "bg-surface-muted";
  return <span className={`inline-grid h-7 w-7 place-items-center rounded ${tone}`}>{position}</span>;
}
