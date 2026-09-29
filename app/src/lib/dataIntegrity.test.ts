import { describe, expect, it } from "vitest";
import dataset from "../../public/data/world-cup.json";
import type { WorldCupData } from "../types/data";

const data = dataset as unknown as WorldCupData;

describe("generated World Cup data", () => {
  it("keeps the documented core dataset coverage", () => {
    expect(data.teams).toHaveLength(48);
    expect(data.players).toHaveLength(1248);
    expect(data.matches).toHaveLength(72);
    expect(data.venues).toHaveLength(16);
  });

  it("joins squads, matches, and teams consistently", () => {
    const teamIds = new Set(data.teams.map((team) => team.id));
    const playerIds = new Set(data.players.map((player) => player.id));

    for (const player of data.players) {
      expect(teamIds.has(player.teamId)).toBe(true);
    }

    for (const match of data.matches) {
      expect(teamIds.has(match.homeTeamId)).toBe(true);
      expect(teamIds.has(match.awayTeamId)).toBe(true);
      for (const event of match.events) {
        expect(playerIds.has(event.playerId)).toBe(true);
      }
    }
  });

  it("calculates a complete standings row for every team", () => {
    const rows = data.standings.flatMap((group) => group.teams);
    expect(rows).toHaveLength(48);
    expect(rows.every((row) => row.points >= 0 && row.played >= 0)).toBe(true);
  });

  it("retains optional-match coverage without requiring every match to have events", () => {
    const completed = data.matches.filter((match) => match.status === "Completed");
    const withLineups = completed.filter((match) => match.lineups.home.length || match.lineups.away.length);
    const withEvents = completed.filter((match) => match.events.length);

    expect(completed.length).toBe(data.analytics.kpis.completedMatches);
    expect(withLineups.length).toBeGreaterThan(0);
    expect(withEvents.length).toBeGreaterThan(0);
    expect(withEvents.length).toBeLessThanOrEqual(completed.length);
  });

  it("resolves flags and short player names for display components", () => {
    expect(data.teams.every((team) => team.flagCode && team.flagCode.length >= 2)).toBe(true);
    expect(
      data.teams.every((team) => team.countryLatitude !== null && team.countryLongitude !== null)
    ).toBe(true);
    expect(data.venues.every((venue) => ["us", "mx", "ca"].includes(venue.flagCode))).toBe(true);
    expect(data.players.every((player) => player.shortName && player.playerName.includes(player.shortName))).toBe(true);
  });

  it("derives lineup formations from starting XI tactical positions", () => {
    const completedWithLineups = data.matches.filter(
      (match) => match.status === "Completed" && match.lineups.home.length && match.lineups.away.length
    );

    expect(completedWithLineups.length).toBeGreaterThan(0);
    expect(completedWithLineups.every((match) => match.lineups.formationSource === "derived")).toBe(true);
    expect(completedWithLineups.some((match) => match.lineups.homeFormation === "4-4-2")).toBe(true);
  });

  it("generates match explorer groups and a knockout shell", () => {
    expect(data.matchExplorer.groupStage).toHaveLength(12);
    expect(data.matchExplorer.groupStage.reduce((sum, group) => sum + group.matchIds.length, 0)).toBe(72);

    const slotCounts = Object.fromEntries(
      data.matchExplorer.knockoutBracket.rounds.map((round) => [round.stageName, round.slots.length])
    );

    expect(data.matchExplorer.knockoutBracket.hasKnockoutMatches).toBe(false);
    expect(slotCounts["Round of 32"]).toBe(16);
    expect(slotCounts["Round of 16"]).toBe(8);
    expect(slotCounts["Quarter-finals"]).toBe(4);
    expect(slotCounts["Semi-finals"]).toBe(2);
    expect(slotCounts.Final).toBe(1);
    expect(slotCounts["Third-place match"]).toBe(1);
  });
});
