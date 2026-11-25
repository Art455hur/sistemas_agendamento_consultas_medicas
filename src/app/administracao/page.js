import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { appointmentDisplayStatus, appointmentStatusLabels, clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import AdminCreateAppointmentForm from "@/app/administracao/AdminCreateAppointmentForm";
import StaffManager from "@/app/administracao/StaffManager";
import {
  createSpecialty,
  cancelAdminAppointment,
  deactivateSpecialty,
  reactivateSpecialty,
  rescheduleAdminAppointment,
  updateSpecialty,
} from "@/app/administracao/actions";
import styles from "@/app/administracao/page.module.css";

export const metadata = {
  title: "Administração | AgendaSaúde",
};

export const dynamic = "force-dynamic";

const modules = [
  {
    number: "02",
    title: "Horários disponíveis",
    description: "Configure a grade de atendimento individual dos profissionais.",
    status: "Configurar",
    href: "/administracao/horarios",
  },
];

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
  geral: { eyebrow: "VISÃO GERAL DA CLÍNICA", title: "Painel administrativo", description: "Escolha uma área para gerenciar o Hospital Sapiens." },
  agenda: { eyebrow: "CONSULTAS", title: "Agenda da clínica", description: "Agende, consulte, remarque ou cancele consultas." },
  equipe: { eyebrow: "PROFISSIONAIS", title: "Equipe da clínica", description: "Gerencie os vínculos dos médicos e da secretaria." },
  especialidades: { eyebrow: "CATÁLOGO", title: "Especialidades", description: "Cadastre e organize as especialidades da clínica." },
};

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
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">+ AgendaSaúde</Link>
        <div className={styles.workspaceLabel}>ESPAÇO DE TRABALHO</div>
        <nav aria-label="Navegação administrativa" className={styles.navigation}>
          <Link className={section === "geral" ? styles.current : styles.teamLink} aria-current={section === "geral" ? "page" : undefined} href="/administracao">▦ Visão geral</Link>
          <Link className={styles.teamLink} href="/administracao/pacientes">♙ Pacientes</Link>
          <Link className={section === "equipe" ? styles.current : styles.teamLink} aria-current={section === "equipe" ? "page" : undefined} href="/administracao?aba=equipe">♧ Equipe</Link>
          <Link className={section === "especialidades" ? styles.current : styles.teamLink} aria-current={section === "especialidades" ? "page" : undefined} href="/administracao?aba=especialidades">✚ Especialidades</Link>
          <Link className={section === "agenda" ? styles.current : styles.teamLink} aria-current={section === "agenda" ? "page" : undefined} href="/administracao?aba=agenda">▤ Agenda</Link>
          <Link className={styles.teamLink} href="/administracao/horarios">◷ Horários</Link>
          <span className={styles.upcoming}>✚ Serviços <small>Em breve</small></span>
        </nav>
        <div className={styles.sidebarFooter}>Área administrativa · N2</div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>AgendaSaúde <span>/</span> Administração <span>/</span> {sections[section].title}</div>
          <span className={styles.roleBadge}>Administrador</span>
        </header>

        <div className={styles.content}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>{sections[section].eyebrow}</span>
              <h1>{section === "geral" ? `Olá, ${profile.full_name?.trim() || "administrador"}.` : sections[section].title}</h1>
              <p>{sections[section].description}</p>
            </div>
            <span className={styles.phase}>Hospital Sapiens</span>
          </div>

          {section === "geral" && <section className={styles.notice} aria-label="Estado da integração">
            <div className={styles.noticeIcon}>i</div>
            <div>
              <strong>Equipe, especialidades e agenda em ambiente de testes</strong>
              <p>Especialidades desativadas ficam preservadas no histórico. A agenda permite agendar, remarcar e cancelar consultas; os horários dos médicos têm configuração própria.</p>
            </div>
          </section>}

          {feedback[resultado] && <p role="status" className={styles.feedback}>{feedback[resultado]}</p>}

          {section === "geral" && <section className={styles.overviewGrid} aria-label="Áreas de gestão">
            <Link href="/administracao?aba=agenda" className={styles.overviewCard}><span>▤</span><h2>Agenda</h2><p>Agendar, remarcar e cancelar consultas da clínica.</p><strong>Abrir agenda →</strong></Link>
            <Link href="/administracao?aba=equipe" className={styles.overviewCard}><span>♧</span><h2>Equipe</h2><p>Consultar e atualizar vínculos de profissionais.</p><strong>{staff?.length ?? 0} vínculos →</strong></Link>
            <Link href="/administracao?aba=especialidades" className={styles.overviewCard}><span>✚</span><h2>Especialidades</h2><p>Cadastrar e gerenciar as áreas de atendimento.</p><strong>{specialties?.length ?? 0} cadastradas →</strong></Link>
            <Link href="/administracao/pacientes" className={styles.overviewCard}><span>♙</span><h2>Pacientes</h2><p>Consultar e atualizar os cadastros de pacientes.</p><strong>Abrir pacientes →</strong></Link>
            <Link href="/administracao/horarios" className={styles.overviewCard}><span>◷</span><h2>Horários dos médicos</h2><p>Definir a disponibilidade por médico e data.</p><strong>Configurar horários →</strong></Link>
          </section>}

          {section === "especialidades" && <section id="especialidades" className={styles.specialtySection} aria-labelledby="specialties-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="specialties-heading">Especialidades</h2>
                <p>Cadastre, renomeie, desative ou reative especialidades disponíveis na clínica.</p>
              </div>
              <span>{specialties?.length ?? 0} cadastradas</span>
            </div>
            {specialtyError ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar as especialidades. Aplique a migration deste card antes de testar a tela.</p>
            ) : (
              <div className={styles.specialtyList}>
                {specialties?.map((specialty) => (
                  <div className={styles.specialtyRow} key={specialty.id}>
                    <form action={updateSpecialty} className={styles.specialtyEditForm}>
                      <input type="hidden" name="specialtyId" value={specialty.id} />
                      <label className={styles.srOnly} htmlFor={`specialty-${specialty.id}`}>Nome da especialidade</label>
                      <input id={`specialty-${specialty.id}`} name="name" type="text" minLength={2} maxLength={120} required defaultValue={specialty.name} />
                      <button type="submit">Salvar</button>
                    </form>
                    <span className={specialty.active ? styles.active : styles.inactive}>{specialty.active ? "Ativa" : "Inativa"}</span>
                    <form action={specialty.active ? deactivateSpecialty : reactivateSpecialty}>
                      <input type="hidden" name="specialtyId" value={specialty.id} />
                      <button className={specialty.active ? styles.deactivate : styles.reactivate} type="submit">
                        {specialty.active ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  </div>
                ))}
                {specialties?.length === 0 && <p>Ainda não há especialidades cadastradas.</p>}
              </div>
            )}
            <form action={createSpecialty} className={styles.specialtyCreateForm}>
              <div>
                <label htmlFor="new-specialty">Nova especialidade</label>
                <input id="new-specialty" name="name" type="text" minLength={2} maxLength={120} required placeholder="Ex.: Cardiologia" />
              </div>
              <button type="submit">Cadastrar especialidade</button>
            </form>
            <p className={styles.staffHint}>Desativar não apaga consultas antigas. Médicos de uma especialidade inativa deixam de aparecer para novos agendamentos até a reativação.</p>
          </section>}

          {section === "equipe" && <section id="equipe" className={styles.staffSection} aria-labelledby="staff-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="staff-heading">Equipe do Hospital Sapiens</h2>
                <p>Vincule contas existentes e selecione uma especialidade ativa para médicos.</p>
              </div>
              <span>{staff?.length ?? 0} vínculos</span>
            </div>

            {staffError ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar a equipe. Verifique se a migration de permissões foi aplicada.</p>
            ) : (
              <StaffManager staff={staff || []} specialties={activeSpecialties} canEdit={!specialtyError} />
            )}
          </section>}

          {section === "agenda" && <section id="agenda" className={styles.agendaSection} aria-labelledby="agenda-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="agenda-heading">Agenda da clínica</h2>
                <p>Consulte, remarque ou cancele consultas futuras do Hospital Sapiens. Os conflitos são validados novamente pelo banco.</p>
              </div>
              <span>Até 200 consultas por dia</span>
            </div>
            <div className={styles.createAppointmentCard}>
              <h3>Agendar para um paciente</h3>
              <p>Selecione uma conta de paciente já criada, um médico ativo e um horário livre.</p>
              {patientsError || staffError ? (
                <p role="alert" className={styles.feedback}>Não foi possível carregar pacientes ou médicos. Confira as permissões e atualize a página.</p>
              ) : bookingPatients.length === 0 || bookingDoctors.length === 0 ? (
                <p className={styles.createAppointmentHint}>É necessário ter ao menos um paciente e um médico ativos para agendar.</p>
              ) : (
                <AdminCreateAppointmentForm
                  patients={bookingPatients}
                  doctors={bookingDoctors}
                  initialDay={day || today}
                  minDay={today}
                  maxDay={maxDay}
                />
              )}
            </div>
            <form action="/administracao" method="get" className={styles.agendaFilter}>
              <input type="hidden" name="aba" value="agenda" />
              <label htmlFor="agenda-day">Dia da agenda</label>
              <input id="agenda-day" type="date" name="dia" defaultValue={day || ""} required />
              <button type="submit">Consultar</button>
            </form>
            {!day ? (
              <p role="alert" className={styles.feedback}>Escolha uma data válida para consultar a agenda.</p>
            ) : agendaResult.error ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar a agenda. Confira se a migração de leitura administrativa foi aplicada.</p>
            ) : appointments.length === 0 ? (
              <p className={styles.agendaEmpty}>Nenhuma consulta encontrada neste dia.</p>
            ) : (
              <div className={styles.agendaList}>
                {appointments.map((appointment) => {
                  const status = appointmentStatus(appointment);
                  const appointmentDateTime = clinicDateTime(appointment.scheduled_at);
                  const canManage = status === "Agendada" && new Date(appointment.scheduled_at) > new Date();
                  return (
                    <article className={styles.agendaRow} key={appointment.id}>
                      <time dateTime={appointment.scheduled_at} className={styles.agendaTime}>
                        {appointmentDateTime.time}
                      </time>
                      <div className={styles.agendaDetails}>
                        <strong>{appointment.patient_name?.trim() || "Paciente sem nome"}</strong>
                        <span>{appointment.doctor_name?.trim() || "Médico sem nome"} · {appointment.specialty}</span>
                      </div>
                      <span className={status === "Agendada" ? styles.active : styles.inactive}>{status}</span>
                      {canManage && <div className={styles.appointmentActions}>
                        <form action={rescheduleAdminAppointment}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <label>
                            <span>Nova data</span>
                            <input type="date" name="day" defaultValue={appointmentDateTime.date} required />
                          </label>
                          <label>
                            <span>Novo horário</span>
                            <input type="time" name="time" min="08:00" max="17:30" step="1800" defaultValue={appointmentDateTime.time} required />
                          </label>
                          <button type="submit">Remarcar</button>
                        </form>
                        <form action={cancelAdminAppointment}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <input type="hidden" name="day" value={appointmentDateTime.date} />
                          <button type="submit" className={styles.deactivate}>Cancelar consulta</button>
                        </form>
                      </div>}
                    </article>
                  );
                })}
              </div>
            )}
          </section>}

          {section === "geral" && <section aria-labelledby="modules-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="modules-heading">Módulos de gestão</h2>
                <p>Funcionalidades planejadas para o administrador.</p>
              </div>
              <span>1 módulo</span>
            </div>
            <div className={styles.grid}>
              {modules.map((module) => (
                <article className={styles.module} key={module.number}>
                  <div className={styles.moduleTop}>
                    <span className={styles.moduleNumber}>{module.number}</span>
                    <span className={styles.moduleStatus}>{module.status}</span>
                  </div>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <Link className={styles.moduleFoot} href={module.href}>Abrir horários →</Link>
                </article>
              ))}
            </div>
          </section>}

          {section === "geral" && <section className={styles.nextStep} aria-labelledby="next-heading">
            <div className={styles.nextIcon}>↗</div>
            <div>
              <h2 id="next-heading">Próximo passo</h2>
              <p>Continue a validação das permissões e dos fluxos com contas fictícias antes de usar com pacientes reais.</p>
            </div>
          </section>}
        </div>
      </main>
    </div>
  );
}
