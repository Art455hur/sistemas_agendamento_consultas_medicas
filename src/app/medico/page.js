import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/administracao/page.module.css";
import StaffShell from "@/components/layout/StaffShell.js";
import Icon from "@/components/ui/Icon.js";
import agenda from "./agenda.module.css";
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

const longDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });

// "Hoje, 27 de novembro" ou "Sexta-feira, 27 de novembro" (dia da clínica, não do computador).
function longDayLabel(day, today) {
  const date = new Date(`${day}T12:00:00Z`);
  if (day === today) return `Hoje, ${dayMonth.format(date)}`;
  const text = longDate.format(date);
  return text[0].toUpperCase() + text.slice(1);
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

  const dayLabel = day ? longDayLabel(day, today) : "";
  const shortDate = day ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : "";
  const doctorName = profile.full_name?.trim() || "profissional";

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
              <span className={styles.eyebrow}>PAINEL DO MÉDICO</span>
              <h1>Minha agenda</h1>
              <p>Consultas de <strong>{doctorName}</strong> no Hospital Sapiens</p>
            </div>
            <span className={agenda.timezone}><Icon name="clock" size={16} /> Horário de São Paulo</span>
          </div>

          <section className={agenda.dateStrip} aria-label="Selecionar data">
            <div className={agenda.selectedDate}>
              <span className={agenda.iconBox}><Icon name="calendar" /></span>
              <span>
                <small>DATA SELECIONADA</small>
                {day ? <><strong><time dateTime={day}>{dayLabel}</time></strong><em>{shortDate}</em></>
                  : <strong>Data inválida</strong>}
              </span>
            </div>
            <div className={agenda.dateActions}>
              {previous && <Link className={agenda.iconAction} href={`/medico?dia=${previous}`} aria-label="Dia anterior">
                <Icon name="chevronLeft" />
              </Link>}
              <Link className="ui-button ui-button-secondary" href="/medico" aria-current={day === today ? "date" : undefined}>Hoje</Link>
              {next && <Link className={agenda.iconAction} href={`/medico?dia=${next}`} aria-label="Próximo dia">
                <Icon name="chevron" />
              </Link>}
              <form key={day || "invalid"} action="/medico" method="get" className={agenda.dateForm}>
                <label className={agenda.calendarInput}>
                  <Icon name="calendar" size={18} />
                  <span className={agenda.srOnly}>Escolher data</span>
                  <input type="date" name="dia" defaultValue={day || ""} required />
                </label>
                <button type="submit" className="ui-button ui-button-primary">Consultar</button>
              </form>
            </div>
          </section>

          {typeof resultado === "string" && Object.hasOwn(messages, resultado) &&
            <p className={resultado === "salvo" ? agenda.feedbackOk : agenda.feedbackError}
              role={resultado === "salvo" ? "status" : "alert"}>
              <Icon name={resultado === "salvo" ? "check" : "alert"} size={18} />
              {messages[resultado]}
            </p>}

          {!day ? <p className={agenda.feedbackError} role="alert"><Icon name="alert" size={18} /> Escolha uma data válida.</p>
            : error ? <p className={agenda.feedbackError} role="alert"><Icon name="alert" size={18} /> Não foi possível carregar a agenda. Tente novamente.</p>
            : <>
              <dl className={agenda.summary} aria-label="Resumo de consultas da data">
                {filters.map(([value, label]) => <div key={value} className={agenda.summaryItem} data-status={value}>
                  <dt>{label}</dt><dd>{counts[value]}</dd>
                </div>)}
              </dl>

              <section className={agenda.agendaSection} aria-labelledby="doctor-agenda-heading">
                {rows.length === 0 ? <>
                  <div className={agenda.sectionTitle}>
                    <div>
                      <h2 id="doctor-agenda-heading">Consultas do dia</h2>
                      <p>Somente consultas vinculadas ao seu perfil.</p>
                    </div>
                  </div>
                  <div className={agenda.emptyState}>
                    <span className={agenda.iconBox}><Icon name="calendar" /></span>
                    <h3>Nenhuma consulta nesta data</h3>
                    <p>Sua agenda está livre neste dia.</p>
                    {day !== today && <Link className="ui-button ui-button-secondary" href="/medico">Voltar para hoje</Link>}
                  </div>
                </> : <AgendaList key={`${day}:${resultado ?? ""}:${now}`} day={day} entries={rows.map((row) => ({
                  id: row.id, patient: row.patient, specialty: row.specialty, time: row.time, status: row.status,
                  scheduledAt: row.scheduled_at, isNext: upcoming?.id === row.id,
                }))} />}
                {(data?.length ?? 0) > 200 && <p className={agenda.limitNote}>Exibindo as primeiras 200 consultas do dia.</p>}
              </section>
            </>}
        </div>
      </main>
    </StaffShell>
  );
}
