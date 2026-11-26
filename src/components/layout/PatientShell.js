"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu, { SidebarUser } from "../navigation/UserMenu.js";

const navigation = [
  { href: "/dashboard", label: "🏠 Início" },
  { href: "/agendar", label: "🗓️ Agendar consulta" },
  { href: "/agendamentos", label: "📋 Meus agendamentos" },
  { href: "/perfil", label: "👤 Perfil" },
];

// A página informa a seleção e o título; consultas e formulários ficam nos módulos.
// No celular, o menu lateral vira uma aba aberta pelo botão ☰ da barra superior.
export default function PatientShell({ title, activePath, homeHref = "/dashboard", children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <div className={menuOpen ? "dashboard menu-open" : "dashboard"}>
      <aside id="patient-menu" className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaúde</strong>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="sidebar-menu" aria-label="Menu do paciente">
          {navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href === "/dashboard" ? homeHref : href}
              className={activePath === href ? "active" : undefined}
              aria-current={activePath === href ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <SidebarUser />
      </aside>
      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-start">
            <button
              type="button"
              className="menu-toggle"
              aria-label="Abrir menu"
              aria-controls="patient-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="topbar-title">{title}</div>
          </div>
          <UserMenu />
        </header>
        {children}
      </main>
    </div>
  );
}
