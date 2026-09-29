import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const datasetRoot = process.env.DATASET_ROOT
  ? path.resolve(process.env.DATASET_ROOT)
  : path.resolve(appRoot, "..");
const publicDataDir = path.join(appRoot, "public", "data");
const publicFlagsDir = path.join(appRoot, "public", "flags");
const outputPath = path.join(publicDataDir, "world-cup.json");
const tournamentReferenceDate = new Date("2026-06-11T00:00:00Z");
const formationOverridesPath = path.join(appRoot, "data", "formation-overrides.json");

const csvFiles = [
  "teams.csv",
  "venues.csv",
  "tournament_stages.csv",
  "referees.csv",
  "matches.csv",
  "matches_detailed.csv",
  "squads_and_players.csv",
  "match_events.csv",
  "match_team_stats.csv",
  "match_lineups.csv"
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  const [headers, ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
  );
}

function readCsv(fileName) {
  const filePath = path.join(datasetRoot, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing expected dataset file: ${filePath}`);
  }
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function integer(value, fallback = 0) {
  const numeric = numberOrNull(value);
  return numeric === null ? fallback : Math.trunc(numeric);
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function yearsBetween(startDate, endDate) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return null;
  let years = endDate.getUTCFullYear() - start.getUTCFullYear();
  const monthDiff = endDate.getUTCMonth() - start.getUTCMonth();
  const dayDiff = endDate.getUTCDate() - start.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years -= 1;
  return years;
}

function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function byNumberDesc(field) {
  return (a, b) => (b[field] ?? 0) - (a[field] ?? 0);
}

function rank(items, selector, descending = true) {
  const sorted = [...items].sort((a, b) => {
    const delta = selector(a) - selector(b);
    return descending ? -delta : delta;
  });
  const ranks = new Map();
  sorted.forEach((item, index) => {
    ranks.set(item.id, index + 1);
  });
  return ranks;
}

function linearRegression(points) {
  const clean = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const n = clean.length;
  if (n < 2) {
    return { n, slope: 0, intercept: 0, r2: 0, points: clean };
  }

  const sumX = clean.reduce((sum, point) => sum + point.x, 0);
  const sumY = clean.reduce((sum, point) => sum + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  const numerator = clean.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const denominator = clean.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  const totalSumSquares = clean.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const residualSumSquares = clean.reduce(
    (sum, point) => sum + (point.y - (slope * point.x + intercept)) ** 2,
    0
  );
  const r2 = totalSumSquares === 0 ? 0 : 1 - residualSumSquares / totalSumSquares;

  return {
    n,
    slope: round(slope, 4),
    intercept: round(intercept, 4),
    r2: round(r2, 3),
    points: clean
  };
}

function standingSort(a, b) {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.teamName.localeCompare(b.teamName)
  );
}

const fifaToFlagCode = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz"
};

const venueCountryToFlagCode = {
  CAN: "ca",
  MEX: "mx",
  USA: "us"
};

const refereeCountryToFlagCode = {
  Argentina: "ar",
  Brazil: "br",
  Canada: "ca",
  China: "cn",
  Colombia: "co",
  England: "gb-eng",
  France: "fr",
  Germany: "de",
  Italy: "it",
  Japan: "jp",
  Mexico: "mx",
  Netherlands: "nl",
  Poland: "pl",
  Senegal: "sn",
  Slovenia: "si",
  Spain: "es",
  USA: "us"
};

const teamCountryCoordinates = {
  ALG: { latitude: 28.03, longitude: 1.66 },
  ARG: { latitude: -38.42, longitude: -63.62 },
  AUS: { latitude: -25.27, longitude: 133.78 },
  AUT: { latitude: 47.52, longitude: 14.55 },
  BEL: { latitude: 50.5, longitude: 4.47 },
  BIH: { latitude: 44.17, longitude: 17.78 },
  BRA: { latitude: -14.24, longitude: -51.93 },
  CAN: { latitude: 56.13, longitude: -106.35 },
  CIV: { latitude: 7.54, longitude: -5.55 },
  COD: { latitude: -2.88, longitude: 23.65 },
  COL: { latitude: 4.57, longitude: -74.3 },
  CPV: { latitude: 16, longitude: -24 },
  CRO: { latitude: 45.1, longitude: 15.2 },
  CUW: { latitude: 12.17, longitude: -69 },
  CZE: { latitude: 49.82, longitude: 15.47 },
  ECU: { latitude: -1.83, longitude: -78.18 },
  EGY: { latitude: 26.82, longitude: 30.8 },
  ENG: { latitude: 52.35, longitude: -1.17 },
  ESP: { latitude: 40.46, longitude: -3.75 },
  FRA: { latitude: 46.23, longitude: 2.21 },
  GER: { latitude: 51.17, longitude: 10.45 },
  GHA: { latitude: 7.95, longitude: -1.02 },
  HAI: { latitude: 18.97, longitude: -72.29 },
  IRN: { latitude: 32.43, longitude: 53.69 },
  IRQ: { latitude: 33.22, longitude: 43.68 },
  JOR: { latitude: 31.24, longitude: 36.51 },
  JPN: { latitude: 36.2, longitude: 138.25 },
  KOR: { latitude: 36.5, longitude: 127.8 },
  KSA: { latitude: 23.89, longitude: 45.08 },
  MAR: { latitude: 31.79, longitude: -7.09 },
  MEX: { latitude: 23.63, longitude: -102.55 },
  NED: { latitude: 52.13, longitude: 5.29 },
  NOR: { latitude: 60.47, longitude: 8.47 },
  NZL: { latitude: -40.9, longitude: 174.89 },
  PAN: { latitude: 8.54, longitude: -80.78 },
  PAR: { latitude: -23.44, longitude: -58.44 },
  POR: { latitude: 39.4, longitude: -8.22 },
  QAT: { latitude: 25.35, longitude: 51.18 },
  RSA: { latitude: -30.56, longitude: 22.94 },
  SCO: { latitude: 56.49, longitude: -4.2 },
  SEN: { latitude: 14.5, longitude: -14.45 },
  SUI: { latitude: 46.82, longitude: 8.23 },
  SWE: { latitude: 60.13, longitude: 18.64 },
  TUN: { latitude: 33.89, longitude: 9.54 },
  TUR: { latitude: 38.96, longitude: 35.24 },
  URU: { latitude: -32.52, longitude: -55.77 },
  USA: { latitude: 39.83, longitude: -98.58 },
  UZB: { latitude: 41.38, longitude: 64.59 }
};

function flagCodeForTeam(fifaCode) {
  return fifaToFlagCode[fifaCode] ?? fifaCode.toLowerCase();
}

function shortPlayerName(playerName) {
  if (!playerName) return "";
  const suffixes = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);
  const parts = playerName
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  while (parts.length > 1 && suffixes.has(parts.at(-1).toLowerCase())) parts.pop();
  return parts.at(-1) ?? playerName;
}

function loadFormationOverrides() {
  if (!fs.existsSync(formationOverridesPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(formationOverridesPath, "utf8"));
  } catch (error) {
    console.warn(`Could not parse formation overrides at ${formationOverridesPath}: ${error.message}`);
    return {};
  }
}

function inferFormation(lineupPlayers) {
  const starters = lineupPlayers.filter((player) => player.isStartingXi && player.minutesPlayed > 0);
  if (!starters.length) return null;
  const counts = { DEF: 0, MID: 0, FWD: 0 };
  starters.forEach((player) => {
    if (Object.prototype.hasOwnProperty.call(counts, player.tacticalPosition)) {
      counts[player.tacticalPosition] += 1;
    } else if (Object.prototype.hasOwnProperty.call(counts, player.position)) {
      counts[player.position] += 1;
    }
  });
  if (counts.DEF + counts.MID + counts.FWD === 0) return null;
  return `${counts.DEF}-${counts.MID}-${counts.FWD}`;
}

function copyFlagAssets(flagCodes) {
  const sourceDir = path.join(appRoot, "node_modules", "flag-icons", "flags", "4x3");
  fs.mkdirSync(publicFlagsDir, { recursive: true });
  [...flagCodes].sort().forEach((flagCode) => {
    if (!flagCode) return;
    const sourcePath = path.join(sourceDir, `${flagCode}.svg`);
    const destinationPath = path.join(publicFlagsDir, `${flagCode}.svg`);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destinationPath);
    } else {
      console.warn(`Missing flag asset for '${flagCode}' at ${sourcePath}`);
    }
  });
}

const formationOverrides = loadFormationOverrides();

const rows = Object.fromEntries(csvFiles.map((file) => [file, readCsv(file)]));

const stages = rows["tournament_stages.csv"].map((stage) => ({
  id: integer(stage.stage_id),
  name: stage.stage_name,
  isKnockout: stage.is_knockout === "True"
}));
const stageById = new Map(stages.map((stage) => [stage.id, stage]));

const referees = rows["referees.csv"].map((referee) => ({
  id: integer(referee.referee_id),
  name: referee.name,
  country: referee.country,
  flagCode: refereeCountryToFlagCode[referee.country] ?? "",
  avgCardsPerGame: numberOrNull(referee.avg_cards_per_game)
}));
const refereeById = new Map(referees.map((referee) => [referee.id, referee]));

const venuesRaw = rows["venues.csv"].map((venue) => ({
  id: integer(venue.venue_id),
  stadiumName: venue.stadium_name,
  city: venue.city,
  country: venue.country,
  flagCode: venueCountryToFlagCode[venue.country] ?? venue.country.toLowerCase(),
  capacity: integer(venue.capacity),
  latitude: numberOrNull(venue.latitude),
  longitude: numberOrNull(venue.longitude),
  elevationMeters: integer(venue.elevation_meters)
}));
const venueById = new Map(venuesRaw.map((venue) => [venue.id, venue]));

const teamsRaw = rows["teams.csv"].map((team) => ({
  id: integer(team.team_id),
  teamName: team.team_name,
  fifaCode: team.fifa_code,
  flagCode: flagCodeForTeam(team.fifa_code),
  countryLatitude: teamCountryCoordinates[team.fifa_code]?.latitude ?? null,
  countryLongitude: teamCountryCoordinates[team.fifa_code]?.longitude ?? null,
  groupLetter: team.group_letter,
  confederation: team.confederation,
  fifaRanking: integer(team.fifa_ranking_pre_tournament),
  eloRating: integer(team.elo_rating),
  managerName: team.manager_name
}));
const teamById = new Map(teamsRaw.map((team) => [team.id, team]));

const players = rows["squads_and_players.csv"].map((player) => {
  const age = yearsBetween(player.date_of_birth, tournamentReferenceDate);
  const marketValueEur = integer(player.market_value_eur);
  return {
    id: integer(player.player_id),
    teamId: integer(player.team_id),
    teamName: teamById.get(integer(player.team_id))?.teamName ?? "Unknown",
    playerName: player.player_name,
    shortName: shortPlayerName(player.player_name),
    position: player.position,
    clubTeam: player.club_team,
    marketValueEur,
    marketValueMillions: round(marketValueEur / 1_000_000, 2),
    caps: integer(player.caps),
    dateOfBirth: player.date_of_birth,
    age,
    heightCm: integer(player.height_cm),
    internationalGoals: integer(player.goals)
  };
});
const playerById = new Map(players.map((player) => [player.id, player]));
const playersByTeam = groupBy(players, (player) => player.teamId);

const matches = rows["matches.csv"].map((match) => {
  const homeTeamId = integer(match.home_team_id);
  const awayTeamId = integer(match.away_team_id);
  return {
    id: integer(match.match_id),
    date: match.date,
    kickoffTimeUtc: match.kickoff_time_utc,
    stageId: integer(match.stage_id),
    venueId: integer(match.venue_id),
    homeTeamId,
    awayTeamId,
    homeScore: numberOrNull(match.home_score),
    awayScore: numberOrNull(match.away_score),
    status: match.status,
    homeXg: numberOrNull(match.home_xg),
    awayXg: numberOrNull(match.away_xg),
    refereeId: integer(match.referee_id),
    playerOfTheMatchId: numberOrNull(match.player_of_the_match_id),
    homeTeam: teamById.get(homeTeamId)?.teamName ?? "Unknown",
    awayTeam: teamById.get(awayTeamId)?.teamName ?? "Unknown"
  };
});
const matchById = new Map(matches.map((match) => [match.id, match]));

const events = rows["match_events.csv"].map((event) => {
  const player = playerById.get(integer(event.player_id));
  const team = teamById.get(integer(event.team_id));
  return {
    id: integer(event.event_id),
    matchId: integer(event.match_id),
    minute: integer(event.minute),
    eventType: event.event_type,
    teamId: integer(event.team_id),
    teamName: team?.teamName ?? "Unknown",
    playerId: integer(event.player_id),
    playerName: player?.playerName ?? "Unknown",
    position: player?.position ?? ""
  };
});
const eventsByMatch = groupBy(events, (event) => event.matchId);

const teamStats = rows["match_team_stats.csv"].map((stat) => ({
  matchId: integer(stat.match_id),
  teamId: integer(stat.team_id),
  teamName: teamById.get(integer(stat.team_id))?.teamName ?? "Unknown",
  possessionPct: integer(stat.possession_pct),
  totalShots: integer(stat.total_shots),
  shotsOnTarget: integer(stat.shots_on_target),
  corners: integer(stat.corners),
  fouls: integer(stat.fouls),
  offsides: integer(stat.offsides),
  saves: integer(stat.saves),
  playerOfTheMatch: stat.player_of_the_match,
  dataSource: stat.data_source,
  lastUpdated: stat.last_updated
}));
const teamStatsByMatch = groupBy(teamStats, (stat) => stat.matchId);
const teamStatsByTeam = groupBy(teamStats, (stat) => stat.teamId);

const lineups = rows["match_lineups.csv"].map((lineup) => {
  const player = playerById.get(integer(lineup.player_id));
  return {
    id: integer(lineup.lineup_id),
    matchId: integer(lineup.match_id),
    playerId: integer(lineup.player_id),
    playerName: player?.playerName ?? "Unknown",
    shortName: player?.shortName ?? shortPlayerName(player?.playerName ?? "Unknown"),
    position: player?.position ?? "",
    teamId: integer(lineup.team_id),
    teamName: teamById.get(integer(lineup.team_id))?.teamName ?? "Unknown",
    isStartingXi: lineup.is_starting_xi === "1",
    tacticalPosition: lineup.tactical_position,
    minutesPlayed: integer(lineup.minutes_played),
    marketValueEur: player?.marketValueEur ?? 0,
    age: player?.age ?? null
  };
});
const lineupsByMatch = groupBy(lineups, (lineup) => lineup.matchId);

const standingsByTeam = new Map();
const resultHistoryByTeam = new Map();
teamsRaw.forEach((team) => {
  standingsByTeam.set(team.id, {
    teamId: team.id,
    teamName: team.teamName,
    fifaCode: team.fifaCode,
    groupLetter: team.groupLetter,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    xgFor: 0,
    xgAgainst: 0,
    xgDifference: 0
  });
  resultHistoryByTeam.set(team.id, []);
});

function applyResult(teamId, opponentId, goalsFor, goalsAgainst, xgFor, xgAgainst, match) {
  const standing = standingsByTeam.get(teamId);
  standing.played += 1;
  standing.goalsFor += goalsFor;
  standing.goalsAgainst += goalsAgainst;
  standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  standing.xgFor += xgFor ?? 0;
  standing.xgAgainst += xgAgainst ?? 0;
  standing.xgDifference = standing.xgFor - standing.xgAgainst;

  let result = "D";
  if (goalsFor > goalsAgainst) {
    standing.wins += 1;
    standing.points += 3;
    result = "W";
  } else if (goalsFor === goalsAgainst) {
    standing.draws += 1;
    standing.points += 1;
  } else {
    standing.losses += 1;
    result = "L";
  }

  resultHistoryByTeam.get(teamId).push({
    matchId: match.id,
    date: match.date,
    opponentId,
    opponentName: teamById.get(opponentId)?.teamName ?? "Unknown",
    goalsFor,
    goalsAgainst,
    result
  });
}

matches
  .filter((match) => match.status === "Completed")
  .forEach((match) => {
    applyResult(
      match.homeTeamId,
      match.awayTeamId,
      match.homeScore ?? 0,
      match.awayScore ?? 0,
      match.homeXg,
      match.awayXg,
      match
    );
    applyResult(
      match.awayTeamId,
      match.homeTeamId,
      match.awayScore ?? 0,
      match.homeScore ?? 0,
      match.awayXg,
      match.homeXg,
      match
    );
  });

const standings = Object.entries(groupBy([...standingsByTeam.values()], (team) => team.groupLetter))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([groupLetter, teams]) => ({
    groupLetter,
    teams: teams.sort(standingSort).map((team, index) => ({
      ...team,
      position: index + 1,
      xgFor: round(team.xgFor),
      xgAgainst: round(team.xgAgainst),
      xgDifference: round(team.xgDifference)
    }))
  }));

const teamEventCounts = new Map();
events.forEach((event) => {
  const counts = teamEventCounts.get(event.teamId) ?? {};
  counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
  teamEventCounts.set(event.teamId, counts);
});

function aggregateStats(stats) {
  if (!stats?.length) {
    return {
      sampleSize: 0,
      avgPossession: 0,
      avgShots: 0,
      avgShotsOnTarget: 0,
      avgCorners: 0,
      avgFouls: 0,
      avgSaves: 0
    };
  }
  return {
    sampleSize: stats.length,
    avgPossession: round(stats.reduce((sum, stat) => sum + stat.possessionPct, 0) / stats.length, 1),
    avgShots: round(stats.reduce((sum, stat) => sum + stat.totalShots, 0) / stats.length, 1),
    avgShotsOnTarget: round(
      stats.reduce((sum, stat) => sum + stat.shotsOnTarget, 0) / stats.length,
      1
    ),
    avgCorners: round(stats.reduce((sum, stat) => sum + stat.corners, 0) / stats.length, 1),
    avgFouls: round(stats.reduce((sum, stat) => sum + stat.fouls, 0) / stats.length, 1),
    avgSaves: round(stats.reduce((sum, stat) => sum + stat.saves, 0) / stats.length, 1)
  };
}

const teamSummariesBase = teamsRaw.map((team) => {
  const roster = playersByTeam[team.id] ?? [];
  const standing = standingsByTeam.get(team.id);
  const resultHistory = [...(resultHistoryByTeam.get(team.id) ?? [])].sort(
    (a, b) => a.date.localeCompare(b.date) || a.matchId - b.matchId
  );
  const squadValue = roster.reduce((sum, player) => sum + player.marketValueEur, 0);
  const ages = roster.map((player) => player.age).filter((age) => age !== null);
  const positionCounts = roster.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] ?? 0) + 1;
    return acc;
  }, {});
  const matchIds = matches
    .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .map((match) => match.id);
  const completedMatchIds = matches
    .filter(
      (match) =>
        match.status === "Completed" && (match.homeTeamId === team.id || match.awayTeamId === team.id)
    )
    .map((match) => match.id);
  const eventCounts = teamEventCounts.get(team.id) ?? {};
  const statsAverage = aggregateStats(teamStatsByTeam[team.id] ?? []);

  return {
    ...team,
    players: roster,
    squadValueEur: squadValue,
    squadValueMillions: round(squadValue / 1_000_000, 1),
    avgMarketValueMillions: round(squadValue / Math.max(roster.length, 1) / 1_000_000, 2),
    avgCaps: round(roster.reduce((sum, player) => sum + player.caps, 0) / Math.max(roster.length, 1), 1),
    avgAge: round(ages.reduce((sum, age) => sum + age, 0) / Math.max(ages.length, 1), 1),
    avgHeightCm: round(
      roster.reduce((sum, player) => sum + player.heightCm, 0) / Math.max(roster.length, 1),
      1
    ),
    positionCounts,
    topPlayers: [...roster].sort(byNumberDesc("marketValueEur")).slice(0, 6),
    standing: {
      ...standing,
      xgFor: round(standing.xgFor),
      xgAgainst: round(standing.xgAgainst),
      xgDifference: round(standing.xgDifference)
    },
    form: resultHistory.slice(-5).map((result) => result.result),
    resultHistory,
    matchIds,
    completedMatchIds,
    eventCounts,
    statsAverage,
    tournamentGoalsFromEvents: eventCounts.Goal ?? 0,
    cards: (eventCounts["Yellow Card"] ?? 0) + (eventCounts["Red Card"] ?? 0)
  };
});

const squadValueRanks = rank(teamSummariesBase, (team) => team.squadValueEur);
const eloRanks = rank(teamSummariesBase, (team) => team.eloRating);
const fifaRanks = rank(teamSummariesBase, (team) => team.fifaRanking, false);
const pointsRanks = rank(teamSummariesBase, (team) => team.standing.points);

const teams = teamSummariesBase.map((team) => ({
  ...team,
  ranks: {
    squadValue: squadValueRanks.get(team.id),
    elo: eloRanks.get(team.id),
    fifa: fifaRanks.get(team.id),
    points: pointsRanks.get(team.id)
  }
}));

const teamSummaryById = new Map(teams.map((team) => [team.id, team]));

const matchDetails = matches.map((match) => {
  const matchEvents = [...(eventsByMatch[match.id] ?? [])].sort((a, b) => a.minute - b.minute || a.id - b.id);
  const matchLineups = lineupsByMatch[match.id] ?? [];
  const homeLineup = matchLineups.filter((lineup) => lineup.teamId === match.homeTeamId);
  const awayLineup = matchLineups.filter((lineup) => lineup.teamId === match.awayTeamId);
  const homeOverride = formationOverrides[`${match.id}:${match.homeTeamId}`];
  const awayOverride = formationOverrides[`${match.id}:${match.awayTeamId}`];
  const playerOfTheMatch =
    match.playerOfTheMatchId === null ? null : playerById.get(match.playerOfTheMatchId) ?? null;
  return {
    ...match,
    stage: stageById.get(match.stageId) ?? null,
    venue: venueById.get(match.venueId) ?? null,
    referee: refereeById.get(match.refereeId) ?? null,
    homeTeam: teamSummaryById.get(match.homeTeamId),
    awayTeam: teamSummaryById.get(match.awayTeamId),
    playerOfTheMatch,
    scoreline:
      match.status === "Completed" ? `${match.homeScore ?? 0}-${match.awayScore ?? 0}` : "Scheduled",
    totalGoals: match.status === "Completed" ? (match.homeScore ?? 0) + (match.awayScore ?? 0) : null,
    totalXg:
      match.homeXg !== null && match.awayXg !== null ? round((match.homeXg ?? 0) + (match.awayXg ?? 0), 2) : null,
    events: matchEvents,
    teamStats: teamStatsByMatch[match.id] ?? [],
    lineups: {
      home: homeLineup,
      away: awayLineup,
      homeFormation: homeOverride?.formation ?? inferFormation(homeLineup),
      awayFormation: awayOverride?.formation ?? inferFormation(awayLineup),
      formationSource: homeOverride || awayOverride ? "override" : "derived"
    }
  };
});

const venues = venuesRaw.map((venue) => {
  const venueMatches = matchDetails.filter((match) => match.venueId === venue.id);
  const completed = venueMatches.filter((match) => match.status === "Completed");
  return {
    ...venue,
    matchIds: venueMatches.map((match) => match.id),
    matchCount: venueMatches.length,
    completedCount: completed.length,
    avgGoals: round(
      completed.reduce((sum, match) => sum + (match.totalGoals ?? 0), 0) / Math.max(completed.length, 1),
      2
    ),
    avgXg: round(
      completed.reduce((sum, match) => sum + (match.totalXg ?? 0), 0) / Math.max(completed.length, 1),
      2
    )
  };
});

const tournamentGoalEvents = events.filter((event) => event.eventType === "Goal");
const tournamentAssistEvents = events.filter((event) => event.eventType === "Assist");
const playerGoalCounts = Object.values(groupBy(tournamentGoalEvents, (event) => event.playerId)).map((items) => ({
  playerId: items[0].playerId,
  playerName: items[0].playerName,
  teamId: items[0].teamId,
  teamName: items[0].teamName,
  goals: items.length
}));
const playerAssistCounts = Object.values(groupBy(tournamentAssistEvents, (event) => event.playerId)).map((items) => ({
  playerId: items[0].playerId,
  playerName: items[0].playerName,
  teamId: items[0].teamId,
  teamName: items[0].teamName,
  assists: items.length
}));

const completedMatches = matchDetails.filter((match) => match.status === "Completed");
const scheduledMatches = matchDetails.filter((match) => match.status !== "Completed");
const goals = completedMatches.reduce((sum, match) => sum + (match.totalGoals ?? 0), 0);
const maxStatsUpdated = teamStats
  .map((stat) => stat.lastUpdated)
  .filter(Boolean)
  .sort()
  .at(-1);
const matchDateRange = matches.map((match) => match.date).sort();

const knockoutRoundSizes = {
  "Round of 32": 16,
  "Round of 16": 8,
  "Quarter-finals": 4,
  "Semi-finals": 2,
  Final: 1,
  "Third-place match": 1
};

function buildMatchExplorer() {
  const groupStage = standings.map((group) => {
    const groupTeamIds = new Set(group.teams.map((team) => team.teamId));
    const groupMatches = matchDetails
      .filter((match) => groupTeamIds.has(match.homeTeamId) && groupTeamIds.has(match.awayTeamId))
      .sort((a, b) => a.date.localeCompare(b.date) || a.kickoffTimeUtc.localeCompare(b.kickoffTimeUtc));
    const completedCount = groupMatches.filter((match) => match.status === "Completed").length;
    return {
      groupLetter: group.groupLetter,
      leaderTeamId: group.teams[0]?.teamId ?? null,
      standings: group.teams,
      matchIds: groupMatches.map((match) => match.id),
      completedCount,
      scheduledCount: groupMatches.length - completedCount
    };
  });

  const knockoutMatches = matchDetails
    .filter((match) => match.stage?.isKnockout)
    .sort((a, b) => a.stageId - b.stageId || a.date.localeCompare(b.date) || a.id - b.id);
  const knockoutMatchesByStage = groupBy(knockoutMatches, (match) => match.stageId);
  const rounds = stages
    .filter((stage) => stage.isKnockout)
    .map((stage) => {
      const stageMatches = knockoutMatchesByStage[stage.id] ?? [];
      const slotCount = Math.max(knockoutRoundSizes[stage.name] ?? stageMatches.length, stageMatches.length);
      return {
        stageId: stage.id,
        stageName: stage.name,
        isThirdPlace: stage.name === "Third-place match",
        slots: Array.from({ length: slotCount }, (_, index) => {
          const match = stageMatches[index];
          return {
            slotId: `${stage.id}-${index + 1}`,
            stageId: stage.id,
            stageName: stage.name,
            position: index + 1,
            matchId: match?.id ?? null,
            source: match ? "dataset" : "placeholder"
          };
        })
      };
    });

  return {
    groupStage,
    knockoutBracket: {
      hasKnockoutMatches: knockoutMatches.length > 0,
      rounds,
      note:
        knockoutMatches.length > 0
          ? "Knockout bracket is populated from matches.csv rows with knockout stage IDs."
          : "Knockout matches are not present in the current CSV yet."
    }
  };
}

const matchExplorer = buildMatchExplorer();

const analytics = {
  kpis: {
    teams: teams.length,
    players: players.length,
    venues: venues.length,
    matches: matchDetails.length,
    completedMatches: completedMatches.length,
    scheduledMatches: scheduledMatches.length,
    goals,
    avgGoals: round(goals / Math.max(completedMatches.length, 1), 2),
    totalSquadValueEur: teams.reduce((sum, team) => sum + team.squadValueEur, 0),
    totalSquadValueBillions: round(teams.reduce((sum, team) => sum + team.squadValueEur, 0) / 1_000_000_000, 2),
    lastStatsUpdated: maxStatsUpdated ?? null,
    firstMatchDate: matchDateRange[0] ?? null,
    lastMatchDate: matchDateRange.at(-1) ?? null
  },
  topSquads: [...teams].sort(byNumberDesc("squadValueEur")).slice(0, 12),
  topPlayersByValue: [...players].sort(byNumberDesc("marketValueEur")).slice(0, 16),
  topTournamentScorers: playerGoalCounts.sort(byNumberDesc("goals")).slice(0, 12),
  topTournamentAssists: playerAssistCounts.sort(byNumberDesc("assists")).slice(0, 12),
  standingsTop: standings.flatMap((group) => group.teams).sort(standingSort).slice(0, 12),
  xgOverperformers: [...teams]
    .filter((team) => team.standing.played > 0)
    .map((team) => ({
      teamId: team.id,
      teamName: team.teamName,
      groupLetter: team.groupLetter,
      goalsFor: team.standing.goalsFor,
      xgFor: team.standing.xgFor,
      delta: round(team.standing.goalsFor - team.standing.xgFor, 2)
    }))
    .sort(byNumberDesc("delta"))
    .slice(0, 10),
  xgUnderperformers: [...teams]
    .filter((team) => team.standing.played > 0)
    .map((team) => ({
      teamId: team.id,
      teamName: team.teamName,
      groupLetter: team.groupLetter,
      goalsFor: team.standing.goalsFor,
      xgFor: team.standing.xgFor,
      delta: round(team.standing.goalsFor - team.standing.xgFor, 2)
    }))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 10),
  discipline: [...teams]
    .map((team) => ({
      teamId: team.id,
      teamName: team.teamName,
      yellowCards: team.eventCounts["Yellow Card"] ?? 0,
      redCards: team.eventCounts["Red Card"] ?? 0,
      cards: team.cards
    }))
    .sort(byNumberDesc("cards"))
    .slice(0, 12),
  venueTrends: [...venues].sort(byNumberDesc("avgGoals")),
  eventTypeCounts: Object.entries(groupBy(events, (event) => event.eventType))
    .map(([eventType, items]) => ({ eventType, count: items.length }))
    .sort(byNumberDesc("count")),
  regressions: {
    squadValueToPoints: linearRegression(
      teams.map((team) => ({
        id: team.id,
        label: team.teamName,
        x: team.squadValueMillions,
        y: team.standing.points
      }))
    ),
    eloToPoints: linearRegression(
      teams.map((team) => ({
        id: team.id,
        label: team.teamName,
        x: team.eloRating,
        y: team.standing.points
      }))
    ),
    fifaRankToPoints: linearRegression(
      teams.map((team) => ({
        id: team.id,
        label: team.teamName,
        x: team.fifaRanking,
        y: team.standing.points
      }))
    )
  }
};

const dataset = {
  meta: {
    title: "FIFA World Cup 2026 Analytics",
    generatedAt: new Date().toISOString(),
    datasetRoot,
    sourceFiles: Object.fromEntries(csvFiles.map((file) => [file, rows[file].length])),
    notes: [
      "The app uses CSV files in the repository root as source of truth.",
      "Optional match events, team stats, and lineups are shown only when present.",
      "Group standings use points, goal difference, and goals for for this analytical view.",
      "Lineup formations are inferred from match_lineups.csv tactical-position counts unless an explicit local override is added."
    ]
  },
  teams,
  players,
  matches: matchDetails,
  venues,
  referees,
  stages,
  standings,
  matchExplorer,
  analytics
};

fs.mkdirSync(publicDataDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);
copyFlagAssets(
  new Set([
    ...teams.map((team) => team.flagCode),
    ...venues.map((venue) => venue.flagCode),
    ...referees.map((referee) => referee.flagCode)
  ])
);

console.log(`Built ${path.relative(process.cwd(), outputPath)}`);
console.log(
  `${teams.length} teams, ${players.length} players, ${matchDetails.length} matches, ${completedMatches.length} completed`
);
