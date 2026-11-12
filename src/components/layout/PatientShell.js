"use client";

import Link from "next/link";
import UserMenu, { SidebarUser } from "../navigation/UserMenu.js";

const navigation = [
  { href: "/dashboard", label: "🏠 Início" },
  { href: "/agendar", label: "🗓️ Agendar consulta" },
  { href: "/agendamentos", label: "📋 Meus agendamentos" },
  { href: "/perfil", label: "👤 Perfil" },
];

// A página informa a seleção e o título; consultas e formulários ficam nos módulos.
export default function PatientShell({ title, activePath, homeHref = "/dashboard", children }) {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaúde</strong>
        </div>
        <nav className="sidebar-menu" aria-label="Menu do paciente">
          {navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href === "/dashboard" ? homeHref : href}
              className={activePath === href ? "active" : undefined}
              aria-current={activePath === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <SidebarUser />
      </aside>
      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <UserMenu />
        </header>
        {children}
      </main>
    </div>
  );
}
