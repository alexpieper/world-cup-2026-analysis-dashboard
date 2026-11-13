import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { WorldCupData } from "../types/data";

interface DataState {
  data: WorldCupData | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataState | null>(null);

export function WorldCupDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dataset")
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load data (${response.status})`);
        return response.json() as Promise<WorldCupData>;
      })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Unable to load data"
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useWorldCupData(): WorldCupData {
  const context = useContext(DataContext);
  if (!context) throw new Error("useWorldCupData must be used inside WorldCupDataProvider");
  if (context.error) throw new Error(context.error);
  if (!context.data) throw new Error("World Cup data is still loading");
  return context.data;
}

export function useDataState(): DataState {
  const context = useContext(DataContext);
  if (!context) throw new Error("useDataState must be used inside WorldCupDataProvider");
  return context;
}
