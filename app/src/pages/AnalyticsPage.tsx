import { BarChart3, Goal, RectangleHorizontal, TrendingUp } from "lucide-react";
import { ScatterPlot, SortableBarList } from "../components/Charts";
import { StatCard } from "../components/StatCard";
import { useWorldCupData } from "../lib/data";
import { formatCompactCurrency } from "../lib/format";

export function AnalyticsPage() {
  const { analytics } = useWorldCupData();
  const regression = analytics.regressions.squadValueToPoints;

  return (
    <main className="shell">
      <section className="page-heading">
        <span className="eyebrow">EDA lab</span>
        <h1>Signals hiding behind standings, squads, and match events.</h1>
      </section>

      <section className="kpi-grid">
        <StatCard label="Goals per match" value={analytics.kpis.avgGoals} icon={Goal} tone="green" />
        <StatCard label="Squad value" value={formatCompactCurrency(analytics.kpis.totalSquadValueEur)} icon={TrendingUp} />
        <StatCard label="Event rows" value={analytics.eventTypeCounts.reduce((sum, item) => sum + item.count, 0)} icon={BarChart3} />
        <StatCard label="Cards tracked" value={analytics.discipline.reduce((sum, item) => sum + item.cards, 0)} icon={RectangleHorizontal} tone="red" />
      </section>

      <section className="two-column wide-left">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Regression</span>
              <h2>Squad value vs points</h2>
            </div>
            <span>R² {regression.r2}</span>
          </div>
          <ScatterPlot
            points={regression.points}
            slope={regression.slope}
            intercept={regression.intercept}
            xLabel="Squad value (€M)"
            yLabel="Points"
          />
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Finishing</span>
              <h2>xG overperformance</h2>
            </div>
          </div>
          <SortableBarList
            items={analytics.xgOverperformers.slice(0, 8)}
            getLabel={(item) => item.teamName}
            getDetail={(item) => `${item.goalsFor} goals from ${item.xgFor} xG`}
            options={[
              { label: "Delta", getValue: (item) => item.delta, valueSuffix: " Δ" },
              { label: "Goals", getValue: (item) => item.goalsFor },
              { label: "xG", getValue: (item) => item.xgFor }
            ]}
          />
        </article>
      </section>

      <section className="analytics-grid">
        <article className="panel">
          <div className="section-heading">
            <h2>xG underperformance</h2>
          </div>
          <SortableBarList
            items={analytics.xgUnderperformers.slice(0, 8)}
            getLabel={(item) => item.teamName}
            getDetail={(item) => `${item.goalsFor} goals from ${item.xgFor} xG · ${item.delta} Δ`}
            options={[
              { label: "Missed xG", getValue: (item) => Math.abs(item.delta), valueSuffix: " Δ" },
              { label: "xG", getValue: (item) => item.xgFor },
              { label: "Goals", getValue: (item) => item.goalsFor }
            ]}
          />
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Tournament scorers</h2>
          </div>
          <SortableBarList
            items={analytics.topTournamentScorers.slice(0, 8)}
            getLabel={(item) => item.playerName}
            getDetail={(item) => item.teamName}
            options={[
              { label: "Goals", getValue: (item) => item.goals }
            ]}
          />
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Tournament assists</h2>
          </div>
          <SortableBarList
            items={analytics.topTournamentAssists.slice(0, 8)}
            getLabel={(item) => item.playerName}
            getDetail={(item) => item.teamName}
            options={[
              { label: "Assists", getValue: (item) => item.assists }
            ]}
          />
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Discipline board</h2>
          </div>
          <SortableBarList
            items={analytics.discipline.slice(0, 8)}
            getLabel={(item) => item.teamName}
            getDetail={(item) => `${item.yellowCards} yellow · ${item.redCards} red`}
            options={[
              { label: "Total cards", getValue: (item) => item.cards },
              { label: "Red cards", getValue: (item) => item.redCards },
              { label: "Yellow cards", getValue: (item) => item.yellowCards }
            ]}
          />
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Venue goals</h2>
          </div>
          <SortableBarList
            items={analytics.venueTrends.slice(0, 8)}
            getLabel={(item) => item.city}
            getDetail={(item) => `${item.completedCount}/${item.matchCount} completed`}
            options={[
              { label: "Avg goals", getValue: (item) => item.avgGoals },
              { label: "Avg xG", getValue: (item) => item.avgXg },
              { label: "Matches", getValue: (item) => item.matchCount }
            ]}
          />
        </article>
      </section>
    </main>
  );
}
