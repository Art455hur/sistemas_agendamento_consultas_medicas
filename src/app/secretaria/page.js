import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import AdminCreateAppointmentForm from "@/app/administracao/AdminCreateAppointmentForm";
import { cancelAppointment, rescheduleAppointment } from "./actions";
import AgendaResults from "./AgendaResults";
import styles from "@/app/administracao/page.module.css";
import desk from "./secretaria.module.css";

export const metadata = { title: "Secretaria | AgendaSaúde" };
export const dynamic = "force-dynamic";

const messages = {
  criada: "Consulta agendada com sucesso.", remarcada: "Consulta remarcada com sucesso.",
  cancelada: "Consulta cancelada; o histórico foi preservado.",
  conflito: "O paciente ou o médico já tem consulta nesse horário.",
  invalido: "Escolha uma data e um horário futuro disponível.",
  "nao-encontrada": "A consulta não está mais disponível para alteração.",
  negado: "Ação negada: o vínculo ativo de secretaria é obrigatório.",
  erro: "Não foi possível concluir a operação. Tente novamente.",
  indisponivel: "A autenticação ainda não está ativada.",
};
const statusLabels = { scheduled: "Agendadas", completed: "Concluídas", cancelled: "Canceladas" };

function selectedDay(value) {
  const today = clinicDateTime(new Date()).date;
  if (value === undefined) return today;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

function State({ title, detail }) {
  return <main className={styles.statePage}><div className={styles.stateCard}>
    <span className={styles.brand}>+ AgendaSaúde</span><h1>{title}</h1><p>{detail}</p>
    <Link href="/">Voltar ao início</Link>
  </div></main>;
}

export default async function SecretariaPage({ searchParams }) {
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return <State title="Painel da secretaria indisponível" detail="Configure a autenticação Supabase para acessar a agenda." />;
  }
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const id = authData?.claims?.sub;
  if (authError || !id) redirect("/login?redirect=%2Fsecretaria");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role,full_name").eq("id", id).single();
  if (profileError || profile?.role !== ROLES.RECEPTIONIST) {
    return <State title="Acesso não autorizado" detail="Esta área é reservada à secretaria da clínica." />;
  }
  const { data: link, error: linkError } = await supabase.from("hospital_staff")
    .select("active").eq("profile_id", id).eq("hospital_id", 1).single();
  if (linkError || !link?.active) {
    return <State title="Acesso não autorizado" detail="Seu vínculo com o Hospital Sapiens não está ativo." />;
  }
  const { dia, resultado, status, tela } = await searchParams;
  const day = selectedDay(dia);
  const isBooking = tela === "novo";
  const dayQuery = day ? new URLSearchParams({ dia: day }) : new URLSearchParams();
  const agendaHref = day ? `/secretaria?${dayQuery}` : "/secretaria";
  const bookingHref = `/secretaria?${new URLSearchParams({ ...Object.fromEntries(dayQuery), tela: "novo" })}`;
  const screenTitle = isBooking ? "Novo agendamento" : "Agenda da clínica";
  const today = clinicDateTime(new Date()).date;
  const max = new Date(`${today}T12:00:00Z`);
  max.setUTCDate(max.getUTCDate() + 365);
  const [catalogResult, agendaResult] = await Promise.all([
    isBooking ? supabase.rpc("receptionist_catalog") : { data: null, error: null },
    !isBooking && day ? supabase.rpc("receptionist_list_appointments", { p_day: day }) : { data: null, error: null },
  ]);
  const patients = (catalogResult.data || []).filter((row) => row.kind === "patient");
  const doctors = (catalogResult.data || []).filter((row) => row.kind === "doctor");
  const appointments = agendaResult.data || [];
  const now = Date.now();
  const statusFilter = typeof status === "string" && Object.hasOwn(statusLabels, status) ? status : "";
  const rows = appointments.map((appointment) => ({
    ...appointment,
    displayStatus: appointment.status === "cancelled" ? "cancelled"
      : appointment.status === "completed" || Date.parse(appointment.scheduled_at) <= now ? "completed" : "scheduled",
  }));
  const counts = { scheduled: 0, completed: 0, cancelled: 0 };
  for (const row of rows) counts[row.displayStatus]++;
  const filtered = rows.filter((row) => !statusFilter || row.displayStatus === statusFilter);

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/">+ AgendaSaúde</Link>
      <div className={styles.workspaceLabel}>ESPAÇO DE TRABALHO</div>
      <nav className={styles.navigation} aria-label="Navegação da secretaria">
        <Link className={isBooking ? styles.teamLink : styles.current} aria-current={!isBooking ? "page" : undefined} href={agendaHref}>Agenda da clínica</Link>
        <Link className={isBooking ? styles.current : styles.teamLink} aria-current={isBooking ? "page" : undefined} href={bookingHref}>Novo agendamento</Link>
      </nav>
      <div className={styles.sidebarFooter}>Secretaria · Hospital Sapiens</div>
    </aside>
    <main className={styles.main}>
      <header className={styles.topbar}>
        <div className={styles.breadcrumb}>AgendaSaúde <span>/</span> Secretaria <span>/</span> {screenTitle}</div>
        <span className={styles.roleBadge}>Secretaria</span>
      </header>
      <div className={`${styles.content} ${desk.content}`}>
        <div className={styles.heading}><div>
          <span className={styles.eyebrow}>ATENDIMENTO · HOSPITAL SAPIENS</span>
          <h1>{screenTitle}</h1>
          <p>{isBooking ? "Escolha um paciente, um profissional e um horário para reservar a consulta."
            : `Olá, ${profile.full_name?.trim() || "secretaria"}. Acompanhe os atendimentos do dia.`}</p>
        </div><span className={styles.phase}>Horário de São Paulo</span></div>
        <div className={desk.workspace}>
        {!isBooking ? <section id="agenda" className={desk.agenda} aria-labelledby="agenda-heading">
          <div className={styles.sectionHeading}><div>
            <h2 id="agenda-heading">Atendimentos do dia</h2>
            <p>Consulte a agenda e gerencie as consultas futuras.</p>
          </div><Link className={desk.cta} href={bookingHref}>Novo agendamento</Link></div>
          {typeof resultado === "string" && Object.hasOwn(messages, resultado) &&
            <p role={["criada", "remarcada", "cancelada"].includes(resultado) ? "status" : "alert"} className={styles.feedback}>{messages[resultado]}</p>}
          {day && !agendaResult.error && <dl className={desk.metrics}>
            {Object.entries(statusLabels).map(([value, label]) =>
              <div key={value}><dt>{label}</dt><dd>{counts[value]}</dd></div>)}
          </dl>}
          <form key={JSON.stringify([day, statusFilter])} action="/secretaria" method="get" className={desk.filters}>
            <label>Data<input type="date" name="dia" defaultValue={day || ""} required /></label>
            <label>Situação<select name="status" defaultValue={statusFilter}>
              <option value="">Todas</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            <div className={desk.filterActions}><button type="submit">Consultar</button><Link href="/secretaria">Hoje</Link></div>
          </form>
          {!day ? <p role="alert" className={styles.feedback}>Escolha uma data válida.</p>
            : agendaResult.error ? <p role="alert" className={styles.feedback}>Não foi possível carregar a agenda. Confira a migração da secretaria.</p>
            : appointments.length === 0 ? <p className={styles.agendaEmpty}>Nenhuma consulta encontrada neste dia.</p>
            : filtered.length === 0 ? <p className={styles.agendaEmpty}>Nenhuma consulta corresponde aos filtros.</p>
            : <AgendaResults key={JSON.stringify([day, statusFilter, resultado])} entries={filtered.map((appointment) => {
              const when = clinicDateTime(appointment.scheduled_at);
              const status = { scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada" }[appointment.displayStatus];
              const canManage = appointment.displayStatus === "scheduled";
              return {
                keywords: [appointment.patient_name, appointment.doctor_name, appointment.specialty].filter(Boolean).join(" "),
                item: <article key={appointment.id} className={styles.agendaRow}>
                <time dateTime={appointment.scheduled_at} className={styles.agendaTime}>{when.time}</time>
                <div className={styles.agendaDetails}>
                  <strong>{appointment.patient_name?.trim() || "Paciente sem nome"}</strong>
                  <span>{appointment.doctor_name?.trim() || "Médico sem nome"} · {appointment.specialty}</span>
                </div>
                <span className={status === "Agendada" ? styles.active : styles.inactive}>{status}</span>
                {canManage && <div className={styles.appointmentActions}>
                  <form action={rescheduleAppointment}>
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <label>Nova data<input type="date" name="day" defaultValue={when.date} min={today} required /></label>
                    <label>Novo horário<input type="time" name="time" min="08:00" max="17:30" step="1800" defaultValue={when.time} required /></label>
                    <button type="submit">Remarcar</button>
                  </form>
                  <form action={cancelAppointment}>
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <input type="hidden" name="day" value={when.date} />
                    <button type="submit" className={styles.deactivate}>Cancelar consulta</button>
                  </form>
                </div>}
                </article>,
              };
            })} />}
          {appointments.length === 200 && <p className={desk.muted}>Exibindo as primeiras 200 consultas do dia. A busca e os contadores consideram essa lista.</p>}
        </section> : <section id="novo-agendamento" className={`${styles.createAppointmentCard} ${desk.booking}`} aria-labelledby="booking-heading">
          <h2 id="booking-heading">Dados da consulta</h2>
          <p>A consulta só é reservada depois da confirmação do sistema.</p>
          {catalogResult.error ? <p role="alert" className={styles.feedback}>Não foi possível carregar pacientes e médicos. Atualize a página.</p>
            : patients.length === 0 || doctors.length === 0 ? <p>É necessário ter paciente e médico ativos para agendar.</p>
            : <AdminCreateAppointmentForm key={day || today} receptionist patients={patients} doctors={doctors} initialDay={day || today} minDay={today} maxDay={max.toISOString().slice(0,10)} />}
        </section>}
        </div>
      </div>
    </main>
  </div>;
}
