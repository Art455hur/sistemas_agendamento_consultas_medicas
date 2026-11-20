# Testes de ponta a ponta

## Escopo desta entrega

Os testes de navegador cobrem os caminhos principais da demonstração local do
AgendaSaúde: página inicial, consulta de especialidade, navegação para cadastro e
login, validações dos formulários e entrada com um usuário de demonstração.
A PR #36 acrescentou rejeição de nomes inválidos e edição do perfil local com
persistência após recarregar a página. A base `c158029` contém 13 cenários. A configuração atual executa esses mesmos
cenários e uma regressão do cabeçalho em tela estreita nos projetos `desktop`
e `celular` (Pixel 5 emulado no Chromium), totalizando 14 cenários e 28
execuções. Isso não representa 28 cenários novos nem teste em aparelho físico.

Consulte a [revisão de 13/11/2026](revisao-testes-funcionalidades.md) para autoria,
resultados e pendências. A existência dos cenários não indica que todos foram
executados nesta revisão: a execução naquela revisão foi bloqueada ao iniciar o navegador.

Os cenários usam dados fictícios no navegador local. Eles não acessam o projeto
Supabase compartilhado, não criam contas reais e não substituem a revisão de
RLS ou os testes do fluxo autenticado. A flag de Auth fica desligada durante a
execução.

## Critérios de conclusão

- Os caminhos testados abrem sem erros de interface;
- A modal de especialidade abre e pode ser fechada;
- Cadastro e login mostram mensagens coerentes para entradas inválidas;
- Um paciente fictício consegue percorrer cadastro e login no modo local;
- Nenhuma chave ou arquivo `.env.local` é necessário para executar a suíte.

## Instalação e execução

Na raiz do repositório, instale as dependências e o Chromium usado pela suíte:

```bash
npm ci
npm run test:e2e:install
```

Execute os testes de navegador e, se precisar, abra o relatório HTML:

```bash
npm run test:e2e
npm run test:e2e:report
```

O lançador escolhe uma porta local livre, inicia o Next em modo de desenvolvimento
e o encerra ao final. Com `E2E_SERVER_MODE=production`, usa `next start` sobre
um build existente. Esse build precisa ter sido compilado com Auth desligada
e sem as variáveis públicas do Supabase, como faz o workflow; mudar apenas
as variáveis de execução não substitui as variáveis incorporadas no build. A suíte bloqueia requisições externas, força a autenticação
Supabase a ficar desligada e não reutiliza outro servidor local.

No PowerShell, use `npm.cmd` se a política do terminal bloquear `npm`.

## Limites da validação

Esta suíte confirma os caminhos de interface do modo de demonstração. Ela não
comprova o fluxo real de Supabase Auth, confirmação e recuperação de e-mail,
isolamento entre usuários por RLS nem o comportamento da versão publicada.
Essas verificações continuam exigindo um ambiente de teste controlado e não
devem ser feitas ativando Auth na Vercel de produção.

## Execução automática no GitHub

O workflow **Testes e build** executa a suíte após os testes Node/PGlite e o
build de demonstração. Instala o Chromium com suas dependências e inicia o
build local em porta livre. Usa dois workers e uma nova tentativa para falhas.
Uma falha persistente reprova o job, sem ignorar o resultado dos testes.

Na execução do Actions, baixe o artefato **testes-navegador** para consultar o
relatório HTML. Falhas incluem captura de tela e trace para investigação. Os
arquivos ficam disponíveis por sete dias e contêm somente os dados fictícios
da demonstração. Não inclua credenciais reais nos cenários.

Para executar somente uma resolução localmente:

```bash
npm run test:e2e -- --project=desktop
npm run test:e2e -- --project=celular
```

A execução no tamanho de celular verifica os mesmos fluxos de interação;
não é uma auditoria visual completa de responsividade ou acessibilidade.
A automação foi acrescentada por Sandro e preserva os cenários de Ian e Arthur.

A primeira execução automática identificou o botão **Entrar** oculto abaixo
de 800 px. A correção mantém login e cadastro visíveis, permite quebra do
cabeçalho e acrescenta uma regressão em 320 px para evitar corte dos botões.
