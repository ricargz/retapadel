import type { Player } from "@/core/tournament/types";
import { cn } from "@/lib/utils";

interface PlayerChipProps {
  player: Player;
  state?: "playing" | "resting" | "winner" | "selected";
  compact?: boolean;
}

const stateClass = {
  playing: "border-border bg-surface text-text-primary",
  resting: "border-border bg-surface-muted text-text-secondary",
  winner: "border-success bg-success/12 text-text-primary",
  selected: "border-primary bg-primary/12 text-text-primary",
};

export function PlayerChip({ player, state = "playing", compact = false }: PlayerChipProps) {
  const initials = player.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("es-MX"))
    .join("");

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 rounded-md border px-2 py-1.5 text-sm font-semibold", stateClass[state])}>
      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded bg-primary/12 text-xs text-primary", compact && "h-6 w-6")}>{initials}</span>
      <span className="truncate">{player.name}</span>
    </span>
  );
}
