import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/administracao/page.module.css";
import agenda from "./agenda.module.css";

export const metadata = { title: "Minha agenda | AgendaSaúde" };
export const dynamic = "force-dynamic";

const statusLabels = { scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada" };

function selectedDay(value, today) {
  if (value === undefined) return today;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

function State({ title, detail }) {
  return (
    <main className={styles.statePage}>
      <div className={styles.stateCard}>
        <span className={styles.brand}>+ AgendaSaúde</span>
        <h1>{title}</h1>
        <p>{detail}</p>
        <Link href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}

export default async function DoctorPage({ searchParams }) {
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return <State title="Agenda médica indisponível" detail="A autenticação precisa estar configurada para acessar a agenda." />;
  }

  const { dia } = await searchParams;
  const day = selectedDay(dia, clinicDateTime(new Date()).date);
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const id = auth?.claims?.sub;
  if (authError || !id) {
    const destination = day && dia !== undefined ? `/medico?dia=${day}` : "/medico";
    redirect(`/login?${new URLSearchParams({ redirect: destination })}`);
  }

  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role,full_name").eq("id", id).maybeSingle();
  if (profileError) return <State title="Agenda indisponível" detail="Não foi possível verificar seu perfil. Tente novamente." />;
  if (profile?.role !== ROLES.DOCTOR) return <State title="Acesso não autorizado" detail="Esta área é reservada aos médicos da clínica." />;

  const { data: link, error: linkError } = await supabase.from("hospital_staff")
    .select("active").eq("profile_id", id).eq("hospital_id", 1).maybeSingle();
  if (linkError) return <State title="Agenda indisponível" detail="Não foi possível verificar seu vínculo. Tente novamente." />;
  if (!link?.active) return <State title="Acesso não autorizado" detail="Seu vínculo com o Hospital Sapiens não está ativo." />;

  const { data, error } = day
    ? await supabase.rpc("doctor_list_appointments", { p_day: day })
      .order("scheduled_at").order("id").limit(201)
    : { data: null, error: null };
  const rows = (data ?? []).slice(0, 200);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">+ AgendaSaúde</Link>
        <div className={styles.workspaceLabel}>ESPAÇO DE TRABALHO</div>
        <nav className={styles.navigation} aria-label="Navegação do médico">
          <Link className={styles.current} aria-current="page" href="/medico">Minha agenda</Link>
        </nav>
        <div className={styles.sidebarFooter}>Equipe médica · Hospital Sapiens</div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>AgendaSaúde <span>/</span> Médico <span>/</span> Agenda</div>
          <span className={styles.roleBadge}>Médico</span>
        </header>
        <div className={styles.content}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>EQUIPE MÉDICA · HOSPITAL SAPIENS</span>
              <h1>Minha agenda</h1>
              <p>Olá, {profile.full_name?.trim() || "profissional"}. Consulte os seus atendimentos por data.</p>
            </div>
            <span className={styles.phase}>Horário de São Paulo</span>
          </div>
          <section className={agenda.section} aria-labelledby="doctor-agenda-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="doctor-agenda-heading">Consultas do dia</h2>
                <p>Somente consultas vinculadas ao seu perfil.</p>
              </div>
            </div>
            <form key={day || "invalid"} action="/medico" method="get" className={styles.agendaFilter}>
              <label htmlFor="doctor-agenda-day">Data da agenda</label>
              <input id="doctor-agenda-day" type="date" name="dia" defaultValue={day || ""} required />
              <button type="submit">Consultar</button>
              <Link href="/medico">Hoje</Link>
            </form>
            {!day ? <p className={styles.feedback} role="alert">Escolha uma data válida.</p>
              : error ? <p className={styles.feedback} role="alert">Não foi possível carregar a agenda. Tente novamente.</p>
              : rows.length === 0 ? <p className={styles.agendaEmpty}>Você não tem consultas nesta data.</p>
              : <ul className={`${styles.agendaList} ${agenda.list}`}>
                {rows.map((row) => (
                  <li className={styles.agendaRow} key={row.id}>
                    <time className={styles.agendaTime} dateTime={row.scheduled_at}>{clinicDateTime(row.scheduled_at).time}</time>
                    <div className={styles.agendaDetails}>
                      <strong>{row.patient_name?.trim() || "Paciente sem nome"}</strong>
                      <span>{row.specialty}</span>
                    </div>
                    <span className={row.status === "scheduled" ? styles.active : styles.inactive}>{statusLabels[row.status]}</span>
                  </li>
                ))}
              </ul>}
            {(data?.length ?? 0) > 200 && <p>Exibindo as primeiras 200 consultas do dia.</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
