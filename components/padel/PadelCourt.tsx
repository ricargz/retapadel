import type { Player } from "@/core/tournament/types";
import { cn } from "@/lib/utils";

interface PadelCourtProps {
  courtNumber?: number;
  teamA?: [Player, Player];
  teamB?: [Player, Player];
  compact?: boolean;
  className?: string;
}

export function PadelCourt({ courtNumber, teamA, teamB, compact = false, className }: PadelCourtProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-court text-court-line shadow-inner ring-1 ring-black/5",
        compact ? "aspect-[1.55]" : "aspect-[1.45]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgb(255_255_255_/_0.16),transparent_25%),linear-gradient(135deg,rgb(255_255_255_/_0.08),transparent_42%,rgb(0_0_0_/_0.08))]" />
      <span className="absolute inset-y-0 left-[-40%] w-1/3 rotate-12 bg-white/12 blur-sm motion-safe:animate-[court-sweep_4.8s_ease-in-out_infinite]" />
      <div className="absolute inset-3 rounded border-2 border-court-line/90 shadow-[inset_0_0_0_1px_rgb(0_0_0_/_0.08)]" />
      <div className="absolute left-1/2 top-3 h-[calc(100%-1.5rem)] w-0.5 -translate-x-1/2 bg-court-line/90 shadow-[0_0_10px_rgb(255_255_255_/_0.25)]" />
      <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-court-line/75" />
      <div className="absolute left-3 right-3 top-[32%] h-px -translate-y-1/2 bg-court-line/32" />
      <div className="absolute left-3 right-3 top-[68%] h-px -translate-y-1/2 bg-court-line/32" />
      <div className="absolute bottom-3 top-3 left-[24%] w-px bg-court-line/55" />
      <div className="absolute bottom-3 top-3 right-[24%] w-px bg-court-line/55" />
      <div className="absolute left-[calc(50%-2px)] top-3 h-[calc(100%-1.5rem)] w-1 bg-black/12" />
      {courtNumber ? <span className="absolute left-3 top-2 rounded bg-black/20 px-2 py-1 text-xs font-bold">C{courtNumber}</span> : null}
      <CourtName className="left-[12%] top-[22%]" player={teamA?.[0]} />
      <CourtName className="left-[12%] bottom-[22%]" player={teamA?.[1]} />
      <CourtName className="right-[12%] top-[22%]" player={teamB?.[0]} align="right" />
      <CourtName className="right-[12%] bottom-[22%]" player={teamB?.[1]} align="right" />
    </div>
  );
}

function CourtName({ player, className, align = "left" }: { player?: Player; className: string; align?: "left" | "right" }) {
  if (!player) return null;
  return (
    <span
      className={cn(
        "absolute max-w-[38%] truncate rounded bg-black/22 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm",
        align === "right" && "text-right",
        className,
      )}
    >
      {player.name}
    </span>
  );
}
