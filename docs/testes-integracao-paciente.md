# Testes de integração do paciente

Registro inicial de 12/11/2026. Base original: `main` no commit `3751183`, após os PRs #28 (pacientes) e #29 (horários). Este documento acompanha o card **Testes de integração** e a correção de cadastro ligada ao card **Criar usuários**.

Atualização de 19/11/2026: a correção de cadastro do [PR #31](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/31) já foi integrada à `main`. Foi acrescentada a cobertura da gestão administrativa de pacientes descrita abaixo, sobre a base `c3ed8dd`, após o PR #41. Os resultados de 86 testes registrados na entrega original continuam como histórico.

## Problema encontrado e correção

O formulário exigia nome, telefone, CPF e nascimento, mas a chamada de cadastro enviava apenas o nome nos metadados. O trigger já existente preenche `profiles` a partir de `phone`, `cpf` e `birth_date`; sem esses campos, o perfil inicial podia ficar incompleto.

O serviço `registerPatient` passa a enviar os quatro dados, normalizando telefone e CPF para números e mantendo a data civil. A senha continua no campo de autenticação e não vai para os metadados nem para `profiles`. Campos adicionais como papel e hospital não são copiados do formulário. A validação do formulário e as restrições do banco continuam ativas.

Não foi criada migração. A correção vale para novos cadastros; ela não recupera automaticamente dados omitidos de contas antigas. O usuário dessas contas pode preencher o perfil pela tela já existente.

## Testes automatizados

Arquivo novo: `tests/registration-profile-integration.test.js`.

| Cenário | Verificação |
| --- | --- |
| Cadastro → banco → perfil | O serviço envia os dados e o trigger real grava nome, telefone, CPF com zero inicial e nascimento em ano bissexto. O serviço real de perfil lê os valores salvos. |
| Campos permitidos | Senha não é gravada nos metadados; papel, hospital e ID fornecidos no objeto do formulário não são enviados. |
| Nova sessão | Ao trocar o contexto de sessão e voltar para o titular, os dados continuam disponíveis. |
| Sem sessão | Acesso direto à tabela é rejeitado por falta de permissão. |
| Outro paciente | RLS oculta o perfil do primeiro paciente e permite ler o próprio. |
| CPF duplicado | A restrição única reverte o novo cadastro e o retorno não vira mensagem de sucesso. |

O transporte do Supabase Auth é simulado para não enviar e-mails. As migrações do repositório, os triggers, as constraints, as políticas RLS e as consultas rodam em um Postgres isolado via PGlite. Isso não valida entrega de e-mail, cookies reais ou o link de confirmação.

Validação desta entrega: **86 testes passaram**, sem falhas; **compilação de produção passou**. Para repetir: `npm ci`, `npm test` e `npm run build`.

## Testes manuais relatados por Sandro

Os resultados abaixo foram informados por Sandro durante os testes no site; não representam uma nova execução automática do navegador nesta entrega.

| Fluxo | Resultado informado |
| --- | --- |
| Confirmação e login da conta original | Funcionou depois de atraso no e-mail. |
| Alterar perfil e atualizar com F5 | Funcionou. |
| Agendar e localizar consulta | Funcionou. |
| Remarcar e sair/entrar novamente | Funcionou. |
| Cancelar, conferir em Canceladas e atualizar | Funcionou. |
| Duas contas de paciente | Uma não exibiu as consultas nem o perfil da outra. |
| Paciente abrir administração | Apareceu bloqueio de acesso. |
| Novo pedido de confirmação | Bloqueado pelo limite de envio do Supabase. A mensagem de limite apareceu corretamente. |

## Gestão administrativa de pacientes — 19/11/2026

Sandro acrescentou `tests/admin-patients-database.test.js`, que chama as funções
`admin_list_patients`, `admin_update_patient` e `admin_set_patient_active` junto
com as consultas e políticas reais do banco. A suíte cria um PGlite em memória,
aplica as 16 migrações e usa somente contas e consultas fictícias. Cada cenário
roda em uma transação desfeita ao terminar, sem depender das alterações do anterior.

| Cenário | Resultado verificado |
| --- | --- |
| Permissões administrativas | Visitante, sessão sem identidade, paciente, médico, secretaria, administrador inativo e administrador sem vínculo não conseguem listar, editar, desativar ou reativar pacientes; os dados permanecem iguais. |
| Listagem | Administrador ativo vê somente pacientes, incluindo inativos e a contagem de consultas no histórico. |
| Edição e isolamento | Nome, telefone e CPF são normalizados, a data é preservada e o titular lê os dados ao trocar o contexto de sessão; outro paciente não consegue ler o perfil. Conta Auth, papel e consultas permanecem iguais. |
| Entradas rejeitadas | Nome, telefone, CPF e nascimento inválidos, CPF duplicado, ID inexistente, conta de funcionário e parâmetros obrigatórios nulos são rejeitados sem alterações parciais. |
| Desativação | Cancela somente consultas futuras agendadas daquele paciente. Preserva consultas passadas, concluídas e já canceladas, a conta e as consultas de outros pacientes. A listagem mantém o histórico e o horário cancelado volta a ficar disponível. |
| Paciente inativo | Não lê perfil ou consultas, não edita o próprio perfil, não acessa o catálogo ou os horários e não agenda, remarca, cancela ou se reativa. |
| Reativação | Recupera leitura do próprio perfil, histórico e catálogo; permite novo agendamento sem restaurar consultas canceladas nem expor dados a outro paciente. Repetir desativação/reativação mantém o resultado. |

Resultado: **123 testes aprovados**, zero falhas ou ignorados na suíte completa.
O arquivo novo contém **14 cenários**, além do teste agrupador contado pelo Node.
O total de 123 inclui as contribuições anteriores da equipe.

Para executar somente esta cobertura:

```bash
node --test tests/admin-patients-database.test.js
```

Para executar toda a suíte: `npm test`. Não são necessárias credenciais nem
variáveis de ambiente do Supabase. O `auth.uid()` e os papéis de sessão são
simulados; isso não comprova login/JWT real, entrega de e-mail ou funcionamento
dos formulários no navegador. Nenhuma migração, regra da aplicação ou configuração
do Supabase/Vercel foi alterada nesta entrega.

## Pendências do card

- O checklist do Praxi registra como concluída a conferência dos dados iniciais do perfil após a publicação do PR #31. Esta atualização não repetiu esse teste de interface; o registro automatizado continua separado da evidência manual.
- Testar a entrega e o link do reenvio quando o serviço permitir novos envios. Não marcar como aprovado por existir um usuário no banco.
- Conferir o bloqueio das áreas de médico e secretaria quando as rotas estiverem implementadas. Não confundir página inexistente com autorização testada.

O card permanece em revisão enquanto as pendências existirem. A cobertura nova
de banco não conclui os testes de interface ou das áreas de médico e secretaria.
A nova entrega fica em PR separado, aguardando autorização específica para merge.
