# Documentação técnica — AgendaSaúde N2

Atualizada documentalmente em 27/11/2026 com as entregas integradas até a PR #55. A checagem anterior de Supabase, Vercel e GitHub Actions foi feita em 26/11 na base `80e52b2`; ela não comprova a publicação ou os testes manuais dos ajustes posteriores.

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
| `tests` e `tests/e2e` | Verificações com Node/PGlite e cenários de navegador com Playwright |

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
| `/administracao` | Visão geral e abas Agenda, Equipe e Especialidades; criação, leitura, remarcação e cancelamento de consultas por administrador ativo |
| `/administracao/pacientes` | Listagem, edição, desativação e reativação de pacientes |
| `/administracao/horarios` | Disponibilidade por médico e data |
| `/secretaria` | Agenda diária, filtros, agendamento, remarcação e cancelamento pela secretaria ativa |
| `/medico` | Agenda do médico ativo por data |
| `/medico/atendimento/[id]` | Registro de atendimento, histórico clínico e anexos de exames autorizados |

As rotas de secretaria e médico foram integradas nas PRs #48 e #49. O login unificado da PR #50 direciona cada perfil à própria área. Os fluxos com sessão real no site publicado ainda precisam de conferência.

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
| `public.profiles` | `id` ligado a `auth.users`; papel, nome, telefone, CPF, nascimento, especialidade do profissional e indicador `patient_active` |
| `public.appointments` | Paciente e médico ligados a `profiles`; nome do médico preservado, especialidade, instante, motivo e status |
| `public.hospital` | Hospital Sapiens, ID fixo 1 |
| `public.hospital_staff` | Um vínculo por perfil; referência ao hospital e indicador `active` |
| `public.specialties` | Catálogo administrável de especialidades ativas/inativas |
| `public.doctor_day_availability` | Configuração de horários por médico e data; ausência de configuração usa a grade padrão |

O cadastro público cria perfil `patient` por trigger. CPF não nulo é único e deve
ter 11 números; nascimento não pode estar no futuro. O papel não é editável pelo
paciente. O CRUD de especialidades adiciona `public.specialties` e mantém `profiles.specialty`
como compatibilidade para médicos e `appointments.specialty` como histórico. A
disponibilidade é configurável por médico e data, em intervalos de 30 minutos das
08:00 às 17:30; datas sem configuração usam a grade padrão da clínica.

O esquema `private` contém funções auxiliares e operações privilegiadas. Deve
permanecer fora dos esquemas expostos pela Data API.

## Migrações versionadas

Há **22 migrações SQL** versionadas nesta base. Aplicar em ordem de versão somente as pendentes no ambiente de destino.

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
| `20261112194614` | `20261112194614_crud_pacientes.sql` | Gestão administrativa de pacientes com desativação lógica |
| `20261112200018` | `20261112200018_horarios_profissionais.sql` | Personalização da disponibilidade por médico e data |
| `20261113134032` | `20261113134032_extend_doctor_day_slots.sql` | Amplia a grade diária de horários configuráveis para intervalos de meia hora |
| `20261113134034` | `20261113134034_admin_manage_appointments.sql` | Permite ao administrador remarcar ou cancelar consultas futuras |
| `20261116001239` | `20261116001239_admin_create_appointments.sql` | Permite criação de consultas por administrador ativo |
| `20261119235524` | `20261119235524_receptionist_agenda.sql` | Agenda e operações da secretaria |
| `20261125025036` | `20261125025036_receptionist_reschedule_slots.sql` | Horários livres na remarcação pela secretaria |
| `20261125032343` | `20261125032343_doctor_agenda.sql` | Consulta da agenda por médico |
| `20261125034747` | `20261125034747_doctor_appointment_outcomes.sql` | Registro dos resultados de atendimento |
| `20261125040430` | `20261125040430_doctor_clinical_notes.sql` | Notas e histórico clínico |
| `20261125215809` | `20261125215809_doctor_exam_files.sql` | Arquivos de exames vinculados a atendimentos |

A consulta de 26/11/2026 ao projeto `rgggijnypvvdkskyalip` retornou estado
`ACTIVE_HEALTHY` e **22 migrações aplicadas**, com as mesmas versões das 22
migrações em `supabase/migrations` na `main`. A divergência histórica de 20/11
sobre `20261119235524_receptionist_agenda` foi resolvida no versionamento.
Esta revisão não executou mudanças de esquema.
Confira o histórico remoto antes de qualquer execução. Não reaplique arquivos já
registrados nem altere migrações antigas para introduzir novas mudanças. Mudanças
futuras devem entrar em nova migração e PR; avise a equipe antes de aplicá-las no
banco compartilhado. Esta atualização documental não executa SQL.

## Permissões implementadas

