# Persistência das consultas — primeira entrega

Esta entrega prepara agendamento, listagem, confirmação, cancelamento, remarcação,
indicadores e notificações para usar a conta Supabase. Com Auth desligado, o protótipo
local continua disponível. Dados antigos do navegador não são importados.

## Como começar no seu computador

1. Abra esta branch no VS Code e rode `npm ci`.
2. Rode `npm test` e `npm run build`. Os testes usam Postgres descartável (PGlite),
   aplicam todas as migrações e não acessam o banco hospedado.
3. Em um ambiente de desenvolvimento do Supabase, aplique as migrações pendentes,
   na ordem dos nomes em `supabase/migrations`. A nova migração termina em
   `_consultas_paciente.sql`. No projeto `rgggijnypvvdkskyalip`, ela já foi aplicada
   e verificada em 11/11/2026 (versão `20261111213338`); não execute novamente nesse projeto.
4. Cadastre um paciente e um profissional pelo Supabase Auth, com contas de teste.
   Entre como administrador ativo em `/administracao` e preencha e-mail, nome,
   função e especialidade do médico. Salvar cria/reativa o vínculo no hospital.
   A conta usada para agendar precisa ter o papel de paciente.
5. Copie `.env.example` para `.env.local`, preencha a URL e a chave **publishable**
   e configure `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH=true` somente nesse ambiente de teste.
   A chave secreta/service_role não é necessária. Configure as URLs de confirmação
   e recuperação de senha conforme `docs/autenticacao-supabase.md`.
6. Rode `npm run dev`, entre como paciente e siga o roteiro abaixo.

Sem médicos ativos com especialidade, o sistema mostra que não há profissionais
disponíveis. Nenhuma conta real é promovida ou criada automaticamente por esta entrega.

## Roteiro de validação

- Agende uma consulta e confira a confirmação e a linha em `appointments`.
- Abra a mesma conta em outro navegador: a consulta deve aparecer em Meus agendamentos.
- Entre com outro paciente: a consulta anterior não deve aparecer.
- Tente reservar o mesmo médico e horário em duas sessões: apenas uma deve conseguir.
- Remarque: o ID da consulta deve permanecer o mesmo e o horário anterior ser liberado.
- Cancele: o status deve mudar e o horário ficar disponível novamente.
- Confira o dashboard e o menu de notificações após cada alteração.
- Desconecte a rede: deve aparecer erro, sem confirmação falsa de sucesso.

## Regras desta primeira versão

- Fuso da clínica: `America/Sao_Paulo` (UTC−3), consistente no banco e nas telas,
  independentemente do fuso do aparelho, alinhado à atualização já aplicada no banco.
- Grade inicial: 08:00, 09:00, 10:30, 14:00 e 15:30, em qualquer dia. Feriados,
  duração variável e configuração da agenda por médico pertencem ao card de horários.
- Banco impede consulta no passado, profissional sem vínculo ativo, reserva duplicada
  do médico ou do paciente e alterações em consultas de outras pessoas.
- Na remarcação só muda o horário. Paciente, médico, especialidade e motivo são preservados.
- Consultas passadas aparecem como concluídas conforme a regra do MVP, sem alterar o
  banco durante uma leitura. Isso não representa confirmação de atendimento pelo médico.
- Chamadas públicas são SECURITY INVOKER; operações privilegiadas e limitadas ficam
  em `private`, verificam a sessão e só podem ser executadas por `authenticated`.
  Mantenha `private` fora dos schemas expostos no Data API.

## Limites e publicação

O card completo de persistência ainda inclui perfil e outros cadastros. A edição do
perfil continua local; os painéis de médico/secretaria continuam em cards próprios.
A gestão de funcionários foi integrada com nome e especialidade. Esta entrega não ativa Auth na Vercel nem
publica a aplicação. Revisar esses fluxos antes de liberar uso real.

No Kanban, mantenha **Implementar persistência de dados** em andamento e registre
esta entrega no checklist como **Consultas integradas ao Supabase**. Mova esse item
para revisão após executar o roteiro com as contas de teste.

## Integração com a gestão administrativa

O PR #15 incorpora o PR #14, preservando formulário administrativo, verificação de
vínculo ativo, RLS de médico desativado e tratamento de sessão vazia.
A migração `20261112014111_perfil_paciente_e_fuso_sao_paulo.sql` foi recuperada do
histórico remoto: já existia no banco e não deve ser aplicada novamente nesse projeto.
A migração `20261112025202_especialidade_funcionarios.sql` também já foi aplicada
no projeto de testes `rgggijnypvvdkskyalip`; ela permite salvar o nome e a especialidade
pelo administrador sem promover contas automaticamente.

Execute `npm test` (33 testes) e `npm run build`. Além do roteiro do paciente,
valide o formulário administrativo e o catálogo seguindo `gestao-funcionarios.md`.
Não publique antes da revisão da interface integrada.

A migração `20261112131100_reativar_funcionario.sql` já foi aplicada no banco de
testes. Funcionários inativos agora têm botão **Reativar** no painel administrativo.

## Persistência do perfil

Com a autenticação Supabase habilitada, `/perfil` lê e atualiza `public.profiles`
pelo ID da sessão validada. Nome, telefone, CPF e nascimento são persistidos;
o e-mail exibido vem do Auth e é somente leitura. Nenhum dado do armazenamento
local é importado automaticamente para a conta autenticada. O menu também lê
o nome do banco. As políticas existentes limitam leitura e atualização ao titular.
Não há nova migração: os campos e permissões já estão na migração
`20261112014111_perfil_paciente_e_fuso_sao_paulo.sql`.

Para validar em uma prévia desta branch: salve dados de teste no perfil, entre
com a mesma conta em outra sessão e confira os quatro campos. Depois entre
com outro paciente e confirme que os dados dele permanecem separados.
CPF duplicado deve exibir erro sem indicar sucesso.
