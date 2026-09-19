"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import type { Match, Tournament } from "@/core/tournament/types";
import { isCompletedMatch } from "@/core/tournament/statistics";
import { PadelCourt } from "@/components/padel/PadelCourt";
import { ScoreCounter } from "@/components/padel/ScoreCounter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MatchCourtCardProps {
  tournament: Tournament;
  roundId: string;
  match: Match;
  onSubmitScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => Promise<void>;
}

export function MatchCourtCard({ tournament, roundId, match, onSubmitScore }: MatchCourtCardProps) {
  const [scoreA, setScoreA] = useState(match.scoreA ?? 0);
  const [scoreB, setScoreB] = useState(match.scoreB ?? 0);
  const [saving, setSaving] = useState(false);
  const playerById = useMemo(() => new Map(tournament.players.map((player) => [player.id, player])), [tournament.players]);
  const teamA = [playerById.get(match.teamA[0]), playerById.get(match.teamA[1])];
  const teamB = [playerById.get(match.teamB[0]), playerById.get(match.teamB[1])];
  const completed = isCompletedMatch(match);

  useEffect(() => {
    setScoreA(match.scoreA ?? 0);
    setScoreB(match.scoreB ?? 0);
  }, [match.scoreA, match.scoreB]);

  if (!teamA[0] || !teamA[1] || !teamB[0] || !teamB[1]) return null;

  async function submit() {
    setSaving(true);
    await onSubmitScore(roundId, match.id, scoreA, scoreB);
    setSaving(false);
  }

  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 14, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22 }}
      className="rounded-md border border-border bg-surface p-3 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-text-primary">Cancha {match.courtNumber}</h3>
        {completed ? (
          <Badge tone="success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Cerrado
          </Badge>
        ) : (
          <Badge tone="primary">Pendiente</Badge>
        )}
      </div>
      <PadelCourt courtNumber={match.courtNumber} teamA={[teamA[0], teamA[1]]} teamB={[teamB[0], teamB[1]]} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ScoreCounter label={`${teamA[0].name} / ${teamA[1].name}`} value={scoreA} onChange={setScoreA} disabled={saving} />
        <ScoreCounter label={`${teamB[0].name} / ${teamB[1].name}`} value={scoreB} onChange={setScoreB} disabled={saving} />
      </div>
      <Button
        type="button"
        className="mt-3 h-12 w-full text-base font-black shadow-sm transition-transform active:scale-[0.99]"
        disabled={saving || scoreA === scoreB}
        onClick={submit}
      >
        {completed ? "Guardar correccion" : "Finalizar partido"}
      </Button>
    </motion.article>
  );
}
