"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trash2 } from "lucide-react";
import { validateTournamentConfig } from "@/core/tournament/validators";
import type { AppScreen } from "@/stores/tournament-store";
import { canGenerateNextRound, getMaximumCourtOptions, useTournamentStore } from "@/stores/tournament-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { ActiveRound } from "@/components/tournament/ActiveRound";
import { LiveStandingsTable } from "@/components/tournament/LiveStandingsTable";
import { RoundHistoryItem } from "@/components/tournament/RoundHistoryItem";
import { TournamentHeader } from "@/components/tournament/TournamentHeader";
import { TournamentNavigation } from "@/components/tournament/TournamentNavigation";
import { TournamentSummary } from "@/components/tournament/TournamentSummary";
import { PadelBall } from "@/components/padel/PadelBall";
import { PadelCourt } from "@/components/padel/PadelCourt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogButtons,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ThemeSelector } from "@/components/theme/ThemeSelector";

export function RetapadelApp({ initialScreen = "home" }: { initialScreen?: AppScreen }) {
  const hydrated = useTournamentStore((state) => state.hydrated);
  const tournament = useTournamentStore((state) => state.tournament);
  const screen = useTournamentStore((state) => state.screen);
  const selectedTab = useTournamentStore((state) => state.selectedTab);
  const draft = useTournamentStore((state) => state.draft);
  const playerNames = useTournamentStore((state) => state.playerNames);
  const error = useTournamentStore((state) => state.error);
  const hydrate = useTournamentStore((state) => state.hydrate);
  const preferencesHydrate = usePreferencesStore((state) => state.hydrate);
  const refreshResolvedTheme = usePreferencesStore((state) => state.refreshResolvedTheme);
  const beginNewTournament = useTournamentStore((state) => state.beginNewTournament);
  const continueTournament = useTournamentStore((state) => state.continueTournament);
  const setDraft = useTournamentStore((state) => state.setDraft);
  const proceedToPlayers = useTournamentStore((state) => state.proceedToPlayers);
  const updatePlayerName = useTournamentStore((state) => state.updatePlayerName);
  const removePlayer = useTournamentStore((state) => state.removePlayer);
  const startTournament = useTournamentStore((state) => state.startTournament);
  const setSelectedTab = useTournamentStore((state) => state.setSelectedTab);
  const submitScore = useTournamentStore((state) => state.submitScore);
  const generateNextRound = useTournamentStore((state) => state.generateNextRound);
  const finishTournament = useTournamentStore((state) => state.finishTournament);
  const deleteTournament = useTournamentStore((state) => state.deleteTournament);
  const goTo = useTournamentStore((state) => state.goTo);

  useEffect(() => {
    hydrate(initialScreen);
    preferencesHydrate();
  }, [hydrate, initialScreen, preferencesHydrate]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", refreshResolvedTheme);
    return () => media.removeEventListener("change", refreshResolvedTheme);
  }, [refreshResolvedTheme]);

  if (!hydrated) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background text-text-primary">
        <PadelBall spin />
      </main>
    );
  }

  if (screen === "config") {
    return (
      <ScreenMotion>
        <ConfigScreen draft={draft} error={error} onBack={() => goTo("home")} onChange={setDraft} onContinue={proceedToPlayers} />
      </ScreenMotion>
    );
  }

  if (screen === "players") {
    return (
      <ScreenMotion>
        <PlayersScreen
          names={playerNames}
          error={error}
          onBack={() => goTo("config")}
          onChange={updatePlayerName}
          onRemove={removePlayer}
          onStart={startTournament}
        />
      </ScreenMotion>
    );
  }

  if ((screen === "results" || (screen === "tournament" && tournament?.status === "completed")) && tournament) {
    return <TournamentSummary tournament={tournament} onDelete={deleteTournament} onCorrectScore={submitScore} />;
  }

  if (screen === "tournament" && tournament) {
    return (
      <main className="min-h-dvh bg-background pb-[env(safe-area-inset-bottom)] text-text-primary">
        <TournamentHeader tournament={tournament} onDelete={deleteTournament} />
        <div className="mx-auto max-w-5xl px-4 py-4">
          {error ? <ErrorBanner message={error} /> : null}
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as never)}>
            <TournamentNavigation />
            <AnimatePresence mode="wait">
              {selectedTab === "round" ? (
                <TabsContent key="round" value="round" forceMount>
                  <TabMotion>
                    <ActiveRound tournament={tournament} onSubmitScore={submitScore} onNextRound={generateNextRound} onFinish={finishTournament} />
                    {canGenerateNextRound(tournament) ? null : <div className="h-4" />}
                  </TabMotion>
                </TabsContent>
              ) : null}
              {selectedTab === "history" ? (
                <TabsContent key="history" value="history" forceMount>
                  <TabMotion>
                    <div className="grid gap-3">
                      {tournament.rounds
                        .slice()
                        .reverse()
                        .map((round) => (
                          <RoundHistoryItem key={round.id} tournament={tournament} round={round} onCorrectScore={submitScore} />
                        ))}
                    </div>
                  </TabMotion>
                </TabsContent>
              ) : null}
              {selectedTab === "standings" ? (
                <TabsContent key="standings" value="standings" forceMount>
                  <TabMotion>
                    <LiveStandingsTable tournament={tournament} />
                  </TabMotion>
                </TabsContent>
              ) : null}
            </AnimatePresence>
          </Tabs>
        </div>
      </main>
    );
  }

  return (
    <ScreenMotion>
      <HomeScreen
        tournament={tournament}
        onCreate={beginNewTournament}
        onContinue={continueTournament}
        onDelete={deleteTournament}
        error={error}
      />
    </ScreenMotion>
  );
}

