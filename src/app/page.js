"use client";

import Link from "next/link";
import { useState } from "react";
import UserMenu, {
  SidebarUser,
} from "../components/UserMenu";
import DashboardData from "../components/DashboardData";

export default function Home() {
  const [showAllSpecialties, setShowAllSpecialties] =
    useState(false);

  const [showAllDoctors, setShowAllDoctors] =
    useState(false);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaúde</strong>
        </div>

        <nav className="sidebar-menu">
          <Link href="/" className="active">
            🏠 Início
          </Link>

          <Link href="/agendar">
            🗓️ Agendar consulta
          </Link>

          <Link href="/agendamentos">
            📋 Meus agendamentos
          </Link>

          <Link href="/perfil">
            👤 Perfil
          </Link>
        </nav>

        <SidebarUser />
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">
            Início
          </div>

          <UserMenu />
        </header>

        <header className="dashboard-header">
          <div>
            <h1>Olá, seja bem-vindo! 👋</h1>

            <p>
              Encontre especialistas e agende sua próxima
              consulta.
            </p>
          </div>

          <Link href="/agendar">
            <button type="button">
              + Agendar consulta
            </button>
          </Link>
        </header>

        <DashboardData />

        <section className="dashboard-section">
          <div className="section-title">
            <h2>Especialidades</h2>

            <button
              type="button"
              className="view-all-link"
              onClick={() =>
                setShowAllSpecialties(
                  (currentValue) => !currentValue
                )
              }
            >
              {showAllSpecialties
                ? "Ver menos"
                : "Ver todas"}
            </button>
          </div>

          <div className="specialties">
            <Link
              href="/agendar?especialidade=Cl%C3%ADnica%20Geral"
              className="specialty-card"
            >
              <span>🩺</span>
              <strong>Clínica Geral</strong>
              <small>12 especialistas</small>
            </Link>

            <Link
              href="/agendar?especialidade=Cardiologia"
              className="specialty-card"
            >
              <span>❤️</span>
              <strong>Cardiologia</strong>
              <small>8 especialistas</small>
            </Link>

            <Link
              href="/agendar?especialidade=Dermatologia"
              className="specialty-card"
            >
              <span>🧴</span>
              <strong>Dermatologia</strong>
              <small>10 especialistas</small>
            </Link>

            <Link
              href="/agendar?especialidade=Ortopedia"
              className="specialty-card"
            >
              <span>🦴</span>
              <strong>Ortopedia</strong>
              <small>7 especialistas</small>
            </Link>

            {showAllSpecialties && (
              <>
                <Link
                  href="/agendar?especialidade=Pediatria"
                  className="specialty-card"
                >
                  <span>🧒</span>
                  <strong>Pediatria</strong>
                  <small>6 especialistas</small>
                </Link>

                <Link
                  href="/agendar?especialidade=Ginecologia"
                  className="specialty-card"
                >
                  <span>🌸</span>
                  <strong>Ginecologia</strong>
                  <small>5 especialistas</small>
                </Link>

                <Link
                  href="/agendar?especialidade=Neurologia"
                  className="specialty-card"
                >
                  <span>🧠</span>
                  <strong>Neurologia</strong>
                  <small>4 especialistas</small>
                </Link>

                <Link
                  href="/agendar?especialidade=Oftalmologia"
                  className="specialty-card"
                >
                  <span>👁️</span>
                  <strong>Oftalmologia</strong>
                  <small>7 especialistas</small>
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-title">
            <h2>Especialistas disponíveis</h2>

            <button
              type="button"
              className="view-all-link"
              onClick={() =>
                setShowAllDoctors(
                  (currentValue) => !currentValue
                )
              }
            >
              {showAllDoctors
                ? "Ver menos"
                : "Ver todos"}
            </button>
          </div>

          <div className="doctors">
            <div className="doctor-card">
              <div className="doctor-avatar">
                RA
              </div>

              <div className="doctor-info">
                <strong>Dr. Rafael Almeida</strong>
                <p>Clínica Geral</p>

                <span className="doctor-rating">
                  ⭐ 4.9
                </span>

                <small className="doctor-availability">
                  Disponível hoje
                </small>
              </div>

              <Link
                href="/agendar?especialidade=Cl%C3%ADnica%20Geral&profissional=Dr.%20Rafael%20Almeida"
                className="doctor-schedule"
              >
                Agendar
              </Link>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">
                MS
              </div>

              <div className="doctor-info">
                <strong>Dra. Mariana Silva</strong>
                <p>Cardiologia</p>

                <span className="doctor-rating">
                  ⭐ 4.8
                </span>

                <small className="doctor-availability">
                  Disponível amanhã
                </small>
              </div>

              <Link
                href="/agendar?especialidade=Cardiologia&profissional=Dra.%20Mariana%20Silva"
                className="doctor-schedule"
              >
                Agendar
              </Link>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">
                CR
              </div>

              <div className="doctor-info">
                <strong>Dra. Camila Rodrigues</strong>
                <p>Dermatologia</p>

                <span className="doctor-rating">
                  ⭐ 4.9
                </span>

                <small className="doctor-availability">
                  Disponível hoje
                </small>
              </div>

              <Link
                href="/agendar?especialidade=Dermatologia&profissional=Dra.%20Camila%20Rodrigues"
                className="doctor-schedule"
              >
                Agendar
              </Link>
            </div>

            {showAllDoctors && (
              <>
                <div className="doctor-card">
                  <div className="doctor-avatar">
                    LF
                  </div>

                  <div className="doctor-info">
                    <strong>
                      Dr. Lucas Ferreira
                    </strong>

                    <p>Ortopedia</p>

                    <span className="doctor-rating">
                      ⭐ 4.8
                    </span>

                    <small className="doctor-availability">
                      Disponível amanhã
                    </small>
                  </div>

                  <Link
                    href="/agendar?especialidade=Ortopedia&profissional=Dr.%20Lucas%20Ferreira"
                    className="doctor-schedule"
                  >
                    Agendar
                  </Link>
                </div>

                <div className="doctor-card">
                  <div className="doctor-avatar">
                    JC
                  </div>

                  <div className="doctor-info">
                    <strong>
                      Dra. Juliana Costa
                    </strong>

                    <p>Pediatria</p>

                    <span className="doctor-rating">
                      ⭐ 4.9
                    </span>

                    <small className="doctor-availability">
                      Disponível hoje
                    </small>
                  </div>

                  <Link
                    href="/agendar?especialidade=Pediatria&profissional=Dra.%20Juliana%20Costa"
                    className="doctor-schedule"
                  >
                    Agendar
                  </Link>
                </div>

                <div className="doctor-card">
                  <div className="doctor-avatar">
                    FL
                  </div>

                  <div className="doctor-info">
                    <strong>
                      Dra. Fernanda Lima
                    </strong>

                    <p>Ginecologia</p>

                    <span className="doctor-rating">
                      ⭐ 4.8
                    </span>

                    <small className="doctor-availability">
                      Disponível amanhã
                    </small>
                  </div>

                  <Link
                    href="/agendar?especialidade=Ginecologia&profissional=Dra.%20Fernanda%20Lima"
                    className="doctor-schedule"
                  >
                    Agendar
                  </Link>
                </div>

                <div className="doctor-card">
                  <div className="doctor-avatar">
                    PM
                  </div>

                  <div className="doctor-info">
                    <strong>
                      Dr. Paulo Mendes
                    </strong>

                    <p>Neurologia</p>

                    <span className="doctor-rating">
                      ⭐ 4.9
                    </span>

                    <small className="doctor-availability">
                      Disponível hoje
                    </small>
                  </div>

                  <Link
                    href="/agendar?especialidade=Neurologia&profissional=Dr.%20Paulo%20Mendes"
                    className="doctor-schedule"
                  >
                    Agendar
                  </Link>
                </div>

                <div className="doctor-card">
                  <div className="doctor-avatar">
                    BA
                  </div>

                  <div className="doctor-info">
                    <strong>
                      Dra. Beatriz Alves
                    </strong>

                    <p>Oftalmologia</p>

                    <span className="doctor-rating">
                      ⭐ 4.7
                    </span>

                    <small className="doctor-availability">
                      Disponível amanhã
                    </small>
                  </div>

                  <Link
                    href="/agendar?especialidade=Oftalmologia&profissional=Dra.%20Beatriz%20Alves"
                    className="doctor-schedule"
                  >
                    Agendar
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}