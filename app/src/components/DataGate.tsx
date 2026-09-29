import { AlertTriangle, Loader2 } from "lucide-react";
import { useDataState } from "../lib/data";

export function DataGate({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useDataState();

  if (loading) {
    return (
      <main className="shell page-state">
        <Loader2 className="spin" size={32} />
        <h1>Loading tournament data</h1>
        <p>Generating the control room from local CSV output.</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="shell page-state error-state">
        <AlertTriangle size={34} />
        <h1>Data failed to load</h1>
        <p>{error ?? "The generated world-cup.json file is missing."}</p>
      </main>
    );
  }

  return <>{children}</>;
}
