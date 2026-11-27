import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLES } from "@/features/auth/access-control.js";
import { createClient } from "@/lib/supabase/server";
import PatientManager from "./PatientManager";
import styles from "@/app/administracao/page.module.css";
import StaffShell from "@/components/layout/StaffShell.js";

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
    <StaffShell
      role="Administrador"
      navigationLabel="Navegação administrativa"
      breadcrumb="Pacientes"
      navigation={[
          { href: "/administracao", label: "Visão geral", icon: "home", current: false },
          { href: "/administracao/pacientes", label: "Pacientes", icon: "user", current: true },
          { href: "/administracao?aba=equipe", label: "Equipe", icon: "users", current: false },
          { href: "/administracao?aba=especialidades", label: "Especialidades", icon: "tag", current: false },
          { href: "/administracao?aba=agenda", label: "Agenda", icon: "calendar", current: false },
          { href: "/administracao/horarios", label: "Horários", icon: "clock", current: false },
          { label: "Serviços", icon: "briefcase", disabled: true, note: "Em breve" },
        ]}
    >
      <main className={styles.main}>

        <div className={styles.content}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>CADASTROS</span>
              <h1>Pacientes</h1>
              <p>Consulte e gerencie o acesso dos pacientes. Novas contas são criadas pelo cadastro do site.</p>
            </div>
          </div>

          {feedback[resultado] && <p role="status" className={styles.feedback}>{feedback[resultado]}</p>}

          {patientsError ? (
            <p role="alert" className={styles.feedback}>Não foi possível carregar os pacientes. Aplique a migration deste card antes de testar a tela.</p>
          ) : (
            <PatientManager key={`${resultado ?? ""}:${Date.now()}`} patients={patients || []} today={today} />
          )}
        </div>
      </main>
    </StaffShell>
  );
}
