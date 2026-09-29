import { ArrowLeft, ChartNoAxesColumnIncreasing, MapPin, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { SplitBar } from "../components/Charts";
import { EventTimeline } from "../components/EventTimeline";
import { CountryLabel } from "../components/Flag";
import { LineupPitch } from "../components/Pitch";
import { TeamBadge } from "../components/TeamBadge";
import { useWorldCupData } from "../lib/data";
import { formatKickoff } from "../lib/format";

export function MatchDetailPage() {
  const { matchId } = useParams();
  const { matches } = useWorldCupData();
  const match = matches.find((item) => item.id === Number(matchId));

  if (!match) {
    return (
      <main className="shell page-state">
        <h1>Match not found</h1>
        <Link to="/matches">Back to matches</Link>
      </main>
    );
  }

  const homeStats = match.teamStats.find((stat) => stat.teamId === match.homeTeamId);
  const awayStats = match.teamStats.find((stat) => stat.teamId === match.awayTeamId);

  return (
    <main className="shell">
      <Link to="/matches" className="back-link">
        <ArrowLeft size={16} /> Match center
      </Link>

      <section className="match-hero">
        <div>
          <span className="eyebrow">{match.stage?.name} · Match {match.id}</span>
          <div className="match-hero-teams">
            <TeamBadge team={match.homeTeam} size="lg" />
            <strong className="scoreline">{match.scoreline}</strong>
            <TeamBadge team={match.awayTeam} size="lg" />
          </div>
          <p>{formatKickoff(match)} · {match.venue?.stadiumName}</p>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="stat-card">
          <ShieldCheck />
          <div>
            <span>Player of the Match</span>
            <strong>{match.playerOfTheMatch?.playerName ?? "Not published"}</strong>
            <small>{match.playerOfTheMatch?.teamName ?? "Awaiting source data"}</small>
          </div>
        </article>
        <article className="stat-card">
          <ChartNoAxesColumnIncreasing />
          <div>
            <span>Total xG</span>
            <strong>{match.totalXg ?? "N/A"}</strong>
            <small>{match.status}</small>
          </div>
        </article>
        <article className="stat-card">
          <MapPin />
          <div>
            <span>Venue</span>
            <strong>{match.venue?.city}</strong>
            <small>
              {match.venue ? <CountryLabel code={match.venue.flagCode} label={match.venue.country} /> : null}
              {match.venue ? ` · ${match.venue.elevationMeters}m` : null}
            </small>
          </div>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Match flow</span>
              <h2>Event timeline</h2>
            </div>
          </div>
          <EventTimeline
            events={match.events}
            homeTeamId={match.homeTeamId}
            awayTeamId={match.awayTeamId}
            homeTeamName={match.homeTeam.teamName}
            awayTeamName={match.awayTeam.teamName}
          />
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Team stats</span>
              <h2>Pressure comparison</h2>
            </div>
          </div>
          {homeStats && awayStats ? (
            <div className="stat-comparison">
              <SplitBar
                leftLabel={match.homeTeam.fifaCode}
                rightLabel={match.awayTeam.fifaCode}
                leftValue={homeStats.possessionPct}
                rightValue={awayStats.possessionPct}
                suffix="%"
              />
              <SplitBar
                leftLabel="Shots"
                rightLabel="Shots"
                leftValue={homeStats.totalShots}
                rightValue={awayStats.totalShots}
              />
              <SplitBar
                leftLabel="On target"
                rightLabel="On target"
                leftValue={homeStats.shotsOnTarget}
                rightValue={awayStats.shotsOnTarget}
              />
              <SplitBar
                leftLabel="Corners"
                rightLabel="Corners"
                leftValue={homeStats.corners}
                rightValue={awayStats.corners}
              />
              <small>Source: {homeStats.dataSource} · updated {homeStats.lastUpdated}</small>
            </div>
          ) : (
            <p className="empty-copy">Team stats are not available for this match yet.</p>
          )}
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading">
            <h2>{match.homeTeam.teamName} XI · {match.lineups.homeFormation ?? "N/A"}</h2>
          </div>
          <LineupPitch players={match.lineups.home} />
        </article>
        <article className="panel">
          <div className="section-heading">
            <h2>{match.awayTeam.teamName} XI · {match.lineups.awayFormation ?? "N/A"}</h2>
          </div>
          <LineupPitch players={match.lineups.away} />
        </article>
      </section>
    </main>
  );
}
