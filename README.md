# Sistema de Agendamento de Consultas Médicas

O **AgendaSaúde** é um projeto acadêmico desenvolvido na disciplina de Programação Web.

> **N2 — atualização do GitHub em 27/11/2026:** a `main` reúne os painéis da secretaria e do médico, o login unificado (PRs #48–#50) e os ajustes de interface móvel e mensagens de confirmação/recuperação da [PR #55](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/55). As PRs #52–#54 registraram ensaio local, avaliação dos avisos de segurança e roteiro de apresentação. A conferência de Vercel READY, 22 migrações aplicadas e [GitHub Actions aprovado](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/45751679524) corresponde ao commit anterior `80e52b2`, em 26/11; o deploy após a PR #55 não foi reconferido nesta atualização. Os fluxos com Auth real e entrega de e-mails ainda exigem validação no site publicado. Consulte a [documentação técnica](docs/documentacao-tecnica.md) e a [conferência de publicação](docs/publicacao-n2.md).

A aplicação tem como objetivo facilitar o acesso a profissionais da saúde, permitindo que pacientes consultem especialidades, escolham horários e gerenciem seus agendamentos em uma interface simples e navegável.

## Problema

Pacientes podem enfrentar dificuldades para:

- Encontrar profissionais disponíveis;
- Consultar especialidades e horários;
- Evitar conflitos entre agendamentos;
- Organizar consultas futuras;
- Cancelar ou remarcar atendimentos;
- Acompanhar o histórico de consultas.

Essas dificuldades podem tornar o processo demorado, confuso e dependente de atendimento por telefone ou presencial.

## Público-alvo

O fluxo principal atende pacientes. A N2 também inclui a gestão administrativa e painéis próprios para médico e secretaria. O banco atual considera um único estabelecimento: **Hospital Sapiens**.

## Proposta de solução

Desenvolver uma aplicação web que permita ao paciente:

- Conhecer as especialidades disponíveis;
- Visualizar profissionais;
- Consultar datas e horários;
- Agendar uma consulta;
- Cancelar ou remarcar atendimentos;
- Acompanhar consultas próximas, concluídas e canceladas;
- Receber notificações;
- Atualizar seus dados pessoais.

## Objetivo do MVP

A N1 entregou um fluxo visual navegável do paciente, com dados simulados no navegador. A N2 acrescenta persistência e autorização com Supabase, mantendo o modo de demonstração para desenvolvimento.

| Modo | Ativação | Armazenamento |
| --- | --- | --- |
| Demonstração | Padrão, com Auth desligada | `localStorage` e `sessionStorage`; sem isolamento seguro entre contas reais |
| Supabase | Flag `true`, URL e chave publicável configuradas | Supabase Auth, perfis e consultas no banco; autorização no servidor e por RLS |

Os dados locais não são importados automaticamente. Código integrado à `main` não comprova que a funcionalidade foi liberada no site publicado.

## Funcionalidades implementadas

| Área | Implementação disponível na N2 |
| --- | --- |
| Páginas públicas | Home e apresentação das especialidades |
| Autenticação | Cadastro e recuperação de acesso com Supabase; login unificado para paciente, médico, secretaria e administrador, com direcionamento e logout por perfil; modo simulado preservado |
| Consultas | Agendamento, confirmação, listagem, cancelamento e remarcação das próprias consultas |
| Disponibilidade | Catálogo de médicos ativos, grade padrão com personalização por médico e dia e atualização dos horários ao retornar à aba ou acionar o botão |
| Conflitos | Proteção no banco contra duas consultas ativas do mesmo médico ou paciente no mesmo instante |
| Dashboard e notificações | Indicadores e avisos individuais de consultas futuras/canceladas, com links e atualização após alterações |
| Perfil | Leitura e edição de nome, telefone, CPF e nascimento no Supabase; e-mail de acesso somente leitura |
| Administração | Painel restrito a administrador ativo, gestão de funcionários, CRUD de especialidades, gestão de pacientes, leitura diária da agenda, criação/remarcação/cancelamento de consultas futuras, busca/filtros de profissionais e horários por médico/dia |
| Secretaria | Painel com agenda diária e filtros, agendamento, remarcação com horários disponíveis e cancelamento com confirmação |
| Médico | Painel com agenda por data, registro de atendimentos, histórico clínico e arquivos de exames |
| Acesso por perfil | Login único com redirecionamento ao painel permitido e proteção contra acesso a painéis de outros perfis |
| Interface móvel | Menu do paciente recolhível por botão, com fechamento pela tela ou tecla Esc; ajustes de largura e cabeçalho no painel administrativo (PR #55) |
| Confirmação e recuperação | Mensagens diferentes para falha de confirmação e de redefinição de senha; retorno “Voltar ao início” da confirmação de consulta direcionado ao dashboard (PR #55) |
| Banco e testes | 22 migrações versionadas na `main` e 22 aplicadas no Supabase em 26/11/2026 |
| Validação automática | GitHub Actions executa instalação pelo lockfile, testes, build e Playwright em desktop/celular emulado nos PRs e pushes na main, sem acessar o banco hospedado |

A gestão de funcionários exige contas previamente existentes no Supabase Auth. Não cria contas Auth nem concede papel de administrador. Notificações na interface não representam envio de e-mail, SMS ou push.

Veja [limites, permissões e critérios de validação](docs/documentacao-tecnica.md).

## Requisitos funcionais

| Código | Requisito |
|---|---|
| RF01 | O sistema deve permitir o cadastro do paciente. |
| RF02 | O sistema deve permitir o Login com e-mail e senha. |
| RF03 | O sistema deve apresentar as especialidades disponíveis. |
| RF04 | O sistema deve apresentar os profissionais disponíveis. |
| RF05 | O sistema deve permitir selecionar data e horário. |
| RF06 | O sistema deve permitir agendar uma consulta. |
| RF07 | O sistema deve impedir conflitos de horário. |
| RF08 | O sistema deve permitir cancelar consultas ativas. |
| RF09 | O sistema deve permitir remarcar consultas ativas. |
| RF10 | O sistema deve separar consultas por status. |
| RF11 | O sistema deve apresentar notificações ao paciente. |
| RF12 | O sistema deve permitir atualizar o Perfil. |
| RF13 | O sistema deve proteger as páginas privadas. |
| RF14 | O sistema deve permitir encerrar a sessão. |

## Requisitos não funcionais

| Código | Requisito |
|---|---|
| RNF01 | A interface deve ser simples e de fácil compreensão. |
| RNF02 | A navegação deve manter uma identidade visual consistente. |
| RNF03 | O sistema deve apresentar mensagens claras de erro e sucesso. |
| RNF04 | O código deve ser organizado em páginas e componentes reutilizáveis. |
| RNF05 | A aplicação deve funcionar em navegadores modernos. |
| RNF06 | O projeto deve utilizar Git e GitHub para controle de versão. |
| RNF07 | As funcionalidades devem seguir o protótipo aprovado pela equipe. |

## Regras de negócio

| Código | Regra |
|---|---|
| RN01 | Somente usuários cadastrados podem realizar Login. |
| RN02 | Somente usuários autenticados podem acessar páginas privadas. |
| RN03 | A consulta deve possuir especialidade, profissional, data e horário. |
| RN04 | Não é permitido agendar consultas em datas ou horários passados. |
| RN05 | Não é permitido manter duas consultas ativas no mesmo horário. |
| RN06 | Apenas consultas ativas podem ser canceladas ou remarcadas. |
| RN07 | A remarcação deve atualizar a consulta original. |
| RN08 | Na remarcação, somente data e horário podem ser alterados. |
| RN09 | Consultas passadas devem ser marcadas como concluídas. |
| RN10 | Nos formulários de cadastro e perfil, o CPF deve possuir onze números, dígitos verificadores corretos e não pode ser uma sequência de números iguais. |
| RN11 | A senha deve possuir pelo menos seis caracteres. |
| RN12 | A data de nascimento não pode estar no futuro. |
| RN13 | No cadastro e perfil, o nome do paciente deve ter de 3 a 120 caracteres, desconsiderando espaços no início e no fim. |

## Histórias de usuário

### HU01 — Cadastro

Como paciente, quero criar uma conta para utilizar as funcionalidades privadas da plataforma.

### HU02 — Agendamento

Como paciente, quero escolher especialidade, profissional, data e horário para marcar uma consulta.

### HU03 — Acompanhamento

Como paciente, quero visualizar minhas consultas para acompanhar os atendimentos agendados.

### HU04 — Cancelamento

Como paciente, quero cancelar uma consulta ativa quando não puder comparecer.

### HU05 — Remarcação

Como paciente, quero alterar a data e o horário de uma consulta sem criar outro agendamento.

### HU06 — Perfil

Como paciente, quero consultar e atualizar meus dados pessoais para manter minhas informações corretas.

## Critérios gerais de aceitação

- Os campos obrigatórios devem ser validados;
- Dados inválidos devem apresentar mensagens claras;
- Usuários sem sessão devem ser direcionados ao Login;
- O horário escolhido deve estar disponível;
- O agendamento deve aparecer em Meus Agendamentos;
- O cancelamento deve atualizar o status da consulta;
- A remarcação deve alterar a consulta original;
- As informações atualizadas no Perfil devem aparecer nos menus;
- O botão Sair deve encerrar a sessão.

## Tecnologias utilizadas

| Tecnologia | Utilização e justificativa |
|---|---|
| HTML e JSX | Estrutura e conteúdo das páginas e componentes. |
| CSS | Estilização, identidade visual e organização das telas. |
| JavaScript | Regras, validações e interatividade. |
| React | Criação de componentes reutilizáveis e gerenciamento de estado. |
| Next.js 16.4.6 (lockfile) | Organização das rotas, páginas e estrutura principal da aplicação. |
| Node.js e npm | Execução do ambiente e gerenciamento das dependências. |
| Supabase Auth | Autenticação real quando habilitada em ambiente configurado. |
| PostgreSQL / Supabase | Persistência, funções SQL e políticas RLS da N2. |
| PGlite / Node Test Runner | Testes automatizados com banco descartável. |
| LocalStorage | Armazenamento simulado dos dados do MVP. |
| SessionStorage | Controle simulado de sessões temporárias. |
| Git | Controle de versão local. |
| GitHub | Armazenamento, histórico e colaboração da equipe. |
| Figma Make | Criação e validação do protótipo navegável. |
| PraxiLab | Organização do Kanban, backlog, responsáveis e prazos. |

## Arquitetura do projeto

O Next.js usa App Router e módulos por funcionalidade. Consulte o
[guia de arquitetura](docs/arquitetura.md) para caminhos, dependências,
compatibilidade com branches existentes e orientação para novos cards.

| Caminho | Responsabilidade |
| --- | --- |
| `src/app` | Rotas, páginas, layouts e ações no servidor |
| `src/features/auth` | Proteção visual e regras de acesso |
| `src/features/appointments` | Serviços, hook, formatação e indicadores de consultas |
| `src/features/profile` | Serviço do perfil do paciente |
| `src/components/navigation` | Menus compartilhados |
| `src/shared/validation` | Validações puras reutilizáveis |
| `src/lib/supabase` | Clientes de navegador e servidor |
| `src/proxy.js` | Sessão e redirecionamento no servidor |
| `supabase/migrations`, `tests`, `docs` | Histórico SQL, validação e documentação |
| `landing-nextech` | Aplicação institucional independente |

Os caminhos antigos dos módulos e componentes continuam como reexports de
compatibilidade para reduzir conflitos com o trabalho paralelo da equipe.

## Armazenamento dos dados

Com Supabase habilitado, `profiles` guarda dados cadastrais e papéis; `appointments` guarda consultas; `hospital` e `hospital_staff` representam o hospital e seus vínculos; `specialties` mantém o catálogo administrável de especialidades. As contas e credenciais são gerenciadas pelo Supabase Auth.

Com a flag desligada, os fluxos simulados continuam usando o navegador. Não utilizar esse modo para dados reais de pacientes. A edição do perfil já foi integrada ao banco; não há importação automática de cadastros e consultas locais.

## Protótipo

O protótipo foi desenvolvido no Figma Make e apresenta o fluxo completo do paciente.

### Projeto no Figma

[Visualizar projeto no Figma](https://www.figma.com/make/g3WjcN1nALBsvfIhpLZsVb/Sistema-de-Agendamento-M%C3%A9dico-v2?t=xFoMyMTe26hyE9HX-20&fullscreen=1)

### Protótipo publicado

[Acessar o protótipo navegável](https://wake-hut-89531713.figma.site)

O protótipo possui acesso público e não exige senha.

## NexTech Soluções

A **NexTech Soluções** é a software house responsável pelo desenvolvimento acadêmico do AgendaSaúde.

A landing page institucional apresenta a identidade visual da equipe, os serviços oferecidos, os integrantes e o projeto desenvolvido.

* **Landing page:** [Acessar NexTech Soluções](https://alert-author-78887172.figma.site)
* **Contato da equipe:** [prgweb.sh@gmail.com](mailto:prgweb.sh@gmail.com)
* **Repositório:** [AgendaSaúde no GitHub](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas)


## Organização do projeto

A equipe utiliza Scrum e Kanban para organizar as atividades.

O quadro possui as etapas:

```text
Backlog → A Fazer → Em Andamento → Revisão → Concluído
```

Cada card deve possuir:

- Descrição;
- Responsável;
- Prioridade;
- Prazo;
- Checklist;
- Critério de conclusão;
- Link ou evidência da entrega.

## Como executar o projeto

Use Node.js compatível com as dependências do projeto e npm. A partir de uma conta com acesso ao repositório:

```bash
git clone https://github.com/Art455hur/sistemas_agendamento_consultas_medicas.git
cd sistemas_agendamento_consultas_medicas
npm ci
npm run dev
```

Abra `http://localhost:3000`. No PowerShell, se `npm` estiver bloqueado, use `npm.cmd ci` e `npm.cmd run dev`.

O modo de demonstração funciona com a autenticação real desligada. Para testar Supabase, copie `.env.example` para `.env.local` e siga [o guia de configuração](docs/autenticacao-supabase.md). Em 20/11/2026 a flag de Auth foi registrada como habilitada na produção; em 26/11 as três variáveis necessárias continuavam cadastradas, mas seus valores não foram reavaliados. Isso não conclui os testes de contas, e-mails e permissões; mudanças de configuração devem ser combinadas com a equipe.

```bash
npm test
npm run build
```

Os testes automatizados usam dados fictícios e banco descartável; não acessam o Supabase hospedado. O teste opcional com duas conexões está em [conflitos de horários](docs/conflitos-horarios.md).

A revisão de 13/11/2026 registrou 104 testes na base `c158029`; a [PR #44](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/44) registrou 128 testes aprovados e foi integrada posteriormente. Em 26/11, o [workflow da `main` no commit `80e52b2`](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/45751679524) passou nas etapas de testes Node/PGlite, build e Playwright para desktop e celular emulado. A automação usa Auth desligado, banco descartável e não comprova autenticação, e-mails ou operações reais de produção. Nenhum teste foi reexecutado nesta atualização documental. Consulte a [revisão dos testes, contribuições e pendências](docs/revisao-testes-funcionalidades.md) e o [guia de ponta a ponta](docs/testes-ponta-a-ponta.md).

## Documentação técnica

- [Guia técnico e estado da N2](docs/documentacao-tecnica.md)
- [Revisão dos testes, contribuições e pendências](docs/revisao-testes-funcionalidades.md)
- [Testes de navegador no modo de demonstração](docs/testes-ponta-a-ponta.md)
- [Integração entre cadastro e perfil](docs/testes-integracao-paciente.md)
- [Refatoração de código e componentes](docs/refatoracao-componentes.md)
- [Notificações integradas aos agendamentos](docs/notificacoes-agendamentos.md)
- [Validação do CPF e dados fictícios para testes](docs/validacao-cpf.md)
- [Validação compartilhada do nome do paciente](docs/validacao-nome.md)
- [Autenticação e configuração](docs/autenticacao-supabase.md)
- [Perfis e permissões](docs/perfis-e-permissoes.md)
- [Consultas e perfil do paciente](docs/consultas-supabase.md)
- [Painel administrativo](docs/painel-administrador.md)
- [Gestão de funcionários](docs/gestao-funcionarios.md)
- [CRUD de especialidades](docs/especialidades.md)
- [Conflitos e teste de concorrência](docs/conflitos-horarios.md)
- [Evidências do ensaio local dos quatro perfis (26/11)](docs/evidencias-ensaio-local-26nov.md)
- [Avaliação dos avisos de segurança do Supabase](docs/reforco-seguranca.md)
- [Roteiro atualizado de demonstração](docs/roteiro-demonstracao-n2.md)
- [Modelagem inicial e evolução](docs/modelagem-inicial-n2.md)
- [Hospital e vínculos](docs/vinculos-hospital.md)

## Integrantes

- Sandro Alexandre Abati - Scrum Master, facilita o processo, acompanha impedimentos e ajuda a organizar a equipe;
- Railson dos Santos Rufino - UX e Prototipação, revisão e melhoria da aplicação e Apoio em Requisitos e Documentação;
- Luiz Fernando Testzlaff - Desenvolvedor Front-end, responsável pela implementação inicial das páginas e componentes;
- Brício Rocha Borges de Almeida  - Responsável por Qualidade e Testes, planeja testes, registra erros e acompanha correções;
- Arthur Araujo dos Santos Coelho - Analista de Requisitos, documenta necessidades, regras de negócio e critérios de aceitação;
- Ian Hebert Freitas Moreira - Product owner e Desenvolvedor back-end, Representa as necessidades do produto e ajuda a priorizar as funcionalidades.


## Situação atual

A N1 entregou o protótipo e os fluxos simulados do paciente. Na N2, a `main` inclui persistência de perfis e consultas, painel administrativo, painéis próprios de secretaria e médico e login unificado (PRs [#48](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/48), [#49](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/49) e [#50](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/50)). Depois foram integrados os ajustes de layout no celular, de navegação e de mensagens de confirmação e recuperação ([PR #55](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/55)).

Em 26/11/2026, as publicações de produção da aplicação e da landing institucional estavam READY no commit `80e52b2` (anterior à PR #55), e o endereço principal da aplicação respondeu HTTP 200. As 22 migrações do repositório constavam como aplicadas no Supabase. O GitHub Actions passou, mas os testes de navegador nele executados usam o modo de demonstração; não há validação completa dos quatro perfis com Auth real no site publicado.

## Próximos passos

- Testar com contas fictícias os fluxos reais de paciente, administrador, médico e secretaria, incluindo restrições por papel, logout, agendamento, remarcação, cancelamento, atendimento e anexos de exames.
- Verificar a entrega dos e-mails de confirmação e recuperação de senha no domínio publicado, inclusive as novas mensagens de erro quando o link é aberto em outro navegador.
- Conferir no celular físico e no site publicado o menu recolhível do paciente, o botão Sair, a largura do painel de administração e o retorno para o dashboard após confirmar uma consulta (PR #55).
- Revisar os avisos de segurança do Supabase: funções administrativas privilegiadas executáveis por `authenticated`, três tabelas com RLS sem políticas e proteção contra senhas vazadas desabilitada; os alertas não comprovam exploração.
- Conferir o restante do backlog, como grade semanal recorrente, módulo de serviços e validações adicionais, antes de declará-los como entregues.
- Registrar evidências, revisões de PRs por outros integrantes e atualização dos cards no PraxiLab. Não considerar os testes automáticos como validação de todos os critérios de aceitação.
- Atualizar a documentação afetada por cada mudança de comportamento, banco ou configuração.

## Referências

As seguintes plataformas foram utilizadas como referência para estudar fluxos e organização das informações:

- [Hospital Samar](https://hospitalsamar.com.br/)
- [MedPrev](https://agendamento.medprev.online/)

