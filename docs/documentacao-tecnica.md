# Documentação técnica — AgendaSaúde N2

Atualizada em 12/11/2026 com base nas entregas até a PR #17 e nos incrementos de validação do CPF na aplicação e no banco descritos neste guia.
Este guia descreve implementação e limites; não certifica o estado da Vercel ou do banco hospedado.

## Objetivo e modos de execução

O AgendaSaúde permite ao paciente agendar e acompanhar consultas. A N2 integra o
fluxo ao Supabase e acrescenta gestão de equipe para o Hospital Sapiens.

| Modo | Condição | Comportamento |
| --- | --- | --- |
| Demonstração | Flag diferente de `true` ou configuração incompleta | Fluxos simulados no navegador; administração indisponível |
| Supabase | Flag `true`, URL e chave publicável preenchidas | Auth real, consultas e perfis no banco, controle de acesso |

Não há importação automática de `localStorage`. Credenciais e sessões simuladas
não comprovam identidade no Supabase. O modo de demonstração não serve para uso real.

## Tecnologias e responsabilidades

Consulte também o [guia de arquitetura](arquitetura.md), que orienta onde
implementar novos cards e explica os reexports de compatibilidade.

| Componente | Responsabilidade |
| --- | --- |
| Next.js / React | Rotas, páginas e componentes |
| `src/proxy.js` | Atualização dos cookies da sessão e redirecionamento de visitante sem sessão |
| `src/features/auth/components/AuthGuard.js` | Verificação de acesso nas telas do paciente |
| `src/features/auth/access-control.js` | Nomes de papéis, permissões previstas e destinos; não substitui autorização no banco |
| `src/features/appointments/services/appointments.js` | Seleção do modo de dados, leitura e chamadas RPC de consultas |
| `src/features/appointments/appointment-format.js` | Conversão de dados, horário da clínica e mensagens de erro |
| `src/features/profile/services/patient-profile.js` | Valida dados e lê/atualiza o próprio perfil pela sessão |
| `src/lib/supabase/client.js` e `server.js` | Clientes Supabase no navegador e no servidor |
| `src/app/administracao/actions.js` | Ações administrativas no servidor que chamam RPCs autorizadas |
| `supabase/migrations` | Evolução do esquema, funções e políticas |
| `tests` | Verificações automatizadas com Node e PGlite |

A landing institucional em `landing-nextech` é uma aplicação independente.

## Rotas existentes

| Rota | Finalidade |
| --- | --- |
| `/` | Home pública e apresentação de especialidades |
| `/cadastro`, `/login` | Cadastro de paciente e entrada |
| `/auth/callback`, `/redefinir-senha` | Retorno de confirmação/recuperação e nova senha |
| `/dashboard` | Indicadores e próxima consulta do paciente |
| `/agendar` | Agendamento ou remarcação |
| `/agendamentos` | Lista e cancelamento de consultas |
| `/confirmacao` | Resultado do agendamento |
| `/perfil` | Dados do titular da conta |
| `/administracao` | Gestão de equipe e leitura diária da agenda para administrador com vínculo ativo |

`/medico` e `/secretaria` aparecem no planejamento de navegação, mas ainda não
têm páginas implementadas. Não considerar os painéis desses perfis concluídos.

## Configuração local

