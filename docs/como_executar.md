
# Como executar o projeto

## Requisitos

- Node.js 24 LTS.
- MySQL Server 8.0 instalado e em execução.
- MySQL Workbench para executar o SQL.

## 1. Criar o banco

No MySQL Workbench, abra o arquivo `docs/banco.sql`
e execute seu conteúdo em um banco novo.

## 2. Instalar as dependências

Abra um terminal na pasta que contém `package.json` e execute:

```powershell
npm install
```

## 3. Configurar a conexão

Copie `.env.example` para um novo arquivo chamado `.env.local`,
na pasta principal do projeto.

Preencha `DB_USER` e `DB_PASSWORD` com as credenciais
do MySQL do seu computador.

Para gerar a chave da sessão, execute:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado no valor de `SESSION_SECRET` no `.env.local`.

Não envie `.env.local` ao GitHub.

## 4. Iniciar o site

```powershell
npm run dev
```

Abra no navegador:

http://localhost:3000/cadastro

## 5. Testar

1. Cadastre uma conta como Paciente ou Médico.
2. Acesse `/login` e entre com os dados cadastrados.
3. Acesse `/conta` e confira seus dados.
4. Atualize a página para verificar a sessão.
5. Clique em Sair.
6. Acesse `/conta` novamente: deve voltar ao login.

As senhas são armazenadas como hash.
Cada computador usa seu próprio banco de dados.

## Funcionalidades integradas

- Cadastro de usuários.
- Login com e-mail e senha.
- Sessão com duração de duas horas.
- Página Minha conta protegida.
- Encerramento da sessão pelo botão Sair.

As páginas de agendamentos ainda precisam de integração
e verificações de acesso.