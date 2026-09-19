"use client";

import { useEffect, useState } from "react";
import { CloudOff, Trash2, Trophy } from "lucide-react";
import type { Tournament } from "@/core/tournament/types";
import { selectActiveRound } from "@/stores/tournament-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button";

interface TournamentHeaderProps {
  tournament: Tournament;
  onDelete: () => Promise<void>;
}

export function TournamentHeader({ tournament, onDelete }: TournamentHeaderProps) {
  const [online, setOnline] = useState(true);
  const round = selectActiveRound(tournament);

  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/94 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/12 text-primary">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black leading-tight text-text-primary">{tournament.config.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone="primary">Ronda {round?.number ?? tournament.rounds.length}</Badge>
              {!online ? (
                <Badge tone="error">
                  <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
                  Sin conexion
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector compact />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="secondary" size="icon" aria-label="Eliminar torneo activo" className="sm:w-auto sm:px-4">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar torneo activo</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borraran rondas, resultados, descansos y clasificacion guardada en este dispositivo. Podras empezar un torneo nuevo de inmediato.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </AlertDialogCancel>
                <HoldToConfirmButton idleText="Mantén presionado para eliminar" holdingText="Suelta para cancelar" completeText="Eliminando" onConfirm={onDelete} />
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
