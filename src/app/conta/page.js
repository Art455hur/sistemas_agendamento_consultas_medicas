
import { redirect } from "next/navigation";
import db from "../../lib/db.js";
import {
  obterSessao,
  encerrarSessao,
} from "../../lib/session.js";

export default async function Conta() {
  const sessao = await obterSessao();

  if (!sessao) {
    redirect("/login");
  }

  const [usuarios] = await db.execute(
    "SELECT nome, email, funcao FROM usuarios WHERE email = ? LIMIT 1",
    [sessao.email]
  );

  const usuario = usuarios[0];

  if (!usuario) {
    redirect("/login");
  }

  async function sair() {
    "use server";

    await encerrarSessao();
    redirect("/login");
  }

  return (
    <main>
      <h1>Minha conta</h1>

      <p>Nome: {usuario.nome}</p>
      <p>E-mail: {usuario.email}</p>
      <p>Função: {usuario.funcao}</p>

      <form action={sair}>
        <button type="submit">Sair</button>
      </form>
    </main>
  );
}
