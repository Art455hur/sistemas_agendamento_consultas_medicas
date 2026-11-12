# CRUD de especialidades — AgendaSaúde N2

Este card cria um catálogo administrável de especialidades para o Hospital Sapiens.

## Escopo

O administrador ativo pode:

- cadastrar uma especialidade;
- listar especialidades ativas e inativas;
- renomear uma especialidade;
- desativar uma especialidade sem apagar histórico;
- reativar uma especialidade.

A migration cria `public.specialties` com nome único sem diferenciar maiúsculas/minúsculas. A tabela fica com RLS habilitado e sem escrita direta pelos clientes. As operações administrativas passam por RPCs que validam um administrador ativo.

## Integração com profissionais e agendamentos

O cadastro de médicos deixa de aceitar texto livre: a especialidade precisa existir no catálogo e estar ativa.

Ao renomear uma especialidade, os perfis dos médicos vinculados recebem o novo nome. Consultas antigas mantêm o texto histórico salvo em `appointments.specialty`.

Ao desativar uma especialidade:

- os dados não são apagados;
- médicos continuam com o vínculo histórico;
- a especialidade não pode ser usada em novo cadastro/edição de médico;
- médicos dessa especialidade deixam de aparecer para novos agendamentos;
- consultas já existentes permanecem intactas.

## RPCs

- `admin_list_specialties()`
- `admin_create_specialty(p_name)`
- `admin_update_specialty(p_id, p_name)`
- `admin_set_specialty_active(p_id, p_active)`

As funções expostas são `SECURITY INVOKER`; operações privilegiadas ficam no schema `private` e verificam `private.is_active_hospital_admin()`.

## Migration

Arquivo:

`supabase/migrations/20261112190336_crud_especialidades.sql`

Ela também importa para o catálogo as especialidades já usadas por médicos, evitando perda de dados.

**Não aplicar manualmente no Supabase compartilhado sem avisar a equipe.** A migration deve entrar pela PR e ser aplicada de forma coordenada.

## Validação

Antes do merge:

```bash
npm test
npm run build
```

Roteiro manual com Auth habilitada apenas no ambiente de teste:

1. Entrar como administrador ativo.
2. Cadastrar `Cardiologia`.
3. Tentar cadastrar `cardiologia` novamente e confirmar a rejeição por duplicidade.
4. Renomear para `Cardiologia Clínica`.
5. Criar/editar um médico e selecionar a especialidade.
6. Conferir o médico no agendamento do paciente.
7. Desativar a especialidade e confirmar que ela deixa de ser oferecida e que o médico some de novos agendamentos.
8. Confirmar que consultas antigas continuam visíveis.
9. Reativar a especialidade e confirmar o retorno ao catálogo.
10. Tentar executar as RPCs como paciente e confirmar acesso negado.
