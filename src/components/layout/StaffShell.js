"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../ui/Icon.js";
import LogoutButton from "@/features/auth/components/LogoutButton";

function Brand() {
  return (
    <Link className="staff-brand" href="/">
      <span className="staff-brand-mark" aria-hidden="true"><span /><span /></span>
      <span className="staff-brand-copy">
        <strong>AgendaSaúde</strong>
        <small>Hospital Sapiens</small>
      </span>
    </Link>
  );
}

function initials(text) {
  return text.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

// Moldura dos painéis da equipe (administração, secretaria e médico).
// Cada página informa os itens do menu; os dados continuam vindo do servidor.
// navigation: [{ href, label, icon, current?, disabled?, note? }]
export default function StaffShell({ role, navigationLabel, navigation, breadcrumb, children }) {
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
    <div className={menuOpen ? "staff-shell menu-open" : "staff-shell"}>
      <aside id="staff-menu" className="staff-sidebar">
        <div className="staff-sidebar-top">
          <Brand />
          <button type="button" className="staff-menu-close" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav className="staff-nav" aria-label={navigationLabel}>
          {navigation.map((item) => item.disabled ? (
            <span key={item.label} className="staff-nav-item disabled" aria-disabled="true">
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.note && <small>{item.note}</small>}
            </span>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={item.current ? "staff-nav-item active" : "staff-nav-item"}
              aria-current={item.current ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="staff-profile">
          <span className="staff-avatar" aria-hidden="true">{initials(role)}</span>
          <div>
            <strong>{role}</strong>
            <small>Hospital Sapiens</small>
          </div>
          <LogoutButton className="staff-logout" label="Sair" iconOnly />
        </div>
      </aside>
      {menuOpen && <button type="button" className="staff-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <div className="staff-main">
        <header className="staff-topbar">
          <button
            type="button"
            className="staff-menu-toggle"
            aria-label="Abrir menu"
            aria-controls="staff-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="staff-breadcrumb">
            <span>{role}</span>
            <Icon name="chevron" size={14} />
            <strong>{breadcrumb}</strong>
          </div>
          <span className="staff-role">{role}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
