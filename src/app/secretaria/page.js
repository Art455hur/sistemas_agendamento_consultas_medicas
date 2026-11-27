import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { appointmentDisplayStatus, clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import AgendaResults from "./AgendaResults";
import BookingForm, { BookingHeading } from "./BookingForm";
import styles from "@/app/administracao/page.module.css";
import StaffShell from "@/components/layout/StaffShell.js";
import Icon from "@/components/ui/Icon.js";
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
const statusLabels = {
  scheduled: "Agendadas", pending: "Aguardando registro",
  completed: "Atendidas", no_show: "Faltas", cancelled: "Canceladas",
};

const longDayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const longDay = (day) => longDayFormat.format(new Date(`${day}T12:00:00Z`));

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
  const { dia, resultado, tela } = await searchParams;
  const day = selectedDay(dia);
  const isBooking = tela === "novo";
  const dayQuery = day ? new URLSearchParams({ dia: day }) : new URLSearchParams();
  const agendaHref = day ? `/secretaria?${dayQuery}` : "/secretaria";
  const bookingHref = `/secretaria?${new URLSearchParams({ ...Object.fromEntries(dayQuery), tela: "novo" })}`;
  const screenTitle = isBooking ? "Novo agendamento" : "Agenda da clínica";
  const today = clinicDateTime(new Date()).date;
  const max = new Date(`${today}T12:00:00Z`);
  max.setUTCDate(max.getUTCDate() + 365);
  const maxDay = max.toISOString().slice(0, 10);
  const [catalogResult, agendaResult] = await Promise.all([
    isBooking ? supabase.rpc("receptionist_catalog") : { data: null, error: null },
    !isBooking && day ? supabase.rpc("receptionist_list_appointments", { p_day: day }) : { data: null, error: null },
  ]);
  const patients = (catalogResult.data || []).filter((row) => row.kind === "patient")
    .map((row) => ({ id: row.id, name: row.name?.trim() || "Paciente sem nome" }));
  const doctors = (catalogResult.data || []).filter((row) => row.kind === "doctor")
    .map((row) => ({ id: row.id, name: row.name?.trim() || "Médico sem nome" }));
  const appointments = agendaResult.data || [];
  const now = Date.now();
  const rows = appointments.map((appointment) => {
    const when = clinicDateTime(appointment.scheduled_at);
    return {
      id: appointment.id,
      scheduledAt: appointment.scheduled_at,
      date: when.date,
      time: when.time,
      dateLabel: when.date.split("-").reverse().join("/"),
      patient: appointment.patient_name?.trim() || "Paciente sem nome",
      doctor: appointment.doctor_name?.trim() || "Médico sem nome",
      specialty: appointment.specialty || "",
      status: appointmentDisplayStatus(appointment, now),
    };
  });
  const counts = { scheduled: 0, pending: 0, completed: 0, no_show: 0, cancelled: 0 };
  for (const row of rows) counts[row.status]++;
  const feedback = typeof resultado === "string" && Object.hasOwn(messages, resultado) ? resultado : null;
  const feedbackOk = ["criada", "remarcada", "cancelada"].includes(feedback);

  const dateForm = (
    <form key={day || "invalid"} action="/secretaria" method="get" className={desk.dateForm}>
      <label className={desk.field}>
        <span>Data da agenda</span>
        <input type="date" name="dia" defaultValue={day || ""} required />
      </label>
      <Link className={`ui-button ui-button-secondary ${desk.todayButton}`} href="/secretaria"
        aria-current={day === today ? "date" : undefined}>Hoje</Link>
      <button type="submit" className={`ui-button ui-button-primary ${desk.consultButton}`}>Consultar</button>
    </form>
  );

  return <StaffShell
    role="Secretaria"
    navigationLabel="Navegação da secretaria"
    breadcrumb={screenTitle}
    navigation={[
      { href: agendaHref, label: "Agenda da clínica", icon: "calendar", current: !isBooking },
      { href: bookingHref, label: "Novo agendamento", icon: "plus", current: isBooking },
    ]}
  >
    <main className={styles.main}>
      <div className={`${styles.content} ${desk.content}`}>
        {isBooking ? <>
          {catalogResult.error ? <>
            <BookingHeading />
            <p role="alert" className={desk.feedbackError}><Icon name="alert" size={18} /> Não foi possível carregar pacientes e médicos. Atualize a página.</p>
          </> : patients.length === 0 || doctors.length === 0 ? <>
            <BookingHeading />
            <p className={desk.feedbackError}><Icon name="alert" size={18} /> É necessário ter paciente e médico ativos para agendar.</p>
          </> : <BookingForm key={day || today} patients={patients} doctors={doctors}
            initialDay={day && day >= today && day <= maxDay ? day : today} minDay={today} maxDay={maxDay} />}
        </> : <>
          <div className={desk.titleRow}>
            <div>
              <span className={styles.eyebrow}>VISÃO DA SECRETARIA</span>
              <h1>Agenda da clínica</h1>
              <p>{day ? <>Consultas de <time dateTime={day}>{longDay(day)}</time></> : "Escolha uma data para consultar a agenda."}</p>
            </div>
            <Link className={`ui-button ui-button-primary ${desk.desktopAction}`} href={bookingHref}>
              <Icon name="plus" size={18} /> Novo agendamento
            </Link>
          </div>

          {feedback && <p role={feedbackOk ? "status" : "alert"} className={feedbackOk ? desk.feedbackOk : desk.feedbackError}>
            <Icon name={feedbackOk ? "check" : "alert"} size={18} /> {messages[feedback]}
          </p>}

          {day && !agendaResult.error && <dl className={desk.stats} aria-label="Resumo do dia">
            {Object.entries(statusLabels).map(([value, label]) =>
              <div key={value} className={desk.stat} data-status={value}><dt>{label}</dt><dd>{counts[value]}</dd></div>)}
          </dl>}

          <section id="agenda" className={desk.agenda} aria-labelledby="agenda-heading">
            {!day ? <>
              <div className={desk.filtersCard}>{dateForm}</div>
              <p role="alert" className={desk.feedbackError}><Icon name="alert" size={18} /> Escolha uma data válida.</p>
            </> : agendaResult.error ? <>
              <div className={desk.filtersCard}>{dateForm}</div>
              <p role="alert" className={desk.feedbackError}><Icon name="alert" size={18} /> Não foi possível carregar a agenda. Tente novamente.</p>
            </> : <AgendaResults key={`${day}:${feedback ?? ""}:${now}`} dateForm={dateForm} entries={rows}
              bookingHref={bookingHref} today={today} maxDay={maxDay} isToday={day === today} />}
            {appointments.length === 200 && <p className={desk.muted}>Exibindo as primeiras 200 consultas do dia. A busca e os contadores consideram essa lista.</p>}
          </section>
        </>}
      </div>
    </main>
  </StaffShell>;
}
