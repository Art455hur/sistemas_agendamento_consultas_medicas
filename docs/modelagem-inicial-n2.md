# Modelagem inicial N2 — AgendaSaúde

Esta migração é a fundação, não a implementação dos CRUDs. Por enquanto a aplicação publicada segue usando dados simulados: a autenticação Supabase permanece **desligada**.

## Estrutura

- `profiles`: um perfil por conta do Supabase Auth, papel padrão `patient`, nome e telefone. O cadastro público não pode escolher nem alterar `role`.
- `appointments`: paciente, médico, especialidade, data/hora com fuso (`timestamptz`), motivo e estado. Um índice impede duas consultas ativas para o mesmo médico e instante.
- Novo usuário recebe perfil de paciente automaticamente. A função de trigger fica em `private` e não é executável diretamente por clientes.

## Acesso inicial

- Paciente/médico autenticado só consegue ler suas consultas; cada pessoa pode ler e editar apenas seu próprio nome/telefone.
- Nenhum cliente pode gravar agendamentos por enquanto: CRUD, disponibilidade, conflitos, validações e autorização de secretaria/administrador serão implementados nos cards correspondentes.
- Atribuição de papéis de funcionários é administrativa e ainda não existe na interface. Não usar `user_metadata` para conceder papel.
- Não importar automaticamente `localStorage`: dados de contas simuladas não têm vínculo confiável com `auth.users`. Antes de ativar, definir uma migração consciente e testar isolamento entre contas no mesmo navegador.

## Próximos trabalhos para a equipe

1. Cadastro e gerenciamento administrativo de profissionais, especialidades e vínculos com o hospital.
2. Horários disponíveis e prevenção de conflitos (o índice atual cobre apenas o mesmo médico e instante exato).
3. CRUD de agendamentos com regras de autorização por papel e integração das telas.
4. Testes de RLS por perfil, fluxo de autenticação e publicação após revisão.

**Hipótese desta versão:** um único hospital. Se houver mais de uma unidade, incluir `clinic_id` e políticas por estabelecimento antes de liberar acesso à secretaria e à administração.
