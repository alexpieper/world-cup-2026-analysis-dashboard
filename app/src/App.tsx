import { Navigate, Route, Routes } from "react-router-dom";
import { DataGate } from "./components/DataGate";
import { Layout } from "./components/Layout";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DataNotesPage } from "./pages/DataNotesPage";
import { GroupsPage } from "./pages/GroupsPage";
import { MatchDetailPage } from "./pages/MatchDetailPage";
import { MatchesPage } from "./pages/MatchesPage";
import { SquadsPage } from "./pages/SquadsPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { VenuesPage } from "./pages/VenuesPage";

export function App() {
  return (
    <DataGate>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="matches" element={<MatchesPage />} />
          <Route path="matches/:matchId" element={<MatchDetailPage />} />
          <Route path="squads" element={<SquadsPage />} />
          <Route path="squads/:teamId" element={<TeamDetailPage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="data-notes" element={<DataNotesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataGate>
  );
}
