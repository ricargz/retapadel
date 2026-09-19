import Dexie, { type Table } from "dexie";
import type { ThemeMode, Tournament } from "@/core/tournament/types";

export interface TournamentRecord {
  id: "active";
  tournament: Tournament;
  updatedAt: string;
}

export interface PreferenceRecord {
  key: "theme";
  value: ThemeMode;
  updatedAt: string;
}

export class RetapadelDatabase extends Dexie {
  tournaments!: Table<TournamentRecord, string>;
  preferences!: Table<PreferenceRecord, string>;

  constructor() {
    super("retapadel");
    this.version(1).stores({
      tournaments: "id, updatedAt",
      preferences: "key",
    });
  }
}

export const db = new RetapadelDatabase();
