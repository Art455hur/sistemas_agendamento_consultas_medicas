# Arquitetura do AgendaSaúde

## Objetivo

Organizar o Next.js por responsabilidade e funcionalidade, permitindo que cada
card tenha um lugar previsível sem misturar rotas, regras e infraestrutura.
Esta reorganização preserva comportamento, URLs, estilos e o modo de demonstração.

## Mapa de responsabilidades

| Caminho | Responsabilidade |
| --- | --- |
| `src/app` | Entradas do App Router: páginas, layouts, callback e server actions |
| `src/features/auth/access-control.js` | Papéis e permissões de navegação |
| `src/features/auth/components` | Proteção visual de sessão (`AuthGuard`) |
| `src/features/appointments/services` | Operações de consultas, catálogo e horários; seleção entre dados locais e Supabase |
| `src/features/appointments/hooks` | Estado React, carregamento e atualização das consultas |
| `src/features/appointments/components` | Apresentação dos indicadores de consultas (`DashboardData`) |
| `src/features/appointments/appointment-format.js` | Conversão de registros, fuso e mensagens de erro |
| `src/features/profile/services` | Leitura, validação e atualização do próprio perfil |
| `src/components/navigation` | Menus compartilhados entre páginas |
| `src/shared/validation` | Validações puras reutilizáveis, como CPF |
| `src/lib/supabase` | Clientes de infraestrutura separados para navegador e servidor |
| `src/proxy.js` | Renovação de sessão e redirecionamento no servidor |
| `supabase/migrations` | Histórico SQL versionado |
| `tests` | Testes Node e banco descartável PGlite |
| `docs` | Decisões, configuração e roteiros de validação |
| `landing-nextech` | Aplicação institucional independente; não faz parte do build Next.js |

## Como escolher o lugar de uma mudança

1. Mantenha os arquivos especiais de rota em `src/app`. Componentes ou serviços
   novos específicos de uma funcionalidade entram em `src/features/<funcionalidade>`.
2. Coloque operações de dados em `services`, estado React em `hooks` e apresentação
   específica em `components` dentro do módulo. As páginas atuais ainda contêm UI;
   a separação pode avançar conforme os cards, sem reescrever todas as telas.
3. Use `src/components` para UI compartilhada e `src/shared` para código puro que
   não dependa de React, Next.js, navegador ou banco.
4. Mantenha clientes Supabase em `src/lib/supabase`. Não importe o cliente de
   servidor em um componente com `"use client"`. Não crie um barrel que reúna
   clientes de navegador e servidor.
5. Mantenha autorização no servidor e no banco. `AuthGuard` e regras de navegação
   não substituem RLS ou a verificação das ações administrativas.

Uma tela de consultas consome o hook ou serviço do módulo; o serviço usa os
clientes de infraestrutura. Validações puras não importam páginas ou serviços.
Os menus compartilhados consomem os serviços públicos dos módulos necessários.
Não importe páginas de `src/app` a partir de módulos, infraestrutura ou validações.

## Imports e compatibilidade

O alias `@/` aponta para `src/` por meio de `jsconfig.json`. Nas rotas, prefira
imports explícitos, por exemplo:

```js
import { getAppointments } from "@/features/appointments/services/appointments.js";
import { isValidCpf } from "@/shared/validation/cpf.js";
```

Nos módulos executados diretamente pelo Node e nos testes, use imports relativos
com extensão `.js`: o Node Test Runner não resolve automaticamente o alias do Next.
Os testes existentes já importam as implementações nos novos caminhos.

Os antigos arquivos em `src/lib` (consultas, hook, perfil, CPF e permissões) e os
antigos componentes exportam as implementações novas. São pontes temporárias para
branches de colegas que ainda usam os caminhos anteriores. Não duplique regras
nesses arquivos; novos consumidores devem usar os caminhos canônicos da tabela.
A remoção das pontes exige antes atualizar as branches e imports restantes da equipe.

## Fluxo de contribuição

```bash
git switch main
git pull origin main
git switch -c feat/meu-card
npm ci
npm run dev
```

Use a conta pessoal nos commits. Antes de abrir a PR, execute `npm test` e
`npm run build`. Os testes de banco usam PGlite descartável, sem executar migrações
no projeto Supabase compartilhado. O servidor de desenvolvimento abre na porta
3000 por padrão. A aplicação institucional tem configuração própria.

Abra uma PR e aguarde a revisão de outra pessoa antes do merge. Como vários
imports mudaram, incorpore a `main` atualizada à sua branch antes da revisão e
resolva os conflitos usando os caminhos canônicos acima.

Alterações de banco devem gerar uma nova migração em `supabase/migrations`,
incluída na PR; não reaplique a primeira. Avise o grupo antes de aplicar mudanças
no projeto compartilhado. Esta reorganização não exige migração.

## Configuração e limites

Mantenha `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH` desligada na Vercel até concluir a
substituição dos dados locais, a revisão de permissões e os testes do fluxo real.
Nunca versione `.env.local`, senhas ou chaves secretas. Consulte `.env.example` e
[o guia de autenticação](autenticacao-supabase.md) para configuração de teste.

Os arquivos HTML/CSS/JS de protótipo na raiz e a landing institucional foram
preservados: excluir ou mover esses materiais exige avaliar seus consumidores.
A divisão do serviço de consultas em adaptadores separados e a extração do
restante da UI das páginas podem ocorrer em cards próprios, com validação de
comportamento. Este card define a estrutura e migra os módulos já reutilizados.
