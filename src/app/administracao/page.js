import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import { assignStaff, deactivateStaff, reactivateStaff } from "@/app/administracao/actions";
import styles from "@/app/administracao/page.module.css";

export const metadata = {
  title: "Administração | AgendaSaúde",
};

export const dynamic = "force-dynamic";

const modules = [
  {
    number: "03",
    title: "Especialidades e horários",
    description: "Organize os serviços e os horários disponíveis para pacientes.",
    status: "Aguardando integração",
  },
];

const feedback = {
  atribuido: "Dados do funcionário salvos e vínculo ativado no Hospital Sapiens.",
  desativado: "Vínculo desativado. A conta permanece no Supabase Auth.",
  reativado: "Funcionário reativado com sucesso.",
  "dados-incompletos": "Preencha o nome e, para médicos, a especialidade no formulário antes de reativar.",
  "vinculo-nao-encontrado": "O vínculo deste funcionário não foi encontrado. Atualize a página.",
  "nao-encontrado": "Conta não encontrada. Crie o usuário em Auth antes de vinculá-lo.",
  consultas: "Esta conta tem consultas vinculadas e não pode trocar de função.",
  negado: "Ação negada: somente um administrador ativo pode gerenciar a equipe.",
  invalido: "Confira o e-mail, o nome e a função. Médicos também precisam de especialidade.",
  erro: "Não foi possível concluir a operação. Confira o banco e tente novamente.",
  indisponivel: "A autenticação ainda não está ativada.",
};

const roleLabel = { admin: "Administrador", doctor: "Médico", receptionist: "Secretaria" };

