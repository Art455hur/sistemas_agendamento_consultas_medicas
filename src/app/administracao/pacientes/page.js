import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { createClient } from "@/lib/supabase/server";
import {
  deactivatePatient,
  reactivatePatient,
} from "@/app/administracao/actions";
import PatientEditForm from "./PatientEditForm";
import styles from "@/app/administracao/page.module.css";

export const metadata = {
  title: "Pacientes | Administração | AgendaSaúde",
};

export const dynamic = "force-dynamic";

const feedback = {
  "paciente-atualizado": "Dados do paciente atualizados com sucesso.",
  "paciente-desativado": "Paciente desativado. Consultas futuras agendadas foram canceladas e o histórico foi preservado.",
  "paciente-reativado": "Paciente reativado com sucesso.",
  "paciente-nao-encontrado": "Paciente não encontrado. Atualize a página.",
  "paciente-invalido": "Confira nome, telefone, CPF e data de nascimento.",
  "cpf-duplicado": "Este CPF já está cadastrado em outra conta.",
  negado: "Ação negada: somente um administrador ativo pode gerenciar pacientes.",
  erro: "Não foi possível concluir a operação. Confira o banco e tente novamente.",
};

export default async function PacientesAdministracaoPage({ searchParams }) {
  if (
    process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <span className={styles.brand}>+ AgendaSaúde</span>
          <h1>Gestão de pacientes indisponível</h1>
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
    redirect("/login?redirect=%2Fadministracao%2Fpacientes");
  }

  const [{ data: profile, error: profileError }, { data: ownLink, error: linkError }] = await Promise.all([
    supabase.from("profiles").select("role, full_name").eq("id", claims.sub).single(),
    supabase.from("hospital_staff").select("active").eq("profile_id", claims.sub).eq("hospital_id", 1).single(),
  ]);

  if (profileError || profile?.role !== ROLES.ADMIN || linkError || !ownLink?.active) {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <span className={styles.brand}>+ AgendaSaúde</span>
          <h1>Acesso não autorizado</h1>
          <p>Esta área é reservada a administradores ativos do Hospital Sapiens.</p>
          <Link href="/dashboard">Voltar</Link>
        </div>
      </main>
    );
  }

  const { resultado } = await searchParams;
  const { data: patients, error: patientsError } = await supabase.rpc("admin_list_patients");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">+ AgendaSaúde</Link>
        <div className={styles.workspaceLabel}>ESPAÇO DE TRABALHO</div>
        <nav aria-label="Navegação administrativa" className={styles.navigation}>
          <Link className={styles.teamLink} href="/administracao">▦ Visão geral</Link>
          <span className={styles.current} aria-current="page">♙ Pacientes</span>
          <Link className={styles.teamLink} href="/administracao?aba=equipe">♧ Equipe</Link>
          <Link className={styles.teamLink} href="/administracao?aba=especialidades">✚ Especialidades</Link>
          <Link className={styles.teamLink} href="/administracao?aba=agenda">▤ Agenda</Link>
          <Link className={styles.teamLink} href="/administracao/horarios">◷ Horários</Link>
        </nav>
        <div className={styles.sidebarFooter}>Área administrativa · N2</div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>AgendaSaúde <span>/</span> Administração <span>/</span> Pacientes</div>
          <span className={styles.roleBadge}>Administrador</span>
        </header>

        <div className={styles.content}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>CRUD DE PACIENTES</span>
              <h1>Pacientes</h1>
              <p>Consulte, edite, desative e reative pacientes cadastrados. Novas contas continuam sendo criadas pelo cadastro público.</p>
            </div>
            <span className={styles.phase}>{patients?.length ?? 0} cadastrados</span>
          </div>

          <section className={styles.notice} aria-label="Regra de exclusão">
            <div className={styles.noticeIcon}>i</div>
            <div>
              <strong>Exclusão lógica para preservar o histórico</strong>
              <p>Desativar um paciente não apaga a conta nem consultas antigas. Consultas futuras agendadas são canceladas e o acesso do paciente aos fluxos privados fica bloqueado até a reativação.</p>
            </div>
          </section>

          {feedback[resultado] && <p role="status" className={styles.feedback}>{feedback[resultado]}</p>}

          {patientsError ? (
            <p role="alert" className={styles.feedback}>Não foi possível carregar os pacientes. Aplique a migration deste card antes de testar a tela.</p>
          ) : (
            <section className={styles.patientList} aria-label="Pacientes cadastrados">
              {patients?.map((patient) => (
                <article className={styles.patientCard} key={patient.id}>
                  <div className={styles.patientHeader}>
                    <div>
                      <h2>{patient.full_name?.trim() || "Paciente sem nome"}</h2>
                      <p>{patient.email}</p>
                    </div>
                    <span className={patient.active ? styles.active : styles.inactive}>
                      {patient.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <PatientEditForm patient={patient} today={today} />

                  <div className={styles.patientFoot}>
                    <span>{patient.appointment_count} consulta{Number(patient.appointment_count) === 1 ? "" : "s"} no histórico</span>
                    <form action={patient.active ? deactivatePatient : reactivatePatient}>
                      <input type="hidden" name="patientId" value={patient.id} />
                      <button className={patient.active ? styles.deactivate : styles.reactivate} type="submit">
                        {patient.active ? "Desativar paciente" : "Reativar paciente"}
                      </button>
                    </form>
                  </div>
                </article>
              ))}
              {patients?.length === 0 && <p className={styles.agendaEmpty}>Nenhum paciente cadastrado.</p>}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
