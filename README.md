# Sistema de Agendamento de Consultas Médicas

O **AgendaSaúde** é um projeto acadêmico desenvolvido na disciplina de Programação Web.

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

### Público principal

Pacientes que desejam pesquisar profissionais, agendar consultas e acompanhar seus atendimentos.

### Públicos futuros

Em versões futuras, o sistema poderá atender também:

- Médicos;
- Recepcionistas;
- Clínicas;
- Consultórios médicos;
- Administradores.

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

O MVP tem como objetivo entregar uma aplicação visual, navegável e funcional para demonstrar o fluxo principal do paciente.

Nesta etapa, os dados são simulados e armazenados no navegador por meio do `localStorage` e `sessionStorage`.

## Funcionalidades implementadas

- Home pública;
- Detalhes das especialidades;
- Cadastro de pacientes;
- Login e recuperação simulada de senha;
- Opção “Lembrar de mim”;
- Proteção das páginas privadas;
- Dashboard do paciente;
- Indicadores de consultas;
- Visualização da próxima consulta;
- Listagem de especialidades;
- Listagem de profissionais;
- Escolha de data e horário;
- Identificação de horários indisponíveis;
- Prevenção de conflitos entre consultas;
- Confirmação do agendamento;
- Visualização dos agendamentos;
- Separação por status;
- Cancelamento de consultas;
- Remarcação de consultas;
- Atualização automática para consulta concluída;
- Sistema de notificações;
- Perfil do paciente;
- Encerramento da sessão.

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
| RN10 | O CPF deve possuir onze números. |
| RN11 | A senha deve possuir pelo menos seis caracteres. |
| RN12 | A data de nascimento não pode estar no futuro. |

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
| Next.js 16.3.5 | Organização das rotas, páginas e estrutura principal da aplicação. |
| Node.js e npm | Execução do ambiente e gerenciamento das dependências. |
| LocalStorage | Armazenamento simulado dos dados do MVP. |
| SessionStorage | Controle simulado de sessões temporárias. |
| Git | Controle de versão local. |
| GitHub | Armazenamento, histórico e colaboração da equipe. |
| Figma Make | Criação e validação do protótipo navegável. |
| PraxiLab | Organização do Kanban, backlog, responsáveis e prazos. |

## Arquitetura inicial

O projeto utiliza a estrutura do Next.js com App Router.

```text
src/
├── app/
│   ├── page.js
│   ├── dashboard/
│   ├── login/
│   ├── cadastro/
│   ├── agendar/
│   ├── agendamentos/
│   ├── confirmacao/
│   ├── perfil/
│   ├── layout.js
│   └── globals.css
└── components/
    ├── AuthGuard.js
    ├── DashboardData.js
    ├── Navbar.js
    └── UserMenu.js
```

### Responsabilidades principais

- `app/page.js`: Home pública;
- `app/dashboard`: painel do paciente;
- `app/login`: autenticação simulada;
- `app/cadastro`: cadastro do paciente;
- `app/agendar`: agendamento e remarcação;
- `app/agendamentos`: gerenciamento das consultas;
- `app/confirmacao`: confirmação do agendamento;
- `app/perfil`: dados do paciente;
- `components/AuthGuard.js`: proteção das rotas;
- `components/DashboardData.js`: indicadores do Dashboard;
- `components/UserMenu.js`: usuário, notificações e saída da conta.

## Armazenamento dos dados

Nesta etapa, o projeto utiliza dados simulados no navegador.

São armazenados:

- Dados do usuário;
- Informações do Perfil;
- Consultas;
- Status dos agendamentos;
- Sessão de acesso.


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
* **Contato da equipe:** [prgweb.sh@gmail.com](prgweb.sh@gmail.com)
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

### Pré-requisitos

- Node.js instalado;
- Git instalado;
- Visual Studio Code ou outro editor.

### Clonar o repositório

```bash
git clone https://github.com/Art455hur/sistemas_agendamento_consultas_medicas.git
```

### Entrar na pasta

```bash
cd sistemas_agendamento_consultas_medicas
```

### Instalar as dependências

```bash
npm install
```

No PowerShell, caso o comando `npm` seja bloqueado:

```powershell
npm.cmd install
```

### Executar o projeto

```bash
npm run dev
```

No PowerShell:

```powershell
npm.cmd run dev
```

### Abrir no navegador

```text
http://localhost:3000
```

## Integrantes

- Sandro Alexandre Abati;
- Railson dos Santos Rufino - UX e Prototipação, revisão e melhoria da aplicação e Apoio em Requisitos e Documentação;
- Luiz Fernando Testzlaff - Desenvolvedor Front-end, responsável pela implementação inicial das páginas e componentes;
- Brício Rocha Borges de Almeida;
- Arthur Araujo dos Santos Coelho;
- Ian Hebert Freitas Moreira.


## Situação atual

- Landing page institucional da NexTech Soluções publicada;
- Links públicos do protótipo, da landing page e do repositório adicionados.

O MVP visual está navegável e possui os principais fluxos do paciente.

Já foram implementados:

- Home pública;
- Cadastro e Login simulados;
- Dashboard;
- Agendamento e confirmação;
- Cancelamento e remarcação;
- Gerenciamento das consultas;
- Notificações;
- Perfil;
- Proteção das rotas;
- Integração entre as páginas.

## Próximos passos

- Manter a documentação do projeto atualizada;
- Registrar os papéis da equipe;
- Concluir os cards e checklists;
- Realizar testes de usabilidade;
- Realizar testes de integração;
- Revisar o código;
- Preparar a apresentação;
- Planejar banco de dados e API;
- Implementar autenticação real com JWT em uma etapa futura.

## Referências

As seguintes plataformas foram utilizadas como referência para estudar fluxos e organização das informações:

- [Hospital Samar](https://hospitalsamar.com.br/)
- [MedPrev](https://agendamento.medprev.online/)