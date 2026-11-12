# Colocar o AgendaSaúde no Supabase e apresentar

Este projeto já tem uma branch de trabalho `codex/supabase-integration`. O Supabase conectado é `rgggijnypvvdkskyalip`, na região de São Paulo. O banco tem as migrations 1 a 5; a migration 5 foi recuperada do histórico do Supabase porque faltava no GitHub. A migration 6 adiciona CPF/data de nascimento ao perfil e usa o fuso `America/Sao_Paulo` para os horários.

## 1. Aplicar a migration no banco

O plano atual não permite branches de desenvolvimento do Supabase. Por isso, a migration 6 está salva no repositório, mas ainda não foi aplicada ao banco de produção. Quando estiver pronto para alterar esse banco, na pasta do projeto execute:

```powershell
npx supabase login
npx supabase link --project-ref rgggijnypvvdkskyalip
npx supabase db push --linked
```

Confira que a migration enviada é `20261112002810_perfil_paciente_e_fuso_sao_paulo.sql` e aceite a confirmação do CLI. Ela é aditiva: cria colunas, uma restrição de CPF único e ajusta as funções de horário. Os perfis e agendamentos atuais não são apagados. Não use `db reset` neste projeto.

## 2. Configurar a execução local

1. Copie `.env.example` para `.env.local`.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` com `https://rgggijnypvvdkskyalip.supabase.co`.
3. Em Supabase → Project Settings → API Keys, copie a chave **publishable** (`sb_publishable_...`) para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Deixe `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH=true`.
5. Instale e inicie o projeto:

```powershell
npm ci
npm run dev
```

Abra `http://localhost:3000`. Cadastros feitos no modo Supabase precisam confirmar o e-mail quando a confirmação de e-mail estiver habilitada no projeto.

## 3. Configurar os links de autenticação

Em Supabase → Authentication → URL Configuration, adicione aos Redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://sistemas-agendamento-consultas-medi.vercel.app/auth/callback`

O cadastro envia nome, telefone, CPF e nascimento como metadados de autenticação. A trigger salva esses dados em `public.profiles`; a role continua sendo definida pelo banco. As policies de RLS permitem que cada conta consulte e atualize apenas o próprio perfil. O CPF fica normalizado em 11 dígitos e é único.

## 4. Atualizar o site pela Vercel

No projeto da Vercel, configure as mesmas três variáveis de ambiente em **Preview** primeiro. O valor da chave publishable pode aparecer no navegador; não coloque aqui uma chave `secret` ou `service_role`. Depois de salvar, faça um novo deploy de Preview e confira o cadastro, login, agendamento, cancelamento e remarcação com uma conta de demonstração.

Para publicar na URL de produção, configure as variáveis também em **Production** e publique a branch principal depois da apresentação/revisão. Alterações nas variáveis exigem novo deploy para surtirem efeito.

## 5. GitHub

O trabalho é mantido na branch `codex/supabase-integration` para preservar a branch principal. Revise as alterações e abra um Pull Request para `main` quando quiser incorporá-las. A branch de trabalho não atualiza o site de produção; se a Vercel estiver conectada ao GitHub, ela poderá criar um Preview.

## O que falta para a demonstração online

- Aplicar a migration 6 no Supabase; a branch isolada foi bloqueada pelo plano Free.
- Cadastrar as variáveis acima na Vercel e fazer um novo deploy de Preview.
- Confirmar o e-mail da conta de demonstração e conferir que existem médicos ativos para selecionar.


