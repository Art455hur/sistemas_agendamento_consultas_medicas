import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { appointmentDisplayStatus, appointmentStatusLabels, clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import { AppointmentActions, NewAppointmentButton } from "@/app/administracao/AdminAgendaDialogs";
import StaffManager from "@/app/administracao/StaffManager";
import SpecialtyManager from "@/app/administracao/SpecialtyManager";
import styles from "@/app/administracao/page.module.css";
import StaffShell from "@/components/layout/StaffShell.js";
import Icon from "@/components/ui/Icon.js";

export const metadata = {
  title: "Administração | AgendaSaúde",
};

export const dynamic = "force-dynamic";

const feedback = {
  atribuido: "Dados do funcionário salvos e vínculo ativado no Hospital Sapiens.",
  desativado: "Vínculo desativado. A conta permanece no Supabase Auth.",
  reativado: "Funcionário reativado com sucesso.",
  "dados-incompletos": "Preencha o nome e, para médicos, selecione uma especialidade ativa antes de reativar.",
  "vinculo-nao-encontrado": "O vínculo deste funcionário não foi encontrado. Atualize a página.",
  "nao-encontrado": "Conta não encontrada. Crie o usuário em Auth antes de vinculá-lo.",
  consultas: "Esta conta tem consultas vinculadas e não pode trocar de função.",
  negado: "Ação negada: somente um administrador ativo pode gerenciar estes dados.",
  invalido: "Confira o e-mail, o nome e a função. Médicos também precisam de especialidade.",
  erro: "Não foi possível concluir a operação. Confira o banco e tente novamente.",
  indisponivel: "A autenticação ainda não está ativada.",
  "especialidade-criada": "Especialidade cadastrada com sucesso.",
  "especialidade-atualizada": "Especialidade atualizada. Médicos vinculados também receberam o novo nome.",
  "especialidade-desativada": "Especialidade desativada. Ela não será usada em novos cadastros ou agendamentos.",
  "especialidade-reativada": "Especialidade reativada com sucesso.",
  "especialidade-duplicada": "Já existe uma especialidade com esse nome.",
  "especialidade-nao-encontrada": "Especialidade não encontrada. Atualize a página.",
  "especialidade-invalida": "Selecione ou informe uma especialidade ativa e válida.",
  "consulta-atualizada": "Consulta remarcada com sucesso.",
  "consulta-criada": "Consulta agendada para o paciente com sucesso.",
  "consulta-cancelada": "Consulta cancelada; o registro histórico foi preservado.",
  "consulta-conflito": "O paciente ou profissional já possui uma consulta nesse horário.",
  "consulta-nao-encontrada": "A consulta não está mais disponível para alteração.",
  "consulta-invalida": "Escolha uma data e um horário futuro disponível para esse profissional.",
};

const sections = {
  geral: { eyebrow: "PAINEL ADMINISTRATIVO", title: "Visão geral", description: "Acesse as principais tarefas da clínica." },
  agenda: { eyebrow: "OPERAÇÃO DA CLÍNICA", title: "Agenda da clínica", description: "Acompanhe e organize os atendimentos." },
  equipe: { eyebrow: "GESTÃO DA CLÍNICA", title: "Equipe da clínica", description: "Gerencie vínculos de médicos e secretárias." },
  especialidades: { eyebrow: "GESTÃO DA CLÍNICA", title: "Especialidades", description: "Organize as áreas de atendimento disponíveis." },
};

const longDayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const shortDayFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// "Sexta-feira, 27 de novembro" (ou "27 de novembro de 2026"), sem depender do fuso do servidor.
function longDayLabel(day, withWeekday = true) {
  const date = new Date(`${day}T12:00:00Z`);
  const text = (withWeekday ? longDayFormat : shortDayFormat).format(date);
  return withWeekday ? text[0].toUpperCase() + text.slice(1) : text;
}

function statusClass(status) {
  if (status === "Agendada") return styles.statusActive;
  if (status === "Aguardando registro") return styles.statusWaiting;
  if (status === "Paciente faltou" || status === "Cancelada") return styles.statusDanger;
  return styles.statusInactive;
}

function selectedDay(value) {
  const today = clinicDateTime(new Date()).date;
  if (value === undefined) return today;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

function appointmentStatus(row) {
  return appointmentStatusLabels[appointmentDisplayStatus(row)];
}

export default async function AdministracaoPage({ searchParams }) {
  // Não mostrar painel administrativo enquanto o Auth real estiver desligado.
  if (
    process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <span className={styles.brand}>+ AgendaSaúde</span>
          <h1>Painel administrativo indisponível</h1>
          <p>O acesso será liberado depois que a autenticação Supabase e as permissões forem ativadas e testadas.</p>
          <Link href="/">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const claims = authData?.claims;

  if (authError || !claims?.sub) {
    redirect("/login?redirect=%2Fadministracao");
  }

  // O papel é lido no banco com a sessão do usuário e RLS; nunca do navegador.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", claims.sub)
    .single();

  if (profileError || profile?.role !== ROLES.ADMIN) {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <span className={styles.brand}>+ AgendaSaúde</span>
          <h1>Acesso não autorizado</h1>
          <p>Esta área é reservada à administração da clínica. Se você deveria ter acesso, procure o responsável pelo projeto.</p>
          <Link href="/dashboard">Ir para a área do paciente</Link>
        </div>
      </main>
    );
  }

  const { data: ownLink, error: linkError } = await supabase
    .from("hospital_staff")
    .select("active")
    .eq("profile_id", claims.sub)
    .eq("hospital_id", 1)
    .single();

  if (linkError || !ownLink?.active) {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <h1>Acesso não autorizado</h1>
          <p>O vínculo administrativo com o Hospital Sapiens não está ativo.</p>
          <Link href="/">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  const { resultado, dia, aba } = await searchParams;
  const section = Object.hasOwn(sections, aba) ? aba : "geral";
  const day = selectedDay(dia);
  const [
    { data: staff, error: staffError },
    { data: specialties, error: specialtyError },
    { data: patients, error: patientsError },
    agendaResult,
  ] = await Promise.all([
    supabase.rpc("admin_list_staff"),
    supabase.rpc("admin_list_specialties"),
    supabase.rpc("admin_list_patients"),
    day ? supabase.rpc("admin_list_appointments", { p_day: day }) : Promise.resolve({ data: null, error: null }),
  ]);
  const activeSpecialties = specialties?.filter((specialty) => specialty.active) ?? [];
  // Muda a cada resposta do servidor: após salvar, a janela aberta é fechada e a lista recomeça.
  const renderKey = `${resultado ?? ""}:${Date.now()}`;
  const appointments = agendaResult.data || [];
  const today = clinicDateTime(new Date()).date;
  const maxDate = new Date(`${today}T12:00:00Z`);
  maxDate.setUTCDate(maxDate.getUTCDate() + 365);
  const maxDay = maxDate.toISOString().slice(0, 10);
  const bookingPatients = patients?.filter((patient) => patient.active).map((patient) => ({
    id: patient.id, name: patient.full_name, email: patient.email,
  })) ?? [];
  const bookingDoctors = staff?.filter((member) => member.active && member.staff_role === ROLES.DOCTOR).map((member) => ({
    id: member.profile_id, name: member.full_name, email: member.email,
  })) ?? [];

  return (
    <StaffShell
      role="Administrador"
      navigationLabel="Navegação administrativa"
      breadcrumb={sections[section].title}
      navigation={[
          { href: "/administracao", label: "Visão geral", icon: "home", current: section === "geral" },
          { href: "/administracao/pacientes", label: "Pacientes", icon: "user", current: false },
          { href: "/administracao?aba=equipe", label: "Equipe", icon: "users", current: section === "equipe" },
          { href: "/administracao?aba=especialidades", label: "Especialidades", icon: "tag", current: section === "especialidades" },
          { href: "/administracao?aba=agenda", label: "Agenda", icon: "calendar", current: section === "agenda" },
          { href: "/administracao/horarios", label: "Horários", icon: "clock", current: false },
          { label: "Serviços", icon: "briefcase", disabled: true, note: "Em breve" },
        ]}
    >
      <main className={styles.main}>

        <div className={styles.content}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>{sections[section].eyebrow}</span>
              <h1>{sections[section].title}</h1>
              <p>{sections[section].description}</p>
            </div>
          </div>

          {feedback[resultado] && <p role="status" className={styles.feedback}>{feedback[resultado]}</p>}

          {section === "geral" && <>
            <section className={styles.overviewSection} aria-labelledby="operacao">
              <h2 id="operacao">Operação da clínica</h2>
              <div className={styles.operationGrid}>
                <Link href="/administracao?aba=agenda" className={`${styles.featureCard} ${styles.primaryFeature}`}>
                  <span className={styles.featureIcon}><Icon name="calendar" size={22} /></span>
                  <span>
                    <small className={styles.cardKicker}>Agenda</small>
                    <strong>Abrir agenda</strong>
                    <span>Veja os atendimentos do dia e faça novos agendamentos.</span>
                  </span>
                  <span className={styles.roundArrow} aria-hidden="true"><Icon name="arrow" size={18} /></span>
                </Link>
                <Link href="/administracao/horarios" className={styles.featureCard}>
                  <span className={`${styles.featureIcon} ${styles.featureIconPale}`}><Icon name="clock" size={22} /></span>
                  <span>
                    <small className={styles.cardKicker}>Disponibilidade</small>
                    <strong>Configurar horários</strong>
                    <span>Defina quando cada médico atende.</span>
                  </span>
                  <span className={`${styles.roundArrow} ${styles.roundArrowOutline}`} aria-hidden="true"><Icon name="arrow" size={18} /></span>
                </Link>
              </div>
            </section>
            <section className={styles.overviewSection} aria-labelledby="cadastros">
              <h2 id="cadastros">Cadastros</h2>
              <p className={styles.overviewLead}>Informações essenciais para o funcionamento da clínica.</p>
              <div className={styles.shortcutGrid}>
                <Link href="/administracao/pacientes" className={styles.shortcutCard}>
                  <span className={styles.smallIcon}><Icon name="user" size={19} /></span>
                  <span><strong>Pacientes</strong><small>Consultar cadastros</small></span>
                  <Icon name="chevron" size={18} />
                </Link>
                <Link href="/administracao?aba=equipe" className={styles.shortcutCard}>
                  <span className={styles.smallIcon}><Icon name="users" size={19} /></span>
                  <span><strong>Equipe</strong><small>{staff?.length ?? 0} {staff?.length === 1 ? "vínculo" : "vínculos"}</small></span>
                  <Icon name="chevron" size={18} />
                </Link>
                <Link href="/administracao?aba=especialidades" className={styles.shortcutCard}>
                  <span className={styles.smallIcon}><Icon name="tag" size={19} /></span>
                  <span><strong>Especialidades</strong><small>{specialties?.length ?? 0} {specialties?.length === 1 ? "cadastrada" : "cadastradas"}</small></span>
                  <Icon name="chevron" size={18} />
                </Link>
              </div>
            </section>
          </>}

          {section === "especialidades" && <section id="especialidades" className={styles.specialtySection} aria-label="Especialidades">
            {specialtyError ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar as especialidades. Aplique a migration deste card antes de testar a tela.</p>
            ) : (
              <SpecialtyManager key={renderKey} specialties={specialties || []} />
            )}
          </section>}

          {section === "equipe" && <section id="equipe" className={styles.staffSection} aria-label="Equipe">
            {staffError ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar a equipe. Verifique se a migration de permissões foi aplicada.</p>
            ) : (
              <StaffManager key={renderKey} staff={staff || []} specialties={activeSpecialties} canEdit={!specialtyError} />
            )}
          </section>}

          {section === "agenda" && <section id="agenda" className={styles.agendaSection} aria-label="Agenda da clínica">
            <div className={styles.sectionAction}>
              <NewAppointmentButton
                key={renderKey}
                patients={bookingPatients}
                doctors={bookingDoctors}
                initialDay={day && day >= today ? day : today}
                minDay={today}
                maxDay={maxDay}
                disabledReason={patientsError || staffError
                  ? "Não foi possível carregar pacientes ou médicos. Confira as permissões e atualize a página."
                  : bookingPatients.length === 0 || bookingDoctors.length === 0
                    ? "É necessário ter ao menos um paciente e um médico ativos para agendar."
                    : ""}
              />
            </div>
            <div className={`${styles.panel} ${styles.scheduleToolbar}`}>
              <div>
                <span className={styles.cardKicker}>Data selecionada</span>
                <h2>{day ? longDayLabel(day) : "Escolha uma data"}</h2>
              </div>
              <form action="/administracao" method="get" className={styles.dateControls}>
                <input type="hidden" name="aba" value="agenda" />
                <Link href="/administracao?aba=agenda" className="ui-button ui-button-secondary">Hoje</Link>
                <label className={styles.srOnly} htmlFor="agenda-day">Dia da agenda</label>
                <input id="agenda-day" type="date" name="dia" defaultValue={day || ""} required />
                <button type="submit" className="ui-button ui-button-primary">Consultar</button>
              </form>
            </div>
            {!day ? (
              <p role="alert" className={styles.feedback}>Escolha uma data válida para consultar a agenda.</p>
            ) : agendaResult.error ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar a agenda. Confira se a migração de leitura administrativa foi aplicada.</p>
            ) : (
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <div>
                    <h3>Agenda do dia</h3>
                    <p>{appointments.length === 0 ? "Nenhum atendimento neste dia" : `${appointments.length} ${appointments.length === 1 ? "atendimento" : "atendimentos"} em ordem de horário`}</p>
                  </div>
                </div>
                {appointments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.smallIcon} aria-hidden="true"><Icon name="calendar" size={20} /></span>
                    <h3>Nenhuma consulta neste dia</h3>
                    <p>Escolha outra data ou faça um novo agendamento.</p>
                  </div>
                ) : appointments.map((appointment) => {
                  const status = appointmentStatus(appointment);
                  const appointmentDateTime = clinicDateTime(appointment.scheduled_at);
                  const canManage = status === "Agendada" && new Date(appointment.scheduled_at) > new Date();
                  const patientName = appointment.patient_name?.trim() || "Paciente sem nome";
                  const doctorName = appointment.doctor_name?.trim() || "Médico sem nome";
                  return (
                    <article className={styles.appointmentRow} key={appointment.id}>
                      <time dateTime={appointment.scheduled_at} className={styles.timeBox}>
                        {appointmentDateTime.time}
                        <small>horário</small>
                      </time>
                      <div className={styles.appointmentMain}>
                        <strong>{patientName}</strong>
                        <span>{doctorName}</span>
                        <small>{appointment.specialty}</small>
                      </div>
                      <span className={statusClass(status)}>{status}</span>
                      {canManage ? (
                        <AppointmentActions
                          appointment={{
                            id: appointment.id,
                            date: appointmentDateTime.date,
                            time: appointmentDateTime.time,
                            dateLabel: longDayLabel(appointmentDateTime.date, false),
                            patient: patientName,
                            doctor: doctorName,
                          }}
                        />
                      ) : <span aria-hidden="true" />}
                    </article>
                  );
                })}
              </div>
            )}
          </section>}

        </div>
      </main>
    </StaffShell>
  );
}