```bash
git clone https://github.com/Art455hur/sistemas_agendamento_consultas_medicas.git
cd sistemas_agendamento_consultas_medicas
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para desenvolvimento com Auth real, copie
`.env.example` para `.env.local` e preencha:

| Variável | Valor esperado |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto de desenvolvimento |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do mesmo projeto |
| `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH` | `false` para demonstração; `true` somente no ambiente de teste configurado |

Reinicie o servidor após alterar variáveis. Configure as URLs de confirmação e
recuperação conforme [autenticação](autenticacao-supabase.md). Não colocar
`.env.local`, senhas ou chaves secretas no Git. O navegador não precisa de `service_role`.

## Modelo de dados atual

| Tabela | Dados e relações principais |
| --- | --- |
| `auth.users` | Contas gerenciadas pelo Supabase Auth |
| `public.profiles` | `id` ligado a `auth.users`; papel, nome, telefone, CPF, nascimento e especialidade do profissional |
| `public.appointments` | Paciente e médico ligados a `profiles`; nome do médico preservado, especialidade, instante, motivo e status |
| `public.hospital` | Hospital Sapiens, ID fixo 1 |
| `public.hospital_staff` | Um vínculo por perfil; referência ao hospital e indicador `active` |
| `public.specialties` | Catálogo administrável de especialidades ativas/inativas |

O cadastro público cria perfil `patient` por trigger. CPF não nulo é único e deve
ter 11 números; nascimento não pode estar no futuro. O papel não é editável pelo
paciente. O CRUD de especialidades adiciona `public.specialties` e mantém `profiles.specialty`
como compatibilidade para médicos e `appointments.specialty` como histórico. A gestão
de disponibilidade continua pendente e a grade ainda é fixa.

O esquema `private` contém funções auxiliares e operações privilegiadas. Deve
permanecer fora dos esquemas expostos pela Data API.

## Migrações versionadas

Aplicar em ordem de versão somente as pendentes no ambiente de destino.

| Versão | Arquivo em `supabase/migrations` | Mudança |
| --- | --- | --- |
| `20261110185819` | `20261110185819_modelagem_inicial_n2.sql` | Perfis, consultas, trigger, RLS e conflito por médico |
| `20261111191220` | `20261111191220_20261111190359_vinculos_hospital.sql` | Hospital único e vínculos |
| `20261111205951` | `20261111205951_gestao_funcionarios_hospital.sql` | Operações administrativas de equipe |
| `20261111210414` | `20261111210414_bloquear_agenda_medico_inativo.sql` | Exige vínculo ativo do médico na leitura de consultas |
| `20261111213338` | `20261111213338_consultas_paciente.sql` | Catálogo, disponibilidade, operações de consultas e conflito por paciente |
| `20261112014111` | `20261112014111_perfil_paciente_e_fuso_sao_paulo.sql` | CPF, nascimento e fuso da clínica |
| `20261112025202` | `20261112025202_especialidade_funcionarios.sql` | Nome e especialidade na gestão da equipe |
| `20261112131100` | `20261112131100_reativar_funcionario.sql` | Reativação preservando dados |
| `20261112173011` | `20261112173011_validar_cpf_perfis.sql` | Validação matemática de CPF novo ou alterado, preservando o legado |
| `20261112182236` | `20261112182236_agenda_administrativa_leitura.sql` | Leitura limitada da agenda por administrador ativo |
| `20261112190336` | `20261112190336_crud_especialidades.sql` | CRUD administrativo de especialidades e integração com médicos |

As onze migrações acima constam no histórico do projeto compartilhado de testes. As versões `20261112182236` (agenda administrativa) e `20261112190336` (CRUD de especialidades) já foram aplicadas e testadas em 12/11/2026; não execute esses arquivos novamente nesse projeto.
Confira o histórico remoto antes de qualquer execução. Não reaplique arquivos já
registrados nem altere migrações antigas para introduzir novas mudanças. Mudanças
futuras devem entrar em nova migração e PR; avise a equipe antes de aplicá-las no
banco compartilhado. Esta atualização documental não executa SQL.

## Permissões implementadas

| Perfil | Acesso atual com Supabase habilitado | Limite |
| --- | --- | --- |
| Visitante | Páginas públicas e autenticação | Sem acesso aos dados privados |
| Paciente | Próprio perfil; ler, agendar, cancelar e remarcar suas consultas | Não altera papéis nem dados de outros pacientes |
| Médico ativo | Leitura das consultas em que é o médico, conforme RLS | Painel próprio pendente; desativação revoga essa leitura |
| Secretaria | Leitura do próprio perfil e vínculo | Agenda da clínica e painel próprios ainda pendentes |
| Administrador ativo | Painel, gestão da equipe e leitura da agenda da clínica por dia (após aplicar a nova migração) | Não cancela/remarca consultas; formulário não promove administradores |

RLS restringe linhas e grants restringem operações/colunas. As RPCs de equipe
validam administrador ativo no banco. A leitura administrativa da agenda também
exige esse vínculo e retorna apenas dados essenciais de médicos vinculados ao
Hospital Sapiens, inclusive históricos de médicos inativos. As RPCs de consultas validam a identidade
e o papel do paciente; não há escrita direta de consultas liberada ao cliente.
Ter um papel em `access-control.js` não concede automaticamente acesso à Data API.

## Fluxos e regras

### Consultas

O cliente valida a sessão, carrega médicos ativos com especialidade e consulta os
horários disponíveis. A confirmação só ocorre após a operação ser aceita no banco.

- RPCs: `booking_doctors`, `booking_slots`, `create_patient_appointment`,
  `reschedule_patient_appointment` e `cancel_patient_appointment`.
- Fuso da clínica: `America/Sao_Paulo` (Brasília), independente do aparelho.
- Grade: 08:00, 09:00, 10:30, 14:00 e 15:30, em qualquer dia.
- O banco rejeita passado, médico indisponível e conflito do médico ou paciente.
- A remarcação preserva o ID, profissional, especialidade e motivo.
- O cancelamento muda o status e libera o horário; não apaga o histórico.
- Índices únicos para status `scheduled` também protegem reservas concorrentes.
- Consultas passadas aparecem como concluídas pela regra de exibição, sem
  comprovar atendimento nem escrever no banco durante uma leitura.
- Dashboard e avisos na interface usam os agendamentos; não há envio de SMS,
  push ou e-mail de lembrete implementado nesse fluxo.

### Perfil

Nome, telefone, CPF e nascimento são lidos e gravados em `profiles` pelo ID da
sessão validada. E-mail vem do Auth e é somente leitura. Falha na leitura bloqueia
o salvamento; CPF duplicado apresenta erro. Cadastro, tela de perfil e serviço de
atualização usam `isValidCpf` para conferir formato e dígitos verificadores e
rejeitar números repetidos. O banco também valida os dígitos em inclusões e
alterações de CPF por trigger invoker, mantendo formato/unicidade. Um CPF inválido
antigo é preservado quando o número não muda; o formulário continua exigindo CPF
válido para salvar. Veja [limites e roteiro de teste](validacao-cpf.md).

### Equipe

Uma conta Auth precisa existir antes de ser vinculada. O administrador informa
e-mail, nome, função e, para médico, especialidade. Salvar cria/atualiza o vínculo;
o mesmo e-mail permite edição. Desativar/reativar preserva histórico e dados.
O formulário não cria contas Auth nem permite alterar administradores ou o próprio
papel. Contas com consultas não podem trocar de função.

## Verificação e publicação

```bash
npm test
npm run build
```

A PR #17 registra 41 testes aprovados e build concluído. Após a validação de CPF
na aplicação e no banco, `npm test` foi executado com 52 testes aprovados. A mudança
de banco também foi verificada no projeto hospedado com transação revertida. PGlite aplica as migrações em
banco descartável para testar persistência, isolamento e regras. A concorrência
com duas conexões usa um script opcional descrito em [conflitos](conflitos-horarios.md).

Antes de liberar Auth no site publicado, executar com contas fictícias:

1. Cadastro, confirmação de e-mail, login, recuperação de senha e logout.
2. Edição de perfil e leitura em outra sessão; isolamento de outro paciente.
3. Agendamento, confirmação, remarcação e cancelamento, conferindo dashboard e avisos.
4. Duas sessões disputando o mesmo horário; só uma confirmação deve ser aceita.
5. Gestão de equipe por admin ativo; tentativa negada por paciente e visitante.
6. Desativação/reativação de médico, catálogo e revogação de acesso às consultas.
7. Falha de rede sem mensagem falsa de sucesso e revisão do destino dos dados locais.

Roteiros detalhados: [consultas](consultas-supabase.md),
[equipe](gestao-funcionarios.md) e [conflitos](conflitos-horarios.md).
Não habilitar `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH` na Vercel antes da revisão da
equipe e da validação completa. Conferir também URLs, e-mail e configurações de
segurança do ambiente. Merge e testes automatizados não substituem esse roteiro.

## Pendências e manutenção

Painéis de médico/secretaria, grade individual de disponibilidade, gestão completa
dos demais cadastros, edição administrativa de consultas, módulo de serviços e validações
adicionais continuam no backlog. Não marcar um card inteiro como concluído pela
entrega de uma parte.

Cada PR que mudar comportamento, banco ou configuração deve atualizar a documentação
afetada e registrar como foi validada. O responsável pela documentação pode revisar
o padrão, mas as atualizações acompanham o trabalho de cada integrante.
Use branch por card, commits da conta pessoal e PR revisada por outra pessoa.
Não trabalhar diretamente na `main` nem fazer merge sem revisão.

Antes de começar um card, com o diretório de trabalho sem alterações pendentes:

```bash
git switch main
git pull origin main
git switch -c docs/seu-card
```

Após revisar as alterações, selecione os arquivos do card com `git add`, faça o
commit com sua conta pessoal e envie a branch com `git push -u origin docs/seu-card`.
Abra a PR para `main`, descreva a entrega e a validação e peça revisão a outro
integrante. Para um card de código, use um nome como `feat/validacao-cpf`.

## Retorno do cadastro

O envio ao Auth diferencia sucesso, orientação e erro. Uma resposta de sucesso
sem sessão pede a confirmação do e-mail em um aviso verde. Limites de envio,
conta existente e respostas inconclusivas do servidor ou da rede recebem
orientação para conferir o e-mail e fazer login, sem declarar um sucesso que
não foi confirmado. Erros de dados continuam destacados como erro.

O botão fica desativado durante o envio e depois de um cadastro aceito. Uma
trava imediata também impede duas chamadas antes da atualização visual do React.
As senhas são limpas do formulário após sucesso. Essa alteração não muda os
metadados enviados no cadastro nem configurações do Supabase.

## Notificações dos agendamentos

O sino exibe avisos individuais de consultas futuras e canceladas, com links para
a aba e o cartão correspondentes. Recarrega após operações, ao voltar à aba e
periodicamente enquanto visível. Consulte [comportamento, limites e roteiro](notificacoes-agendamentos.md).
