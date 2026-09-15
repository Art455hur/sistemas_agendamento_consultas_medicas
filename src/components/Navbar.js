import Link from "next/link";

export default function Navbar() {
  return (
    <nav>
      <Link href="/">
        Início
      </Link>

      {" | "}

      <Link href="/login">
        Login
      </Link>

      {" | "}

      <Link href="/cadastro">
        Cadastro
      </Link>

      {" | "}

      <Link href="/agendar">
        Agendar consulta
      </Link>

      {" | "}

      <Link href="/agendamentos">
        Meus agendamentos
      </Link>
    </nav>
  );
}