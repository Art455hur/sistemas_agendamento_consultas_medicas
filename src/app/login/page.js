import Link from "next/link";

export default function Login() {
  return (
    <main>
      <h1>Login</h1>

      <form>
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
            placeholder="Digite sua senha"
          />
        </div>

        <br />

        <button type="submit">
          Entrar
        </button>
      </form>

      <br />

      <p>
        Ainda não possui uma conta?
      </p>

      <Link href="/cadastro">
        Criar cadastro
      </Link>
    </main>
  );
}