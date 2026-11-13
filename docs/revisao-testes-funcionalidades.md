# Revisão dos testes das funcionalidades

Revisão de 13/11/2026, baseada na `main` no commit `c158029`, após a PR #37.
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
3. Acrescentar testes automatizados específicos das RPCs `admin_update_patient`
   e `admin_set_patient_active`: autorização, edição, desativação, cancelamento
   de consultas futuras e reativação preservando histórico. Não foram
   encontrados testes que chamem essas RPCs nesta base. A PR #28 registra
   verificação transacional; isso não equivale a cobertura automatizada na suíte.
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
