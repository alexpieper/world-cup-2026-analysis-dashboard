import { Database, FileSpreadsheet, RefreshCw } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { useWorldCupData } from "../lib/data";

export function DataNotesPage() {
  const { meta, analytics } = useWorldCupData();

  return (
    <main className="shell">
      <section className="page-heading">
        <span className="eyebrow">Data notes</span>
        <h1>Source coverage, refresh behavior, and caveats.</h1>
      </section>

      <section className="kpi-grid">
        <StatCard label="Source files" value={Object.keys(meta.sourceFiles).length} icon={FileSpreadsheet} />
        <StatCard label="Generated" value={new Date(meta.generatedAt).toLocaleDateString()} icon={RefreshCw} />
        <StatCard label="Completed" value={`${analytics.kpis.completedMatches}/${analytics.kpis.matches}`} icon={Database} />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading">
            <h2>CSV coverage</h2>
          </div>
          <div className="source-file-list">
            {Object.entries(meta.sourceFiles).map(([file, rows]) => (
              <div key={file}>
                <strong>{file}</strong>
                <span>{rows} rows</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>Refresh model</h2>
          </div>
          <div className="notes-list">
            {meta.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
            <p>
              Run <code>./app/dev.sh</code> after CSV updates. The generator rebuilds the frontend JSON before Vite starts.
            </p>
            <p>
              Docker users can run <code>./app/dev.sh --docker</code>; the container mounts the repository root read-only as the dataset source.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
