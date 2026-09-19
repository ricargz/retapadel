"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Pencil } from "lucide-react";
import type { Match, Round, Tournament } from "@/core/tournament/types";
import { isCompletedMatch } from "@/core/tournament/statistics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScoreCounter } from "@/components/padel/ScoreCounter";

interface RoundHistoryItemProps {
  tournament: Tournament;
  round: Round;
  onCorrectScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => Promise<void>;
}

export function RoundHistoryItem({ tournament, round, onCorrectScore }: RoundHistoryItemProps) {
  const playerById = useMemo(() => new Map(tournament.players.map((player) => [player.id, player.name])), [tournament.players]);
  const restingNames = round.restingPlayerIds.map((id) => playerById.get(id)).filter(Boolean).join(", ");
  const [editing, setEditing] = useState<Match | null>(null);

  return (
    <motion.details
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-md border border-border bg-surface p-3"
      open={round.number === tournament.rounds.length}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Ronda {round.number}</h3>
            <p className="text-xs font-medium uppercase tracking-normal text-text-secondary">{round.status === "completed" ? "Completada" : "Activa"}</p>
          </div>
          <span className="text-xs text-text-secondary">{round.matches.length} cancha{round.matches.length === 1 ? "" : "s"}</span>
        </div>
      </summary>
      <div className="mt-3 space-y-3">
        {round.matches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded border border-border bg-surface-muted p-3"
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-normal text-text-secondary">Cancha {match.courtNumber}</div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <TeamText ids={match.teamA} playerById={playerById} winner={match.winner === "A"} />
              <span className="font-mono text-lg font-bold tabular-nums text-text-primary">{isCompletedMatch(match) ? `${match.scoreA} - ${match.scoreB}` : "pend."}</span>
              <TeamText ids={match.teamB} playerById={playerById} winner={match.winner === "B"} align="right" />
            </div>
            {isCompletedMatch(match) ? (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setEditing(match)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Corregir
              </Button>
            ) : null}
          </motion.div>
        ))}
        {restingNames ? <p className="text-sm text-text-secondary">Descansaron: {restingNames}</p> : null}
      </div>
      <ScoreCorrectionDialog
        match={editing}
        playerById={playerById}
        onClose={() => setEditing(null)}
        onSave={async (scoreA, scoreB) => {
          if (!editing) return;
          await onCorrectScore(round.id, editing.id, scoreA, scoreB);
          setEditing(null);
        }}
      />
    </motion.details>
  );
}

function TeamText({ ids, playerById, winner, align = "left" }: { ids: [string, string]; playerById: Map<string, string>; winner: boolean; align?: "left" | "right" }) {
  return (
    <span className={winner ? "font-bold text-text-primary" : "text-text-secondary"} style={{ textAlign: align }}>
      {playerById.get(ids[0])} / {playerById.get(ids[1])}
    </span>
  );
}

function ScoreCorrectionDialog({
  match,
  playerById,
  onClose,
  onSave,
}: {
  match: Match | null;
  playerById: Map<string, string>;
  onClose: () => void;
  onSave: (scoreA: number, scoreB: number) => Promise<void>;
}) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  useEffect(() => {
    setScoreA(match?.scoreA ?? 0);
    setScoreB(match?.scoreB ?? 0);
  }, [match]);

  return (
    <Dialog open={Boolean(match)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corregir resultado</DialogTitle>
          <DialogDescription>
            {match ? `${playerById.get(match.teamA[0])} / ${playerById.get(match.teamA[1])} contra ${playerById.get(match.teamB[0])} / ${playerById.get(match.teamB[1])}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <ScoreCounter label="Equipo A" value={scoreA} onChange={setScoreA} />
          <ScoreCounter label="Equipo B" value={scoreB} onChange={setScoreB} />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => onSave(scoreA, scoreB)}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
