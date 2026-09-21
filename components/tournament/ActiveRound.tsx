"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Flag } from "lucide-react";
import type { Tournament } from "@/core/tournament/types";
import { calculatePlayerStats } from "@/core/tournament/statistics";
import { MatchCourtCard } from "@/components/padel/MatchCourtCard";
import { RestingPlayers } from "@/components/padel/RestingPlayers";
import { Button } from "@/components/ui/button";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button";

interface ActiveRoundProps {
  tournament: Tournament;
  onSubmitScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => Promise<void>;
  onNextRound: () => Promise<void>;
  onFinish: () => void;
}

export function ActiveRound({ tournament, onSubmitScore, onNextRound, onFinish }: ActiveRoundProps) {
  const round = tournament.rounds.find((candidate) => candidate.status !== "completed") ?? tournament.rounds.at(-1);
  if (!round) return null;

  const stats = calculatePlayerStats(tournament.players, tournament.rounds, tournament.config.pointsForWin);
  const restingPlayers = tournament.players.filter((player) => round.restingPlayerIds.includes(player.id));
  const allCompleted = round.matches.every((match) => match.status === "completed");

  return (
    <div className={`space-y-4 ${allCompleted && tournament.status === "active" ? "pb-40" : "pb-4"}`}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <RestingPlayers players={restingPlayers} stats={stats} />
      </motion.div>
      <motion.div className="grid gap-4 lg:grid-cols-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
        {round.matches.map((match) => (
          <MatchCourtCard key={match.id} tournament={tournament} roundId={round.id} match={match} onSubmitScore={onSubmitScore} />
        ))}
      </motion.div>
      <AnimatePresence>
        {allCompleted && tournament.status === "active" ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/94 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur"
          >
            <div className="mx-auto grid max-w-5xl gap-2 sm:grid-cols-[1fr_220px]">
              <Button type="button" size="lg" className="h-14 w-full animate-[soft-pop_420ms_ease-out] text-base font-black shadow-xl shadow-primary/20" onClick={onNextRound}>
                Generar siguiente ronda
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
              <HoldToConfirmButton
                idleText="Mantén para finalizar torneo"
                holdingText="Finalizando torneo..."
                completeText="Torneo finalizado"
                variant="secondary"
                aria-label="Mantén presionado para finalizar torneo"
                className="h-14 w-full border-primary/40 bg-primary/10 text-base font-black text-primary shadow-sm ring-1 ring-primary/10 hover:bg-primary/15"
                progressClassName="bg-primary/35 shadow-[inset_-18px_0_26px_rgb(var(--primary)_/_0.28)]"
                onConfirm={onFinish}
              >
                <Flag className="relative z-10 h-5 w-5" aria-hidden="true" />
              </HoldToConfirmButton>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