| Perfil | Acesso atual com Supabase habilitado | Limite |
| --- | --- | --- |
| Visitante | Páginas públicas e autenticação | Sem acesso aos dados privados |
| Paciente | Próprio perfil; ler, agendar, cancelar e remarcar suas consultas | Não altera papéis nem dados de outros pacientes |
| Médico ativo | Agenda por data e registro de atendimento, histórico e exames autorizados | Confirmar fluxo com Auth real; vínculo ativo é exigido |
| Secretaria | Agenda diária e operações autorizadas de agendamento, remarcação e cancelamento | Confirmar fluxo com Auth real e restrição ao vínculo ativo |
| Administrador ativo | Painel, gestão da equipe, especialidades, pacientes, horários e criação/leitura/remarcação/cancelamento da agenda da clínica | Não promove administradores; CRUD de pacientes usa desativação lógica |

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
- Grade padrão: 08:00, 09:00, 10:30, 14:00 e 15:30. Administradores ativos
  podem configurar cada data com horários de 30 em 30 minutos entre 08:00 e 17:30.
- O banco rejeita passado, médico indisponível e conflito do médico ou paciente.
- A remarcação preserva o ID, profissional, especialidade e motivo.
- O cancelamento muda o status e libera o horário; não apaga o histórico.
- A administração pode criar, remarcar ou cancelar consultas futuras; a operação
  valida novamente autorização, disponibilidade e conflitos no banco.
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

Cadastro, perfil e serviço de atualização também compartilham a regra de nome
entre 3 e 120 caracteres após remover espaços externos. No perfil, erros de
validação, leitura e salvamento aparecem em vermelho; sucesso permanece verde.
Veja [validação do nome e retorno visual](validacao-nome.md).

### Pacientes

O cadastro continua sendo feito pelo fluxo público do Supabase Auth. O administrador pode listar, editar, desativar e reativar pacientes em `/administracao/pacientes`. A desativação é lógica: preserva conta e histórico, cancela consultas futuras ainda agendadas e bloqueia os fluxos privados do paciente até a reativação.

### Equipe

Uma conta Auth precisa existir antes de ser vinculada. O administrador informa
e-mail, nome, função e, para médico, especialidade. Salvar cria/atualiza o vínculo;
o mesmo e-mail permite edição. Desativar/reativar preserva histórico e dados.
A aba Equipe permite busca por nome/e-mail sem diferenciar acentos ou maiúsculas,
filtros combinados de função/situação e edição direta da linha com foco no nome.
Salvar também ativa o vínculo; administradores não recebem ações de edição na lista.
O formulário não cria contas Auth nem permite alterar administradores ou o próprio
papel. Contas com consultas não podem trocar de função. Veja o [roteiro atualizado](gestao-funcionarios.md).

## Verificação e publicação

