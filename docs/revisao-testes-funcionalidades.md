# Revisão dos testes das funcionalidades

Registro inicial de 13/11/2026, baseado em `c158029`, preservado como histórico.
A [atualização de 20/11/2026](#atualização-de-20112026) preserva o estado daquela data; a revisão consolidada de 26/11/2026, ao final do arquivo, registra as entregas posteriores.
Relacionada aos cards **Criar testes das funcionalidades**, **Implementar
validações de dados** e **Preparar documentação técnica**. Registra o que já
existe para orientar a divisão do trabalho e evitar testes duplicados.

## Resultado executado nesta revisão

| Verificação | Resultado | Limite |
| --- | --- | --- |
| `npm test` | 104 testes aprovados; zero falhas, cancelamentos ou testes ignorados | Node Test Runner e banco descartável PGlite; não acessa o Supabase hospedado |
| Suíte Playwright | 13 cenários existentes; execução completa pendente neste ambiente | O lançamento do navegador foi bloqueado antes de interagir com as páginas |
| Build | Aprovado na entrega da PR #37 | Não repetido nesta revisão documental |

O total de 104 testes pertence à equipe. Não deve ser atribuído a um único
integrante. Os números menores registrados nos documentos de entregas
anteriores são resultados históricos e não precisam ser reescritos.

## Contribuições identificadas no Git

| Integrante / conta | Cobertura adicionada ou ampliada | Evidências |
| --- | --- | --- |
| Arthur / `Art455hur` | Dígitos do CPF na aplicação e no banco, preservação de CPFs antigos sem alteração, regra de nome no cadastro/perfil e cenários de navegador para nomes inválidos e persistência local | [PR #19](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/19), [PR #20](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/20), [PR #36](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/36) |
| San / `sanzin71` | Consultas e permissões, persistência do perfil, conflitos de horário, retorno e trava do cadastro, reenvio de confirmação e integração cadastro → banco → perfil | [PR #15](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/15), [#16](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/16), [#17](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/17), [#22](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/22), [#27](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/27), [#31](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/31) |
| Ian / `ianhebertt15` | Fluxos de navegador da demonstração: home, navegação, especialidades, validações, cadastro/login e proteção de rotas; testes de autorização e operações administrativas de consultas | [PR #34](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/34), [PR #35](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/35) |
| Brício / `bricioprincipalh18-lang` | Formatação e máscaras, notificações, compartilhamento/isolamento do carregamento de consultas e recuperação de falhas | [PR #23](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/23), [#26](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/26), [#32](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/32), [#33](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/33) |
| Railson / `railsondsr` | Leitura administrativa da agenda e disponibilidade por médico/dia, com autorização e proteção de horários já reservados | [PR #25](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/25), [PR #29](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/29) |
| Luiz / `luiz22082003-source` | Testes do CRUD de especialidades e sua integração com equipe e consultas | [PR #24](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/24) |

A tabela identifica contribuições concretas por PR e não substitui o histórico
completo de commits. Atualizações posteriores da equipe podem ampliar os mesmos
arquivos. A PR #37, de Arthur, corrigiu a cor do erro do perfil; foi uma mudança
de CSS e documentação, sem acrescentar testes automatizados.

## O que os testes de integração comprovam

`tests/registration-profile-integration.test.js` usa os serviços da aplicação
com transporte do Supabase Auth simulado. Executa migrações, triggers,
restrições, RLS e consultas reais no PGlite. Confere os quatro dados do cadastro,
CPF com zero inicial, nascimento em ano bissexto, campos permitidos, leitura
posterior do perfil, isolamento entre pacientes e reversão do cadastro por CPF
duplicado. Isso não testa envio de e-mail nem cookies ou sessões reais do Auth.

Os testes de CPF e nome cobrem entradas válidas, inválidas e limites. Os testes
do serviço de perfil verificam rejeição antes de escrever e normalização dos
dados. A suíte de navegador cobre somente o modo de demonstração, com Auth
desligada e requisições externas bloqueadas.

## Evidências manuais

- San relatou testes de confirmação/login, edição e persistência do perfil,
  agendamento, remarcação, cancelamento, isolamento entre pacientes e bloqueio
  do acesso administrativo. O registro e as ressalvas estão em
  [integração do paciente](testes-integracao-paciente.md).
- Arthur confirmou nome curto rejeitado, `Ana` salvo e mantido após F5 no modo
  de demonstração; também confirmou o erro em vermelho ao abrir o novo preview
  da PR #37. Veja [validação do nome](validacao-nome.md).

Essas evidências foram relatadas pelos integrantes. Não representam uma nova
execução automática do navegador nesta revisão.

## Pendências para organizar com os responsáveis

1. Executar os 13 cenários de navegador em ambiente que permita iniciar o
   Chromium e anexar o resultado à PR/card. Não classificar o bloqueio de
   lançamento como falha de comportamento da aplicação.
2. Completar os critérios ainda pendentes do fluxo real: novo cadastro com os
   quatro dados visíveis no perfil, confirmação e reenvio com entrega/link,
   recuperação de senha e sessão. O registro anterior documenta limite de envio
   do Supabase; mensagem correta de limite não comprova entrega do e-mail.
3. **Cobertura acrescentada em 19/11/2026 por Sandro:**
   `tests/admin-patients-database.test.js` testa listagem, edição, desativação e
   reativação, permissões, entradas inválidas, cancelamento de consultas futuras,
   preservação do histórico e isolamento. São 14 cenários em PGlite; a suíte
   completa passou com 123 testes, incluindo o agrupador. Detalhes e limites em
   [integração do paciente](testes-integracao-paciente.md#gestão-administrativa-de-pacientes--19112026).
   A verificação com Auth real e pela interface continua separada.
4. Validar as áreas de médico e secretaria quando suas rotas forem entregues.
   Página inexistente não comprova bloqueio de autorização.

Combinar os cenários ainda sem responsável antes de implementar, preservando as
contribuições já existentes. Não marcar o card inteiro como concluído apenas
pelo resultado de `npm test`.

## Como repetir

```bash
npm ci
npm test
npm run test:e2e:install
npm run test:e2e
```

Consulte [testes de ponta a ponta](testes-ponta-a-ponta.md) para instalação,
relatório e isolamento da demonstração. Os testes de Auth real exigem ambiente
de teste configurado e contas fictícias. Esta revisão não aplica migrações nem
altera configurações de Supabase ou Vercel.

## Atualização de 20/11/2026

Base consultada: `main` em `20b69e5`, após as PRs #42 e #43.

- **San / Sandro:** a [PR #42](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/42) já foi integrada e cobre a gestão administrativa de pacientes com 14 cenários em PGlite. Essa cobertura não é mais uma pendência de implementação. A [PR #43](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/43), também integrada, acrescenta cinco testes de busca/filtros dos profissionais. A interação com Auth real e o layout móvel continuam exigindo conferência.
- **Brício:** a [PR #41](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/41) acrescentou regressões de redirecionamento e cabeçalhos de segurança.
- **Railson:** a [PR #39](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/39) integrou criação administrativa de consultas e a [PR #40](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/40) reorganizou o painel e formulários. Médico e secretaria continuam com cards próprios em andamento.
- **Arthur:** consolida os registros desta revisão, atualiza a documentação e os cards de validações/testes, preservando a autoria do código e das execuções de cada integrante.

A [PR #44](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/44) registra instalação limpa, **128 testes aprovados** e build concluído por Sandro. O [GitHub Actions](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/44683026264) foi consultado: instalação, testes e compilação passaram. A PR ainda está aberta, com automação pendente de revisão e integração. Esses resultados não são uma nova execução local de Arthur nesta atualização documental.

Os 13 cenários Playwright continuam separados: o check da PR #44 executa Node/PGlite e build, não a suíte de navegador. Permanecem pendentes os fluxos completos com Auth real, e-mails, interação de profissionais no celular e os painéis de médico/secretaria quando entregues. Não refazer os testes administrativos que já foram integrados.

O card de testes deve apontar para as PRs #42/#43 e distinguir os registros históricos de 104/123 testes da evidência mais recente de 128. Não concluir todos os critérios somente pelo check aprovado.


## Continuação da validação de navegador — PR #46

A PR #44 foi integrada e passou também na main. A [PR #46](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/46)
acrescenta a execução Playwright ao CI em desktop e celular emulado, sobre o
build local de demonstração. Os cenários originais de Ian e Arthur foram
preservados. Sandro acrescentou a automação, o relatório e uma regressão do
cabeçalho em 320 px.

Na [primeira execução](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/44806686865),
25 das 26 execuções passaram. A navegação móvel falhou porque o CSS ocultava
**Entrar** abaixo de 800 px. O ajuste mantém os dois acessos visíveis e permite
quebra de linha no cabeçalho. A suíte passa a ter 14 cenários em duas
configurações, totalizando 28 execuções; conferir o resultado mais recente na PR.

Isso avança o card de testes das funcionalidades e a validação móvel do fluxo
público. Não conclui testes reais de Auth/e-mail, áreas profissionais ou uma
auditoria de todas as telas em celular.

## Revisão consolidada da equipe — 26/11/2026

Levantamento documental do histórico de PRs do repositório até a
[PR #54](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/54),
já integrada à `main`. Foram conferidas 54 PRs numeradas, das quais **53 foram
integradas**; a [PR #9](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/9)
não foi integrada, e a preparação de autenticação entrou pela PR #10. A contagem
abaixo é por **conta que abriu a PR**, não uma declaração de autoria exclusiva
de cada linha ou teste. O código compartilhado, as revisões e os testes da equipe
podem envolver mais de uma pessoa.

| Integrante / conta | PRs integradas | Entregas verificadas no histórico |
| --- | ---: | --- |
| **Railson** / `railsondsr` | **23** | Protótipo e documentos iniciais, landing NexTech e base de perfis, autenticação e administração; modelagem do hospital, equipe, agenda, horários e agendamento administrativo; [painel da secretaria (#48)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/48), [painel do médico (#49)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/49), [login unificado e saída (#50)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/50), [ensaio local documentado (#52)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/52), [revisão documental dos avisos de segurança (#53)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/53) e [atualização do roteiro (#54)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/54). |
| **Luiz** / `luiz22082003-source` | **3** | [Navegação inicial (#3)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/3), [CRUD de especialidades (#24)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/24) e [CRUD administrativo de pacientes (#28)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/28). |
| **Sandro (San)** / `sanzin71` | **11** | Integração de consultas, médicos e perfil, validação de horários, fluxo de cadastro e confirmação; [testes administrativos de pacientes (#42)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/42), [filtros de profissionais (#43)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/43), [CI de testes/build (#44)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/44), [correção móvel e Playwright no CI (#46)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/46) e [roteiro inicial de apresentação (#47)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/47). |
| **Arthur** / `Art455hur` | **8** | [CPF no frontend (#19)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/19) e [no banco (#20)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/20), [regra de nome (#36)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/36), [mensagens de erro do perfil (#37)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/37) e documentação técnica/de testes/estado da N2 nas [PRs #18](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/18), [#38](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/38), [#45](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/45) e [#51](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/51). |
| **Brício** / `bricioprincipalh18-lang` | **6** | [Organização por funcionalidades (#21)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/21), componentes compartilhados do paciente (#23), notificações (#26), carregamento/formatação de consultas (#32), tratamento de falhas (#33) e [reforço dos redirecionamentos/cabeçalhos (#41)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/41). |
| **Ian** / `ianhebertt15` | **2** | [Testes de navegação e demonstração com Playwright (#34)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/34) e [disponibilidade e operações administrativas de consultas (#35)](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/35). |
| **Total** | **53** | PRs integradas dos seis usuários acima; a PR #9 permanece fora da contagem. |

Para auditoria, os números das PRs integradas por conta são:

- **Railson:** #1, #2, #4–#8, #10–#14, #25, #29–#30, #39–#40, #48–#50, #52–#54.
- **Luiz:** #3, #24, #28.
- **Sandro/San:** #15–#17, #22, #27, #31, #42–#44, #46–#47.
- **Arthur:** #18–#20, #36–#38, #45, #51.
- **Brício:** #21, #23, #26, #32–#33, #41.
- **Ian:** #34–#35.

### Estado que a equipe pode apresentar

- **Implementado na `main`:** fluxo do paciente; especialidades e gestão
  administrativa; grade de disponibilidade e bloqueio de conflitos; painéis de
  administração, secretaria e médico; login único e saída por perfil. O
  [README](../README.md) e a
  [documentação técnica](documentacao-tecnica.md) descrevem o escopo e os
  limites. Em 26/11, estavam registradas 22 migrações versionadas e aplicadas,
  conforme a revisão documental da PR #51.
- **Automação:** a PR #44 registrou 128 testes Node/PGlite e build aprovados;
  a PR #46 registrou 14 cenários Playwright em desktop e celular emulado
  (28 execuções), também aprovados. O
  [workflow da `main` de 26/11](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/45751679524)
  passou. Esses testes não usam o Auth nem o banco Supabase hospedado.
- **Ensaio manual local:** o [registro do ensaio local da PR #52](evidencias-ensaio-local-26nov.md)
  descreve agendamento, conflito, remarcação, cancelamento, registro médico,
  exames fictícios e separação de dados entre perfis no Supabase **local**.
  Isso não equivale à homologação completa da versão publicada.

### O que ainda precisa de conferência ou correção

1. Percorrer os quatro perfis e as permissões no site **publicado**, com Auth
   real e contas fictícias; conferir também confirmação de e-mail e recuperação
   de senha. Os testes locais e o CI não certificam esses fluxos online.
2. Corrigir e retestar o layout estreito do paciente (botão **Sair** cortado)
   e da administração (conteúdo horizontal cortado); fazer conferência em
   celular físico e pelo teclado. A correção pública do botão **Entrar**
   da PR #46 não resolve automaticamente esses painéis.
3. Avaliar os avisos de segurança do Supabase descritos em
   [reforço de segurança](reforco-seguranca.md), em especial a proteção
   contra senhas vazadas desabilitada; a revisão documental não muda a
   configuração nem representa auditoria de produção.
4. Confirmar com a equipe os itens restantes do backlog, como convites de
   funcionários pelo painel e a grade semanal recorrente, antes de marcar
   essas funções como entregues.

Esta atualização consultou o Git e as evidências já registradas; **não
executou novamente os testes, não alterou código, banco, contas nem deploy**.
Os resultados antigos de 104/123/128 testes e os estados históricos de PRs
acima continuam datados para evitar que um registro anterior seja confundido
com a situação atual.
