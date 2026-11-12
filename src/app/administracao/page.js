import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { createClient } from "@/lib/supabase/server";
import {
  assignStaff,
  createSpecialty,
  deactivateSpecialty,
  deactivateStaff,
  reactivateSpecialty,
  reactivateStaff,
  updateSpecialty,
} from "@/app/administracao/actions";
import styles from "@/app/administracao/page.module.css";

export const metadata = {
  title: "Administração | AgendaSaúde",
};

export const dynamic = "force-dynamic";

const modules = [
  {
    number: "01",
    title: "Agenda da clínica",
    description: "Consulte a programação da equipe quando a gestão geral de agendamentos estiver integrada.",
    status: "Aguardando integração",
  },
  {
    number: "02",
    title: "Horários disponíveis",
    description: "Configure a grade de atendimento individual dos profissionais.",
    status: "Aguardando integração",
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
};

const roleLabel = { admin: "Administrador", doctor: "Médico", receptionist: "Secretaria" };

export default async function AdministracaoPage({ searchParams }) {
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

  const [
    { data: staff, error: staffError },
    { data: specialties, error: specialtyError },
  ] = await Promise.all([
    supabase.rpc("admin_list_staff"),
    supabase.rpc("admin_list_specialties"),
  ]);

  const activeSpecialties = specialties?.filter((specialty) => specialty.active) ?? [];
  const { resultado } = await searchParams;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">+ AgendaSaúde</Link>
        <div className={styles.workspaceLabel}>ESPAÇO DE TRABALHO</div>
        <nav aria-label="Navegação administrativa" className={styles.navigation}>
          <span className={styles.current} aria-current="page">▦ Visão geral</span>
          <a className={styles.teamLink} href="#equipe">♧ Equipe</a>
          <a className={styles.teamLink} href="#especialidades">✚ Especialidades</a>
          <span className={styles.upcoming}>▤ Agenda <small>Em breve</small></span>
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
              <p>Gerencie equipe e especialidades do Hospital Sapiens.</p>
            </div>
            <span className={styles.phase}>Painel em construção</span>
          </div>

          <section className={styles.notice} aria-label="Estado da integração">
            <div className={styles.noticeIcon}>i</div>
            <div>
              <strong>Especialidades integradas ao cadastro de médicos</strong>
              <p>Especialidades desativadas ficam preservadas no histórico, mas deixam de aceitar novos vínculos e novos agendamentos.</p>
            </div>
          </section>

          {feedback[resultado] && <p role="status" className={styles.feedback}>{feedback[resultado]}</p>}

          <section id="especialidades" className={styles.specialtySection} aria-labelledby="specialties-heading">
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
                      <input
                        id={`specialty-${specialty.id}`}
                        name="name"
                        type="text"
                        minLength={2}
                        maxLength={120}
                        required
                        defaultValue={specialty.name}
                      />
                      <button type="submit">Salvar</button>
                    </form>
                    <span className={specialty.active ? styles.active : styles.inactive}>
                      {specialty.active ? "Ativa" : "Inativa"}
                    </span>
                    <form action={specialty.active ? deactivateSpecialty : reactivateSpecialty}>
                      <input type="hidden" name="specialtyId" value={specialty.id} />
                      <button
                        className={specialty.active ? styles.deactivate : styles.reactivate}
                        type="submit"
                      >
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
                <input
                  id="new-specialty"
                  name="name"
                  type="text"
                  minLength={2}
                  maxLength={120}
                  required
                  placeholder="Ex.: Cardiologia"
                />
              </div>
              <button type="submit">Cadastrar especialidade</button>
            </form>
            <p className={styles.staffHint}>Desativar não apaga consultas antigas. Médicos de uma especialidade inativa deixam de aparecer para novos agendamentos até a reativação.</p>
          </section>

          <section id="equipe" className={styles.staffSection} aria-labelledby="staff-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="staff-heading">Equipe do Hospital Sapiens</h2>
                <p>Vincule contas existentes e selecione uma especialidade ativa para médicos.</p>
              </div>
              <span>{staff?.length ?? 0} vínculos</span>
            </div>

            {staffError ? (
              <p role="alert" className={styles.feedback}>Não foi possível carregar a equipe. Verifique se as migrations de permissões foram aplicadas.</p>
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
                <label htmlFor="staff-specialty">Especialidade</label>
                <select id="staff-specialty" name="specialty" defaultValue="">
                  <option value="">Selecione para médicos</option>
                  {activeSpecialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.name}>{specialty.name}</option>
                  ))}
                </select>
                <small>Obrigatória para médicos; para secretaria, deixe em branco.</small>
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
            <p className={styles.staffHint}>Para atualizar nome, função ou especialidade, preencha o formulário com o mesmo e-mail. Desativar não exclui o usuário nem cancela consultas existentes.</p>
          </section>

          <section aria-labelledby="modules-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="modules-heading">Próximos módulos</h2>
                <p>Funcionalidades administrativas ainda pendentes no backlog.</p>
              </div>
              <span>{modules.length} módulos</span>
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
              <p>Aplicar e validar a migration em ambiente coordenado pela equipe, testar o CRUD e só depois integrar à main.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
