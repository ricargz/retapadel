"use client";

import { Download, RotateCcw, Share2 } from "lucide-react";
import type { Tournament } from "@/core/tournament/types";
import { calculateStandings, getTournamentTotals } from "@/core/tournament/statistics";
import { downloadTournamentPdf, shareTournamentPdf } from "@/lib/share/share-pdf";
import { Button } from "@/components/ui/button";
import { LiveStandingsTable } from "@/components/tournament/LiveStandingsTable";
import { RoundHistoryItem } from "@/components/tournament/RoundHistoryItem";
import { PadelBall } from "@/components/padel/PadelBall";
import {
  AlertDialog,
  AlertDialogButtons,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TournamentSummaryProps {
  tournament: Tournament;
  onDelete: () => void;
  onCorrectScore: (roundId: string, matchId: string, scoreA: number, scoreB: number) => Promise<void>;
}

export function TournamentSummary({ tournament, onDelete, onCorrectScore }: TournamentSummaryProps) {
  const standings = calculateStandings(tournament.players, tournament.rounds, tournament.config.pointsForWin);
  const totals = getTournamentTotals(tournament.rounds);
  const podium = standings.slice(0, 3);

  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 py-5">
      <section className="rounded-md border border-border bg-surface p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <PadelBall />
              <p className="text-xs font-bold uppercase tracking-normal text-text-secondary">Resumen final</p>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{tournament.config.name}</h1>
          </div>
          <Button type="button" variant="secondary" size="icon" aria-label="Compartir PDF" onClick={() => shareTournamentPdf(tournament)}>
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {podium.map((row) => (
            <div key={row.playerId} className="rounded-md border border-border bg-surface-muted p-3">
              <div className="text-xs font-bold uppercase tracking-normal text-text-secondary">Lugar {row.position}</div>
              <div className="mt-1 text-lg font-bold text-text-primary">{row.player.name}</div>
              <div className="mt-1 font-mono text-sm text-text-secondary">{row.points} pts | DIF {row.difference}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-text-secondary sm:grid-cols-3">
          <span>{totals.completedRounds} rondas completadas</span>
          <span>{totals.completedMatches} partidos jugados</span>
          <span>{totals.scoreTotal} puntos registrados</span>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => downloadTournamentPdf(tournament)}>
          <Download className="h-4 w-4" aria-hidden="true" />
          PDF final
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Eliminar torneo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar resumen final</AlertDialogTitle>
              <AlertDialogDescription>Se borrara por completo el torneo guardado en este dispositivo.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogButtons onConfirm={onDelete} confirmText="Eliminar" />
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <LiveStandingsTable tournament={tournament} mode="final" />
      <section className="grid gap-3">
        {tournament.rounds
          .slice()
          .reverse()
          .map((round) => (
            <RoundHistoryItem key={round.id} tournament={tournament} round={round} onCorrectScore={onCorrectScore} />
          ))}
      </section>
    </div>
  );
}
