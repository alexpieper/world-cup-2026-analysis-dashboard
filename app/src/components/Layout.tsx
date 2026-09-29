import {
  Activity,
  BarChart3,
  CalendarDays,
  Database,
  Globe2,
  Home,
  MapPin,
  Shield
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useWorldCupData } from "../lib/data";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/groups", label: "Groups", icon: Shield },
  { to: "/matches", label: "Matches", icon: CalendarDays },
  { to: "/squads", label: "Squads", icon: Activity },
  { to: "/venues", label: "Venues", icon: MapPin },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/data-notes", label: "Data", icon: Database }
];

export function Layout() {
  const { analytics, meta } = useWorldCupData();

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="World Cup 2026 Analytics home">
          <span className="brand-mark">
            <Globe2 size={20} />
          </span>
          <span>
            <strong>WC26 Control</strong>
            <small>{analytics.kpis.completedMatches} matches live in data</small>
          </span>
        </NavLink>

        <nav className="nav-links" aria-label="Primary navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />

      <footer className="footer">
        <span>Static analytics from local repository CSVs.</span>
        <span>Generated {new Date(meta.generatedAt).toLocaleString()}</span>
      </footer>
    </div>
  );
}