const screenTransition = { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] } as const;

function ScreenMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={screenTransition}>
      {children}
    </motion.div>
  );
}

function TabMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}

function HomeScreen({
  tournament,
  onCreate,
  onContinue,
  onDelete,
  error,
}: {
  tournament: ReturnType<typeof useTournamentStore.getState>["tournament"];
  onCreate: () => void;
  onContinue: () => void;
  onDelete: () => Promise<void>;
  error: string | null;
}) {
  return (
    <main className="relative isolate min-h-dvh overflow-y-auto bg-background px-4 py-4 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 pb-[env(safe-area-inset-bottom)] sm:max-w-2xl">
        <header className="flex justify-end">
          <ThemeSelector compact />
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }} className="space-y-3">
            <motion.div
              className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ball/20"
              animate={{ y: [0, -5, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <PadelBall spin className="h-8 w-8" />
            </motion.div>
            <h1 className="text-5xl font-black leading-none tracking-normal text-text-primary min-[380px]:text-6xl sm:text-7xl">Retapadel</h1>
            <p className="text-lg font-semibold text-text-secondary">Crea tus retas de padel</p>
          </motion.div>

          <HeroCourt />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.32 }}
            className="w-full space-y-3"
          >
            <motion.div whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }}>
              <Button
                type="button"
                size="lg"
                className="relative h-[4.5rem] w-full overflow-hidden rounded-md border border-primary/30 text-xl font-black shadow-2xl shadow-primary/25"
                onClick={onCreate}
              >
                <motion.span
                  className="pointer-events-none absolute inset-y-0 left-[-45%] w-1/3 rotate-12 bg-white/18 blur-sm"
                  animate={{ x: ["0%", "440%", "440%"] }}
                  transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
                />
                Crear torneo
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/16">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </Button>
            </motion.div>

            {tournament ? (
              <div className="grid grid-cols-[1fr_56px] gap-2">
                <Button type="button" size="lg" variant="secondary" onClick={onContinue}>
                  Continuar
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="icon" aria-label="Eliminar torneo activo">
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar torneo activo</AlertDialogTitle>
                      <AlertDialogDescription>Se borraran rondas, resultados, descansos y clasificacion guardada en este dispositivo.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogButtons onConfirm={onDelete} confirmText="Eliminar" />
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
            {error ? <ErrorBanner message={error} /> : null}
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="text-center text-xs font-medium text-text-secondary/70"
          >
            desarrollado por Reséndiz
          </motion.footer>
        </section>
      </div>
    </main>
  );
}

