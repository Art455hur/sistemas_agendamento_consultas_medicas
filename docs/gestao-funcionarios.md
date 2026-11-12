# Gestão de funcionários — Hospital Sapiens

O painel `/administracao` exige Auth habilitada, sessão válida, papel `admin`
e vínculo ativo no hospital. Usa apenas a chave publicável. O cadastro público
continua criando pacientes; o formulário administrativo não cria contas Auth nem
concede papel administrativo.

## Integração dos PRs #14 e #15

- O administrador preenche o e-mail de uma conta Auth existente, nome, função e
  especialidade. Médico exige nome e especialidade; secretaria exige nome.
- Funcionário ativo mostra **Desativar** e inativo mostra **Reativar**.
- Reativar recupera o vínculo existente sem mudar nome, função, especialidade ou
  consultas. A ação exige administrador ativo. Médico incompleto recebe uma
  mensagem para completar os dados no formulário.
- Salvar atualiza os dados e ativa o vínculo. Para editar, use o mesmo e-mail.
- Médico salvo com especialidade aparece no catálogo do paciente. Desativado,
  sai do catálogo e perde a leitura das próprias consultas pelo banco.
- O paciente conserva a leitura das próprias consultas. Alterar nome/especialidade
  do médico não modifica os dados históricos já registrados na consulta.
- Contas com consultas não podem trocar de função. Administradores não podem
  alterar a própria conta ou outro administrador por esse formulário.
- A RPC nova `admin_save_staff` é SECURITY INVOKER; delega a uma função limitada
  em `private`, que exige administrador ativo e valida os dados. A RPC antiga
  `admin_assign_staff` foi convertida em wrapper: não vincula médicos incompletos.

## Histórico do banco de testes

Estas migrações já foram aplicadas em `rgggijnypvvdkskyalip` e não devem ser
executadas manualmente outra vez:

- `20261111205951_gestao_funcionarios_hospital.sql`
- `20261111210414_bloquear_agenda_medico_inativo.sql`
- `20261112025202_especialidade_funcionarios.sql`
- `20261112131100_reativar_funcionario.sql`

A atualização de perfil/fuso `20261112014111` já existia no banco, foi recuperada
para o repositório e preservada. A tela usa `America/Sao_Paulo` conforme essa
atualização. Não são alterados os horários absolutos de consultas existentes.

## Roteiro manual antes de publicar

1. Com contas de teste, entre como administrador ativo e abra `/administracao`.
2. Preencha o e-mail de uma conta nova de funcionário, nome, função Médico e
   especialidade. Salve e confira o vínculo na equipe.
3. Entre como paciente em outra sessão: o profissional deve aparecer e aceitar
   um agendamento. Confira nome, especialidade e horário na confirmação.
4. Desative o profissional pelo painel: deve sair do catálogo. O paciente continua
   vendo a consulta. O médico não deve conseguir ler consultas pela Data API.
5. Clique em **Reativar** na linha do profissional inativo. Confirme a volta ao
   catálogo e a preservação dos dados, sem preencher o formulário.
6. Tente operações como paciente e tente conceder `admin`, alterar o próprio papel
   ou trocar a função de uma conta com consultas: todas devem ser negadas.
7. Confirme que secretaria aceita especialidade em branco.

`npm test` cobre permissões, campos obrigatórios, compatibilidade da RPC antiga,
catálogo, consulta, reativação e preservação do histórico em Postgres descartável.
A validação manual dos formulários no navegador ainda é necessária.

Os advisors já existentes continuam apontando as RPCs públicas de listagem e
inativação (`admin_list_staff`, `admin_deactivate_staff`), que são SECURITY DEFINER
com verificação de administrador ativo. Referência: [advisor 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
A proteção contra senhas vazadas continua desligada no projeto de testes.

A reativação usa a RPC SECURITY INVOKER `admin_reactivate_staff` e uma operação
limitada no schema privado. Ela não cria vínculos ausentes nem altera contas
administrativas. Os testes também cobrem secretaria sem especialidade, repetição
da ação, médico incompleto e negação a paciente/anônimo/admin inativo.
