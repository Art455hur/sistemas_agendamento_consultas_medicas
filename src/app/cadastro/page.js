import Link from "next/link";

export default function Cadastro() {
  return (
    <main>
      <h1>Cadastro</h1>

      <form>
        <div>
          <label htmlFor="nome">Nome completo</label>
          <br />
          <input
            type="text"
            id="nome"
            placeholder="Digite seu nome"
          />
        </div>

        <br />

        <div>
          <label htmlFor="email">E-mail</label>
          <br />
          <input
            type="email"
            id="email"
            placeholder="Digite seu e-mail"
          />
        </div>

        <br />

        <div>
          <label htmlFor="senha">Senha</label>
          <br />
          <input
            type="password"
            id="senha"
            placeholder="Crie uma senha"
          />
        </div>

        <br />

        <div>
          <label htmlFor="confirmarSenha">
            Confirmar senha
          </label>
          <br />
          <input
            type="password"
            id="confirmarSenha"
            placeholder="Digite a senha novamente"
          />
        </div>

        <br />

        <button type="submit">
          Criar cadastro
        </button>
      </form>

      <br />

      <p>
        Já possui uma conta?
      </p>

      <Link href="/login">
        Fazer login
      </Link>
    </main>
  );
}