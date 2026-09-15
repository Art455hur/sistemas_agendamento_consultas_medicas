import Link from "next/link";
import UserMenu, { SidebarUser } from "../components/UserMenu";
import DashboardData from "../components/DashboardData";
export default function Home() {
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
          <div className="topbar-title">Início</div>
          <UserMenu />
        </header>

        <header className="dashboard-header">
          <div>
            <h1>Olá, seja bem-vindo! 👋</h1>
            <p>Encontre especialistas e agende sua próxima consulta.</p>
          </div>

          <Link href="/agendar">
            <button>+ Agendar consulta</button>
          </Link>
        </header>

        <DashboardData />

        

        <section className="dashboard-section">
          <div className="section-title">
            <h2>Especialidades</h2>
            <span>Ver todas</span>
          </div>

          <div className="specialties">
            <div className="specialty-card">
              <span>🩺</span>
              <strong>Clínica Geral</strong>
              <small>12 especialistas</small>
            </div>

            <div className="specialty-card">
              <span>❤️</span>
              <strong>Cardiologia</strong>
              <small>8 especialistas</small>
            </div>

            <div className="specialty-card">
              <span>🧴</span>
              <strong>Dermatologia</strong>
              <small>10 especialistas</small>
            </div>

            <div className="specialty-card">
              <span>🦴</span>
              <strong>Ortopedia</strong>
              <small>7 especialistas</small>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-title">
            <h2>Especialistas disponíveis</h2>
            <span>Ver todos</span>
          </div>

          <div className="doctors">
            <div className="doctor-card">
              <div className="doctor-avatar">JS</div>

              <div className="doctor-info">
                <strong>Dr. João Silva</strong>
                <p>Clínico Geral</p>
                <span className="doctor-rating">⭐ 4.9</span>
                <small className="doctor-availability">
                  Disponível hoje
                </small>
              </div>

              <Link href="/agendar" className="doctor-schedule">
                Agendar
              </Link>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">AS</div>

              <div className="doctor-info">
                <strong>Dra. Ana Souza</strong>
                <p>Cardiologista</p>
                <span className="doctor-rating">⭐ 4.8</span>
                <small className="doctor-availability">
                  Disponível amanhã
                </small>
              </div>

              <Link href="/agendar" className="doctor-schedule">
                Agendar
              </Link>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">CO</div>

              <div className="doctor-info">
                <strong>Dr. Carlos Oliveira</strong>
                <p>Dermatologista</p>
                <span className="doctor-rating">⭐ 4.9</span>
                <small className="doctor-availability">
                  Disponível hoje
                </small>
              </div>

              <Link href="/agendar" className="doctor-schedule">
                Agendar
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
