"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu, { SidebarUser } from "../navigation/UserMenu.js";
import Icon from "../ui/Icon.js";

const navigation = [
  { href: "/dashboard", label: "Início", icon: "home" },
  { href: "/agendar", label: "Agendar consulta", icon: "calendar" },
  { href: "/agendamentos", label: "Meus agendamentos", icon: "list" },
  { href: "/perfil", label: "Perfil", icon: "user" },
];

function Brand() {
  return (
    <div className="patient-brand">
      <span className="patient-brand-mark" aria-hidden="true"><span /><span /></span>
      <span className="patient-brand-copy">
        <strong>AgendaSaúde</strong>
        <small>Hospital Sapiens</small>
      </span>
    </div>
  );
}

// A página informa a seleção e o título; consultas e formulários ficam nos módulos.
// No celular, o menu lateral vira uma aba aberta pelo botão de menu da barra superior.
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
    <div className={menuOpen ? "dashboard patient-theme menu-open" : "dashboard patient-theme"}>
      <aside id="patient-menu" className="sidebar">
        <div className="patient-sidebar-head">
          <Brand />
          <button
            type="button"
            className="sidebar-close"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <nav className="sidebar-menu" aria-label="Menu do paciente">
          {navigation.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href === "/dashboard" ? homeHref : href}
              className={activePath === href ? "active" : undefined}
              aria-current={activePath === href ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={icon} />
              <span>{label}</span>
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
              <Icon name="menu" />
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