function HeroCourt() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative w-full"
    >
      <motion.div
        className="relative mx-auto max-w-[390px] px-2 motion-safe:animate-[court-float_5s_ease-in-out_infinite]"
        whileHover={{ scale: 1.015, rotate: -0.35 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      >
        <div className="absolute inset-x-7 bottom-[-10px] h-8 rounded-full bg-black/12 blur-xl" />
        <PadelCourt className="min-h-56 shadow-2xl shadow-primary/18 ring-1 ring-border/80" />
        <motion.span
          className="absolute left-[18%] top-[30%] h-2.5 w-2.5 rounded-full bg-ball shadow-[0_0_18px_rgb(var(--ball)_/_0.7)]"
          animate={{ x: [0, 86, 172, 82, 0], y: [0, 24, -8, 92, 0], scale: [1, 0.88, 1.08, 0.9, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}

function ConfigScreen({
  draft,
  error,
  onBack,
  onChange,
  onContinue,
}: {
  draft: { playerCount: number; courtCount: number; name: string };
  error: string | null;
  onBack: () => void;
  onChange: (draft: Partial<{ playerCount: number; courtCount: number; name: string }>) => void;
  onContinue: () => void;
}) {
  const configError = validateTournamentConfig(draft.playerCount, draft.courtCount);
  const courtOptions = getMaximumCourtOptions(draft.playerCount);
  const maximumCourts = courtOptions.length;

  return (
    <main className="min-h-dvh overflow-y-auto bg-background px-4 py-5 pb-28 text-text-primary">
      <div className="mx-auto max-w-3xl space-y-5">
        <PageTop onBack={onBack} title="Configurar torneo" />
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-border bg-surface p-4">
          <label className="text-sm font-bold text-text-primary" htmlFor="tournament-name">
            Nombre
          </label>
          <Input id="tournament-name" className="mt-2" value={draft.name} onChange={(event) => onChange({ name: event.target.value })} />
        </motion.section>
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Jugadores</h2>
            <span className="font-mono text-3xl font-bold">{draft.playerCount}</span>
          </div>
          <Stepper value={draft.playerCount} min={4} max={20} onChange={(value) => onChange({ playerCount: value })} />
          <div className="mt-4 grid grid-cols-8 gap-2 sm:grid-cols-10">
            {Array.from({ length: draft.playerCount }, (_, index) => (
              <span key={index} className="aspect-square rounded-full bg-ball/70" />
            ))}
          </div>
        </motion.section>
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Canchas disponibles</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Puedes usar menos canchas aunque haya jugadores suficientes. Maximo por jugadores: {maximumCourts}.
              </p>
            </div>
            <span className="font-mono text-3xl font-bold">{draft.courtCount}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {courtOptions.map((court) => (
              <motion.button
                key={court}
                type="button"
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -2 }}
                className={`rounded-md border p-2 text-left transition ${draft.courtCount === court ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-surface-muted hover:border-primary/40"}`}
                onClick={() => onChange({ courtCount: court })}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-bold text-text-primary">Usar {court} cancha{court === 1 ? "" : "s"}</span>
                  {draft.courtCount === court ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
                </div>
                <PadelCourt courtNumber={court} compact />
                <p className="mt-2 px-1 text-xs font-medium text-text-secondary">
                  Juegan {court * 4}; descansan {Math.max(0, draft.playerCount - court * 4)}.
                </p>
              </motion.button>
            ))}
          </div>
        </motion.section>
        {configError || error ? <ErrorBanner message={configError ?? error ?? ""} /> : null}
        <div className="h-2" />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/94 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button type="button" size="lg" className="h-14 w-full text-base font-black shadow-xl shadow-primary/20" disabled={Boolean(configError)} onClick={onContinue}>
            Continuar
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </main>
  );
}

function PlayersScreen({
  names,
  error,
  onBack,
  onChange,
  onRemove,
  onStart,
}: {
  names: string[];
  error: string | null;
  onBack: () => void;
  onChange: (index: number, name: string) => void;
  onRemove: (index: number) => void;
  onStart: () => Promise<void>;
}) {
  return (
    <main className="min-h-dvh overflow-y-auto bg-background px-4 py-5 pb-28 text-text-primary">
      <div className="mx-auto max-w-3xl space-y-5">
        <PageTop onBack={onBack} title="Registrar jugadores" />
        <section className="grid gap-3">
          {names.map((name, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.025, 0.22) }}
              className="grid grid-cols-[2.5rem_1fr_44px] items-center gap-2 rounded-md border border-border bg-surface p-2"
            >
              <span className="grid h-10 w-10 place-items-center rounded bg-primary/12 text-sm font-bold text-primary">{index + 1}</span>
              <Input value={name} aria-label={`Jugador ${index + 1}`} onChange={(event) => onChange(index, event.target.value)} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar jugador ${index + 1}`} disabled={names.length <= 4} onClick={() => onRemove(index)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </motion.div>
          ))}
        </section>
        {error ? <ErrorBanner message={error} /> : null}
        <div className="h-2" />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/94 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button type="button" size="lg" className="h-14 w-full text-base font-black shadow-xl shadow-primary/20" onClick={onStart}>
            Generar primera ronda
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </main>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="grid grid-cols-[52px_1fr_52px] items-center gap-3">
      <Button type="button" variant="secondary" size="icon" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Reducir">
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <input className="h-2 accent-primary" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <Button type="button" variant="secondary" size="icon" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Aumentar">
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function PageTop({ title, onBack, action }: { title: string; onBack: () => void; action?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="icon" aria-label="Volver" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {action}
    </header>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <div className="rounded-md border border-error/35 bg-error/10 p-3 text-sm font-semibold text-error">{message}</div>;
}
