"use client";

import { BarChart3, History, LayoutGrid } from "lucide-react";
import type { TournamentTab } from "@/stores/tournament-store";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs: Array<{ value: TournamentTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "round", label: "Ronda", icon: LayoutGrid },
  { value: "history", label: "Historial", icon: History },
  { value: "standings", label: "Tabla", icon: BarChart3 },
];

export function TournamentNavigation() {
  return (
    <TabsList className="sticky top-[72px] z-20 mb-4 grid-cols-3 gap-1.5 rounded-lg border border-border bg-surface/92 p-1.5 shadow-soft backdrop-blur">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="group min-h-[3.25rem] flex-col gap-1 rounded-md px-2 text-xs data-[state=active]:shadow-sm sm:min-h-11 sm:flex-row sm:text-sm"
          >
            <span className="grid h-7 w-7 place-items-center rounded border border-border bg-surface text-text-secondary transition group-data-[state=active]:border-primary/40 group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-contrast">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>{tab.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
