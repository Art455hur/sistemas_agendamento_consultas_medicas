import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Sistema de Agendamento Médico</h1>

      <p>
        Agende suas consultas médicas de forma rápida,
        simples e segura.
      </p>

      <h2>Bem-vindo!</h2>

      <p>
        Escolha uma das opções abaixo para continuar:
      </p>

      <div className="menu-principal">
        <Link href="/login">
          <button>Entrar</button>
        </Link>

        <Link href="/cadastro">
          <button>Criar cadastro</button>
        </Link>

        <Link href="/agendar">
          <button>Agendar consulta</button>
        </Link>

        <Link href="/agendamentos">
          <button>Meus agendamentos</button>
        </Link>
      </div>
    </main>
  );
}