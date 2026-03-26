import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "Seaports" },
  { path: "/sync", label: "Sync" },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <h1 className="header-brand">
            <span className="header-icon">&#9875;</span>
            Tilla Seaports
          </h1>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={`nav-link ${location.pathname === item.path ? "nav-link--active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