Os números de 13/11 abaixo são históricos. Para a evidência mais recente de
20/11, consultar a seção de produção e a [revisão dos testes](revisao-testes-funcionalidades.md#atualização-de-20112026).

```bash
npm test
npm run build
```

Na revisão de 13/11/2026, `npm test` foi executado na base `c158029`:
**104 testes passaram, sem falhas ou testes ignorados**. Esse comando executa
Node/PGlite; não executa os testes de navegador nem acessa o Supabase hospedado.
PGlite aplica as migrações em banco descartável para testar persistência,
isolamento e regras, com o transporte Auth simulado nos cenários de integração.

Os registros antigos de 41, 52 e 86 testes correspondem às respectivas entregas,
não à contagem atual. A compilação já havia sido aprovada na entrega da PR #37;
não foi repetida nesta revisão exclusivamente documental.

Na revisão histórica de 13/11 havia 13 cenários Playwright, cuja execução
naquele ambiente foi bloqueada antes de abrir o navegador. A PR #46 adicionou
um cenário de regressão do login em tela estreita: são 14 cenários executados
em desktop e celular emulado (28 execuções), aprovados no CI.
O teste opcional de concorrência com duas conexões está em [conflitos](conflitos-horarios.md).
Veja a [revisão de cobertura, contribuições e pendências](revisao-testes-funcionalidades.md)
e o [guia de execução dos testes de navegador](testes-ponta-a-ponta.md).

Na consulta de 20/11/2026, a Vercel estava com produção READY no commit
`20b69e5`, correspondente à `main`, e `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH=true`
configurado para produção. Em 26/11, a produção estava READY no commit
`80e52b2` e o site respondeu HTTP 200; as três variáveis de integração
continuavam cadastradas, mas seus valores não foram reavaliados.
Isso não comprova login, cookies ou entrega de e-mail.

Após as PRs #42 e #43, a [PR #44](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/44), de Sandro, registrou
128 testes aprovados e foi integrada. Em 26/11, o [workflow da `main`](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/45751679524)
no commit `80e52b2` concluiu com sucesso testes Node/PGlite, compilação e
Playwright em desktop e celular emulado, com Auth desligado no CI.
Não foram repetidos testes ou build localmente nesta atualização documental.

Para concluir a validação funcional, executar com contas fictícias:

1. Cadastro, confirmação de e-mail, login, recuperação de senha e logout.
2. Edição de perfil e leitura em outra sessão; isolamento de outro paciente.
3. Agendamento, confirmação, remarcação e cancelamento, conferindo dashboard e avisos.
4. Duas sessões disputando o mesmo horário; só uma confirmação deve ser aceita.
5. Gestão de equipe por admin ativo; tentativa negada por paciente e visitante.
6. Desativação/reativação de médico, catálogo e revogação de acesso às consultas.
7. Falha de rede sem mensagem falsa de sucesso e revisão do destino dos dados locais.

Roteiros detalhados: [consultas](consultas-supabase.md),
[equipe](gestao-funcionarios.md) e [conflitos](conflitos-horarios.md).
Conferir também URLs, e-mail e configurações de segurança do ambiente com a equipe.
Esta atualização não altera a flag de Auth. Merge, READY e testes de banco isolado
não substituem o roteiro com autenticação real.

## Mudanças integradas após a checagem de 26/11

- As [evidências do ensaio local](evidencias-ensaio-local-26nov.md)
  (PR #52) registram testes com contas fictícias no Supabase **local**:
  agendamento e disputa de horário, operações da secretaria, atendimento e
  exames pelo médico, isolamento por perfil e verificação em celular emulado.
  São resultados manuais locais, não uma homologação do ambiente online.
- A [revisão dos avisos de segurança](reforco-seguranca.md) (PR #53)
  documentou a leitura das 22 migrações e os avisos sobre funções privilegiadas,
  tabelas bloqueadas por RLS sem políticas e proteção contra senhas vazadas.
  Essa entrega não alterou permissões nem configuração do Supabase.
- O [roteiro da demonstração](roteiro-demonstracao-n2.md) foi atualizado
  (PR #54) com os painéis, contas fictícias e limites do ensaio.
- A [PR #55](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/55)
  mudou o layout em telas de até 700 px: menu lateral do paciente agora abre
  pelo botão de menu, fecha ao selecionar uma rota, tocar fora ou pressionar Esc;
  barra superior e cartões se adaptam à largura. No painel administrativo,
  cabeçalho e blocos receberam ajustes para não ultrapassar a tela.
- A mesma PR direcionou o botão **Voltar ao início** da confirmação de consulta
  ao `/dashboard` e separou as mensagens de falha na confirmação da conta e na
  recuperação de senha. A troca do código PKCE continua dependente do navegador
  onde o pedido foi iniciado; mensagem explicativa não garante entrega do e-mail
  nem a conclusão do fluxo.
- O cenário Playwright do paciente em modo de demonstração foi adaptado para
  abrir o menu em telas pequenas. **Não houve reexecução dos testes ou
  conferência do deploy nesta atualização documental.**

## Pendências e manutenção

Os painéis de médico e secretaria e o login unificado já estão na `main` pelas PRs
#48–#50. A PR #55 acrescentou melhorias de navegação e layout móvel, mas sua
experiência em celular físico e no deploy de produção ainda precisa de conferência.
Permanecem pendentes de validação os fluxos com Auth real desses perfis, o envio
de e-mails e os critérios completos do backlog (como grade semanal recorrente,
módulo de serviços e demais cadastros).
Revisar os avisos atuais do Supabase antes de usar dados reais: tabelas com RLS
sem políticas, funções `SECURITY DEFINER` executáveis por `authenticated` e a
proteção contra senhas vazadas desabilitada, conforme
[revisão de segurança](reforco-seguranca.md). Os avisos não
comprovam que exista exploração ou acesso indevido; devem ser avaliados pela equipe.
Não marcar um card inteiro como concluído pela entrega de uma parte.

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
As senhas são limpas do formulário após sucesso. A correção da PR #31 também
faz o cadastro enviar nome, telefone, CPF e nascimento nos metadados esperados
pelo trigger de perfil; senha e papel não são copiados para esses metadados.
Contas antigas com dados omitidos não são preenchidas automaticamente. Veja
[integração entre cadastro e perfil](testes-integracao-paciente.md).

## Notificações dos agendamentos

O sino exibe avisos individuais de consultas futuras e canceladas, com links para
a aba e o cartão correspondentes. Recarrega após operações, ao voltar à aba e
periodicamente enquanto visível. Consulte [comportamento, limites e roteiro](notificacoes-agendamentos.md).