function selectedDay(value) {
  const today = clinicDateTime(new Date()).date;
  if (value === undefined) return today;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

function appointmentStatus(row) {
  if (row.status === "cancelled") return "Cancelada";
  if (row.status === "completed" || new Date(row.scheduled_at) < new Date()) return "Concluída";
  return "Agendada";
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

  const { resultado, dia } = await searchParams;
  const day = selectedDay(dia);
  const [{ data: staff, error: staffError }, agendaResult] = await Promise.all([
    supabase.rpc("admin_list_staff"),
    day ? supabase.rpc("admin_list_appointments", { p_day: day }) : Promise.resolve({ data: null, error: null }),
  ]);
  const appointments = agendaResult.data || [];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">+ AgendaSaúde</Link>
        <div className={styles.workspaceLabel}>ESPAÇO DE TRABALHO</div>
        <nav aria-label="Navegação administrativa" className={styles.navigation}>
          <span className={styles.current} aria-current="page">▦ Visão geral</span>
          <a className={styles.teamLink} href="#equipe">♧ Equipe</a>
          <a className={styles.teamLink} href="#agenda">▤ Agenda</a>
          <span className={styles.upcoming}>✚ Serviços <small>Em breve</small></span>
        </nav>
        <div className={styles.sidebarFooter}>Área administrativa · N2</div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>AgendaSaúde <span>/</span> Administração</div>
          <span className={styles.roleBadge}>Administrador</span>
        </header>

        <div className={styles.content}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>VISÃO GERAL DA CLÍNICA</span>
              <h1>Olá, {profile.full_name?.trim() || "administrador"}.</h1>
              <p>Gerencie os vínculos da equipe e consulte a agenda do Hospital Sapiens.</p>
            </div>
            <span className={styles.phase}>Painel em construção</span>
          </div>

          <section className={styles.notice} aria-label="Estado da integração">
            <div className={styles.noticeIcon}>i</div>
            <div>
              <strong>Equipe e agenda em ambiente de testes</strong>
              <p>As contas de funcionários precisam existir no Supabase Auth. A agenda permite apenas consulta; a gestão de horários ainda aguarda integração.</p>
            </div>
          </section>

          <section id="equipe" className={styles.staffSection} aria-labelledby="staff-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="staff-heading">Equipe do Hospital Sapiens</h2>
                <p>Vincule contas existentes e preencha os dados profissionais. Médicos com especialidade e vínculo ativo aparecem no agendamento.</p>
              </div>
              <span>{staff?.length ?? 0} vínculos</span>
            </div>

            {feedback[resultado] && <p role="status" className={styles.feedback}>{feedback[resultado]}</p>}
            {staffError ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar a equipe. Verifique se a migration de permissões foi aplicada.</p>
            ) : (
              <div className={styles.staffList}>
                {staff?.map((member) => (
                  <div className={styles.staffRow} key={member.profile_id}>
                    <div>
                      <strong>{member.full_name?.trim() || member.email}</strong>
                      <span>{member.email} · {roleLabel[member.staff_role] ?? member.staff_role}</span>
                    </div>
                    <span className={member.active ? styles.active : styles.inactive}>
                      {member.active ? "Ativo" : "Inativo"}
                    </span>
                    {member.staff_role !== ROLES.ADMIN && (
                      <form action={member.active ? deactivateStaff : reactivateStaff}>
                        <input type="hidden" name="profileId" value={member.profile_id} />
                        <button
                          className={member.active ? styles.deactivate : styles.reactivate}
                          type="submit"
                          aria-label={`${member.active ? "Desativar" : "Reativar"} ${member.email}`}
                        >
                          {member.active ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                    )}
                  </div>
                ))}
                {staff?.length === 0 && <p>Ainda não há vínculos de funcionários.</p>}
              </div>
            )}

            <form action={assignStaff} className={styles.staffForm}>
              <div>
                <label htmlFor="staff-email">E-mail de uma conta já criada</label>
                <input id="staff-email" name="email" type="email" maxLength={254} required placeholder="funcionario@exemplo.com" />
              </div>
              <div>
                <label htmlFor="staff-name">Nome do profissional</label>
                <input id="staff-name" name="fullName" type="text" minLength={3} maxLength={120} required placeholder="Nome completo" />
              </div>
              <div>
                <label htmlFor="staff-specialty">Especialidade (obrigatória para médicos)</label>
                <input id="staff-specialty" name="specialty" type="text" maxLength={120} placeholder="Ex.: Clínica Geral" aria-describedby="staff-specialty-help" />
                <small id="staff-specialty-help">Para secretaria, deixe em branco.</small>
              </div>
              <div>
                <label htmlFor="staff-role">Função</label>
                <select id="staff-role" name="role" required defaultValue="doctor">
                  <option value="doctor">Médico</option>
                  <option value="receptionist">Secretaria</option>
                </select>
              </div>
              <button type="submit">Salvar e ativar vínculo</button>
            </form>
            <p className={styles.staffHint}>Use Reativar ao lado de um funcionário inativo para recuperar o vínculo com os mesmos dados. Para atualizar nome, função ou especialidade, preencha o formulário com o mesmo e-mail. Desativar não exclui o usuário nem cancela consultas existentes. A conta administrativa não pode ser alterada por este formulário.</p>
          </section>

          <section id="agenda" className={styles.agendaSection} aria-labelledby="agenda-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="agenda-heading">Agenda da clínica</h2>
                <p>Consultas do Hospital Sapiens no horário da clínica (São Paulo). Somente leitura.</p>
              </div>
              <span>Até 200 consultas por dia</span>
            </div>
            <form action="/administracao" method="get" className={styles.agendaFilter}>
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
                  return (
                    <article className={styles.agendaRow} key={appointment.id}>
                      <time dateTime={appointment.scheduled_at} className={styles.agendaTime}>
                        {clinicDateTime(appointment.scheduled_at).time}
                      </time>
                      <div className={styles.agendaDetails}>
                        <strong>{appointment.patient_name?.trim() || "Paciente sem nome"}</strong>
                        <span>{appointment.doctor_name?.trim() || "Médico sem nome"} · {appointment.specialty}</span>
                      </div>
                      <span className={status === "Agendada" ? styles.active : styles.inactive}>{status}</span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="modules-heading">
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
                  <div className={styles.moduleFoot}>Disponível após integração</div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.nextStep} aria-labelledby="next-heading">
            <div className={styles.nextIcon}>↗</div>
            <div>
              <h2 id="next-heading">Próximo passo</h2>
              <p>Validar a agenda com contas de demonstração, concluir a gestão de horários e, só então, revisar a ativação do login no site publicado.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
