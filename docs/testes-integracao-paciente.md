# Testes de integração do paciente

Registro de 12/11/2026. Base: `main` no commit `3751183`, após os PRs #28 (pacientes) e #29 (horários). Este documento acompanha o card **Testes de integração** e a correção de cadastro ligada ao card **Criar usuários**.

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

## Pendências do card

- Conferir pela interface de um novo cadastro se os quatro dados aparecem no perfil após esta correção ser publicada. Os testes de banco já cobrem esse caminho; a conferência da tela ainda falta.
- Testar a entrega e o link do reenvio quando o serviço permitir novos envios. Não marcar como aprovado por existir um usuário no banco.
- Conferir o bloqueio das áreas de médico e secretaria quando as rotas estiverem implementadas. Não confundir página inexistente com autorização testada.

O card pode continuar em andamento enquanto essas pendências existirem. Não é preciso bloquear as entregas de consultas e perfil por causa do limite de e-mail. Este PR fica separado e depende de autorização específica para merge.
