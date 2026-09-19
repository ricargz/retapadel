import { describe, expect, it } from "vitest";
import { getMaximumCourts, validateScore, validateTournamentConfig } from "@/core/tournament/validators";

describe("tournament validators", () => {
  it("limits court count to groups of four players", () => {
    expect(getMaximumCourts(4)).toBe(1);
    expect(getMaximumCourts(7)).toBe(1);
    expect(getMaximumCourts(8)).toBe(2);
    expect(getMaximumCourts(15)).toBe(3);
    expect(getMaximumCourts(20)).toBe(5);
  });

  it("rejects invalid tournament setup", () => {
    expect(validateTournamentConfig(3, 1)).toContain("cuatro");
    expect(validateTournamentConfig(7, 2)).toContain("solo puedes usar");
    expect(validateTournamentConfig(8, 2)).toBeNull();
  });

  it("rejects ties and negative scores", () => {
    expect(validateScore(4, 4)).toContain("empatado");
    expect(validateScore(-1, 4)).toContain("negativo");
    expect(validateScore(6, 4)).toBeNull();
  });
});
