import { Building2, Mountain, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CountryLabel } from "../components/Flag";
import { StatCard } from "../components/StatCard";
import { VenueMap } from "../components/VenueMap";
import { useWorldCupData } from "../lib/data";
import { formatNumber } from "../lib/format";

export function VenuesPage() {
  const { venues, matches } = useWorldCupData();
  const [selectedId, setSelectedId] = useState(venues[0]?.id);
  const selectedVenue = venues.find((venue) => venue.id === selectedId) ?? venues[0];
  const venueMatches = matches.filter((match) => match.venueId === selectedVenue.id);

  return (
    <main className="shell">
      <section className="page-heading">
        <span className="eyebrow">Host geography</span>
        <h1>Stadium network across USA, Mexico, and Canada.</h1>
      </section>

      <section className="two-column wide-left">
        <article className="panel">
          <VenueMap venues={venues} selectedVenueId={selectedVenue.id} onSelectVenue={(venue) => setSelectedId(venue.id)} />
        </article>
        <aside className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <CountryLabel code={selectedVenue.flagCode} label={selectedVenue.country} />
              </span>
              <h2>{selectedVenue.city}</h2>
            </div>
          </div>
          <p className="lede">{selectedVenue.stadiumName}</p>
          <dl className="fact-list">
            <div><dt>Capacity</dt><dd>{formatNumber(selectedVenue.capacity)}</dd></div>
            <div><dt>Elevation</dt><dd>{selectedVenue.elevationMeters}m</dd></div>
            <div><dt>Matches</dt><dd>{selectedVenue.matchCount}</dd></div>
            <div><dt>Avg goals</dt><dd>{selectedVenue.avgGoals}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="kpi-grid">
        <StatCard label="Total capacity" value={formatNumber(venues.reduce((sum, venue) => sum + venue.capacity, 0))} icon={Users} />
        <StatCard label="Highest venue" value={`${Math.max(...venues.map((venue) => venue.elevationMeters))}m`} icon={Mountain} />
        <StatCard label="Host stadiums" value={venues.length} icon={Building2} />
      </section>

      <section className="venue-grid">
        {venues.map((venue) => (
          <button
            className={venue.id === selectedVenue.id ? "venue-card is-active" : "venue-card"}
            key={venue.id}
            type="button"
            onClick={() => setSelectedId(venue.id)}
          >
            <span>
              <CountryLabel code={venue.flagCode} label={venue.country} />
            </span>
            <strong>{venue.city}</strong>
            <small>{venue.stadiumName}</small>
            <em>{venue.matchCount} matches · {venue.avgGoals} avg goals</em>
          </button>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Matches at {selectedVenue.city}</h2>
        </div>
        <div className="result-list compact">
          {venueMatches.map((match) => (
            <Link to={`/matches/${match.id}`} key={match.id}>
              <span>{match.homeTeam.teamName}</span>
              <strong>{match.status === "Completed" ? match.scoreline : match.date}</strong>
              <span>{match.awayTeam.teamName}</span>
              <small>{match.kickoffTimeUtc} UTC</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
