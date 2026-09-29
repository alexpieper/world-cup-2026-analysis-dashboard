export type PositionCode = "GK" | "DEF" | "MID" | "FWD";

export interface PlayerProfile {
  id: number;
  teamId: number;
  teamName: string;
  playerName: string;
  shortName: string;
  position: PositionCode;
  clubTeam: string;
  marketValueEur: number;
  marketValueMillions: number;
  caps: number;
  dateOfBirth: string;
  age: number | null;
  heightCm: number;
  internationalGoals: number;
}

export interface StandingRow {
  teamId: number;
  teamName: string;
  fifaCode: string;
  groupLetter: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  xgFor: number;
  xgAgainst: number;
  xgDifference: number;
  position?: number;
}

export interface TeamStatsAverage {
  sampleSize: number;
  avgPossession: number;
  avgShots: number;
  avgShotsOnTarget: number;
  avgCorners: number;
  avgFouls: number;
  avgSaves: number;
}

export interface ResultHistoryItem {
  matchId: number;
  date: string;
  opponentId: number;
  opponentName: string;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
}

export interface TeamSummary {
  id: number;
  teamName: string;
  fifaCode: string;
  flagCode: string;
  countryLatitude: number | null;
  countryLongitude: number | null;
  groupLetter: string;
  confederation: string;
  fifaRanking: number;
  eloRating: number;
  managerName: string;
  players: PlayerProfile[];
  squadValueEur: number;
  squadValueMillions: number;
  avgMarketValueMillions: number;
  avgCaps: number;
  avgAge: number;
  avgHeightCm: number;
  positionCounts: Partial<Record<PositionCode, number>>;
  topPlayers: PlayerProfile[];
  standing: StandingRow;
  form: Array<"W" | "D" | "L">;
  resultHistory: ResultHistoryItem[];
  matchIds: number[];
  completedMatchIds: number[];
  eventCounts: Record<string, number>;
  statsAverage: TeamStatsAverage;
  tournamentGoalsFromEvents: number;
  cards: number;
  ranks: {
    squadValue: number;
    elo: number;
    fifa: number;
    points: number;
  };
}

export interface Stage {
  id: number;
  name: string;
  isKnockout: boolean;
}

export interface Referee {
  id: number;
  name: string;
  country: string;
  flagCode: string;
  avgCardsPerGame: number | null;
}

export interface VenueSummary {
  id: number;
  stadiumName: string;
  city: string;
  country: string;
  flagCode: string;
  capacity: number;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  matchIds: number[];
  matchCount: number;
  completedCount: number;
  avgGoals: number;
  avgXg: number;
}

export interface MatchEvent {
  id: number;
  matchId: number;
  minute: number;
  eventType: string;
  teamId: number;
  teamName: string;
  playerId: number;
  playerName: string;
  position: string;
}

export interface TeamStatLine {
  matchId: number;
  teamId: number;
  teamName: string;
  possessionPct: number;
  totalShots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  offsides: number;
  saves: number;
  playerOfTheMatch: string;
  dataSource: string;
  lastUpdated: string;
}

export interface LineupPlayer {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  shortName: string;
  position: PositionCode | "";
  teamId: number;
  teamName: string;
  isStartingXi: boolean;
  tacticalPosition: string;
  minutesPlayed: number;
  marketValueEur: number;
  age: number | null;
}

export interface MatchDetail {
  id: number;
  date: string;
  kickoffTimeUtc: string;
  stageId: number;
  venueId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: "Completed" | "Scheduled" | string;
  homeXg: number | null;
  awayXg: number | null;
  refereeId: number;
  playerOfTheMatchId: number | null;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  stage: Stage | null;
  venue: VenueSummary | null;
  referee: Referee | null;
  playerOfTheMatch: PlayerProfile | null;
  scoreline: string;
  totalGoals: number | null;
  totalXg: number | null;
  events: MatchEvent[];
  teamStats: TeamStatLine[];
  lineups: {
    home: LineupPlayer[];
    away: LineupPlayer[];
    homeFormation: string | null;
    awayFormation: string | null;
    formationSource: "derived" | "override" | "unavailable";
  };
}

export interface StandingsGroup {
  groupLetter: string;
  teams: StandingRow[];
}

export interface GroupStageExplorerGroup {
  groupLetter: string;
  leaderTeamId: number | null;
  standings: StandingRow[];
  matchIds: number[];
  completedCount: number;
  scheduledCount: number;
}

export interface BracketSlot {
  slotId: string;
  stageId: number;
  stageName: string;
  position: number;
  matchId: number | null;
  source: "dataset" | "placeholder";
}

export interface BracketRound {
  stageId: number;
  stageName: string;
  isThirdPlace: boolean;
  slots: BracketSlot[];
}

export interface MatchExplorerData {
  groupStage: GroupStageExplorerGroup[];
  knockoutBracket: {
    hasKnockoutMatches: boolean;
    rounds: BracketRound[];
    note: string;
  };
}

export interface RegressionPoint {
  id: number;
  label: string;
  x: number;
  y: number;
}

export interface Regression {
  n: number;
  slope: number;
  intercept: number;
  r2: number;
  points: RegressionPoint[];
}

export interface AnalyticsBundle {
  kpis: {
    teams: number;
    players: number;
    venues: number;
    matches: number;
    completedMatches: number;
    scheduledMatches: number;
    goals: number;
    avgGoals: number;
    totalSquadValueEur: number;
    totalSquadValueBillions: number;
    lastStatsUpdated: string | null;
    firstMatchDate: string | null;
    lastMatchDate: string | null;
  };
  topSquads: TeamSummary[];
  topPlayersByValue: PlayerProfile[];
  topTournamentScorers: Array<{
    playerId: number;
    playerName: string;
    teamId: number;
    teamName: string;
    goals: number;
  }>;
  topTournamentAssists: Array<{
    playerId: number;
    playerName: string;
    teamId: number;
    teamName: string;
    assists: number;
  }>;
  standingsTop: StandingRow[];
  xgOverperformers: Array<{
    teamId: number;
    teamName: string;
    groupLetter: string;
    goalsFor: number;
    xgFor: number;
    delta: number;
  }>;
  xgUnderperformers: Array<{
    teamId: number;
    teamName: string;
    groupLetter: string;
    goalsFor: number;
    xgFor: number;
    delta: number;
  }>;
  discipline: Array<{
    teamId: number;
    teamName: string;
    yellowCards: number;
    redCards: number;
    cards: number;
  }>;
  venueTrends: VenueSummary[];
  eventTypeCounts: Array<{
    eventType: string;
    count: number;
  }>;
  regressions: {
    squadValueToPoints: Regression;
    eloToPoints: Regression;
    fifaRankToPoints: Regression;
  };
}

export interface WorldCupData {
  meta: {
    title: string;
    generatedAt: string;
    datasetRoot: string;
    sourceFiles: Record<string, number>;
    notes: string[];
  };
  teams: TeamSummary[];
  players: PlayerProfile[];
  matches: MatchDetail[];
  venues: VenueSummary[];
  referees: Referee[];
  stages: Stage[];
  standings: StandingsGroup[];
  matchExplorer: MatchExplorerData;
  analytics: AnalyticsBundle;
}
