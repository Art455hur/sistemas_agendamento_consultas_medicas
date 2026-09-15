import Link from "next/link";

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-left">
        <div className="login-logo">
          <span className="logo-icon">+</span>
          <strong>AgendaSaúde</strong>
        </div>

        <div className="login-presentation">
          <h1>
            Agendamentos simples e rápidos para cuidar
            melhor de você
          </h1>

          <p>
            Agende consultas com especialistas de forma fácil,
            sem filas e sem complicações.
          </p>

          <ul>
            <li>📅 Disponível 24 horas por dia</li>
            <li>🏥 Mais de 50 unidades conveniadas</li>
            <li>⭐ Mais de 300 especialistas cadastrados</li>
          </ul>
        </div>

        <p className="copyright">
          © 2026 AgendaSaúde - Todos os direitos reservados
        </p>
      </section>

      <section className="login-right">
        <div className="login-box">
          <h2>Bem-vindo de volta</h2>

          <p className="login-subtitle">
            Acesse sua conta para gerenciar suas consultas
          </p>

          <form>
            <label htmlFor="email">E-mail</label>

            <input
              type="email"
              id="email"
              placeholder="Digite seu e-mail"
            />

            <label htmlFor="senha">Senha</label>

            <input
              type="password"
              id="senha"
              placeholder="Digite sua senha"
            />

            <div className="login-options">
              <label>
                <input type="checkbox" />
                Lembrar de mim
              </label>

              <a href="#">Esqueci minha senha</a>
            </div>

            <button type="submit" className="login-button">
              Entrar
            </button>
          </form>

          <p className="create-account">
            Ainda não tem conta?{" "}
            <Link href="/cadastro">
              Criar uma conta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}