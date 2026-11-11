import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "../../lib/access-control";
import { createClient } from "../../lib/supabase/server";
import styles from "./page.module.css";

export const metadata = {
  title: "Administração | AgendaSaúde",
};

export const dynamic = "force-dynamic";

const modules = [
  {
    number: "01",
    title: "Equipe da clínica",
    description: "Vincule médicos e secretárias à clínica e acompanhe suas funções.",
    status: "Próxima etapa",
  },
  {
    number: "02",
    title: "Agenda da clínica",
    description: "Consulte a programação da equipe quando os agendamentos estiverem integrados.",
    status: "Aguardando integração",
  },
  {
    number: "03",
    title: "Especialidades e horários",
    description: "Organize os serviços e os horários disponíveis para pacientes.",
    status: "Aguardando integração",
  },
];

export default async function AdministracaoPage() {
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
  const { data: { claims }, error: authError } = await supabase.auth.getClaims();

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

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">+ AgendaSaúde</Link>
        <div className={styles.workspaceLabel}>ESPAÇO DE TRABALHO</div>
        <nav aria-label="Navegação administrativa" className={styles.navigation}>
          <span className={styles.current} aria-current="page">▦ Visão geral</span>
          <span className={styles.upcoming}>♧ Equipe <small>Em breve</small></span>
          <span className={styles.upcoming}>▤ Agenda <small>Em breve</small></span>
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
              <p>Este será o espaço para organizar a equipe e acompanhar a operação da clínica.</p>
            </div>
            <span className={styles.phase}>Painel em construção</span>
          </div>

          <section className={styles.notice} aria-label="Estado da integração">
            <div className={styles.noticeIcon}>i</div>
            <div>
              <strong>Estrutura pronta para integração</strong>
              <p>Dados de funcionários, consultas e horários ainda não estão disponíveis nesta área. Os módulos serão habilitados após serviços, permissões no banco e testes.</p>
            </div>
          </section>

          <section aria-labelledby="modules-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="modules-heading">Módulos de gestão</h2>
                <p>Funcionalidades planejadas para o administrador.</p>
              </div>
              <span>3 módulos</span>
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
              <p>Implementar o vínculo de funcionários com a clínica e definir no banco quais dados o administrador pode consultar e alterar.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
