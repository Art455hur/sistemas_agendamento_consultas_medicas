import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { appointmentStatusLabels, clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/administracao/page.module.css";
import StaffShell from "@/components/layout/StaffShell.js";
import agenda from "./agenda.module.css";
import { recordAppointmentOutcome } from "./actions";
import { adjacentDay, selectedDay } from "./day";
import { filters, summarizeAgenda } from "./agenda-view";
import AgendaList from "./AgendaList";

export const metadata = { title: "Minha agenda | AgendaSaúde" };
export const dynamic = "force-dynamic";

const messages = {
  salvo: "Resultado registrado.",
  indisponivel: "Só é possível registrar consultas próprias, no horário marcado ou depois, ainda sem resultado.",
  negado: "O registro exige um vínculo médico ativo.",
  invalido: "Selecione um resultado válido para a consulta.",
  erro: "Não foi possível registrar o resultado. Atualize a agenda antes de tentar novamente.",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" });

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

  const { dia, resultado } = await searchParams;
  const now = Date.now();
  const today = clinicDateTime(now).date;
  const day = selectedDay(dia, today);
  const previous = adjacentDay(day, -1);
  const next = adjacentDay(day, 1);
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
  const { rows, counts, upcoming } = summarizeAgenda((data ?? []).slice(0, 200), now);

  return (
    <StaffShell
      role="Médico"
      navigationLabel="Navegação do médico"
      breadcrumb="Minha agenda"
      navigation={[{ href: "/medico", label: "Minha agenda", icon: "calendar", current: true }]}
    >
      <main className={styles.main}>
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
            <div className={agenda.dateBar}>
              <div>
                <p className={agenda.caption}>DATA SELECIONADA</p>
                {day && <time className={agenda.selectedDate} dateTime={day}>{dateFormatter.format(new Date(`${day}T12:00:00Z`))}</time>}
                <nav className={agenda.days} aria-label="Navegar por dia">
                  {previous && <Link href={`/medico?dia=${previous}`}>Dia anterior</Link>}
                  <Link href="/medico" aria-current={day === today ? "date" : undefined}>Hoje</Link>
                  {next && <Link href={`/medico?dia=${next}`}>Próximo dia</Link>}
                </nav>
              </div>
              <form key={day || "invalid"} action="/medico" method="get" className={agenda.dateForm}>
                <label htmlFor="doctor-agenda-day">Escolher data</label>
                <input id="doctor-agenda-day" type="date" name="dia" defaultValue={day || ""} required />
                <button type="submit">Consultar</button>
              </form>
            </div>
            {typeof resultado === "string" && Object.hasOwn(messages, resultado) &&
              <p className={styles.feedback} role={resultado === "salvo" ? "status" : "alert"}>{messages[resultado]}</p>}
            {!day ? <p className={styles.feedback} role="alert">Escolha uma data válida.</p>
              : error ? <p className={styles.feedback} role="alert">Não foi possível carregar a agenda. Tente novamente.</p>
              : <>
                <dl className={agenda.metrics} aria-label="Resumo de consultas da data">
                  {filters.map(([value, label]) => <div key={value} data-status={value}>
                    <dt>{label}</dt><dd>{counts[value]}</dd>
                  </div>)}
                </dl>
                {upcoming && <section className={agenda.highlight} aria-label="Próximo atendimento da data">
                  <div>
                    <p className={agenda.caption}>PRÓXIMO ATENDIMENTO DA DATA</p>
                    <strong>{upcoming.patient}</strong>
                    {upcoming.specialty && <span>{upcoming.specialty}</span>}
                  </div>
                  <time dateTime={upcoming.scheduled_at}>{upcoming.time}</time>
                </section>}
                {rows.length === 0 ? <div className={agenda.empty}>
                  <strong>Você não tem consultas nesta data</strong>
                  <p>Escolha outra data para consultar sua agenda.</p>
                </div> : <AgendaList key={day} entries={rows.map((row) => ({
                  id: row.id, patient: row.patient, specialty: row.specialty, time: row.time, status: row.status,
                  item: <>
                    <time className={agenda.rowTime} dateTime={row.scheduled_at}>{row.time}</time>
                    <div className={styles.agendaDetails}>
                      <strong>{row.patient}</strong>
                      <span>{row.specialty}</span>
                    </div>
                    <span className={agenda.status} data-status={row.status}>{appointmentStatusLabels[row.status]}</span>
                    {row.status === "completed" && (
                      <div className={agenda.outcome}>
                        <Link className={agenda.secondary} href={`/medico/atendimento/${row.id}`} prefetch={false}
                          aria-label={`Abrir atendimento: ${row.patient}, ${row.time}`}>Abrir atendimento</Link>
                      </div>
                    )}
                    {row.status === "pending" && (
                      <form action={recordAppointmentOutcome} className={agenda.outcome} aria-label={`Registrar resultado: ${row.patient}, ${row.time}`}>
                        <input type="hidden" name="appointmentId" value={row.id} />
                        <input type="hidden" name="day" value={day} />
                        <label htmlFor={`outcome-${row.id}`}>Resultado do atendimento</label>
                        <select id={`outcome-${row.id}`} name="outcome" defaultValue="" required>
                          <option value="" disabled>Selecione o resultado</option>
                          <option value="completed">Atendida</option>
                          <option value="no_show">Paciente faltou</option>
                        </select>
                        <button type="submit">Registrar resultado</button>
                      </form>
                    )}
                  </>,
                }))} />}
              </>}
            {(data?.length ?? 0) > 200 && <p>Exibindo as primeiras 200 consultas do dia.</p>}
          </section>
        </div>
      </main>
    </StaffShell>
  );
}
