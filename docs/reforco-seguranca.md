# Reforço de segurança

## Correções nesta PR

O retorno após login aceitava qualquer texto iniciado por / exceto //. Barras
invertidas e controles permitem interpretações diferentes entre validadores e
navegadores. Agora login real, demonstração e AuthGuard usam safeRedirect: valida
o tipo, rejeita barras invertidas, controles, espaços e caminhos com escapes,
confere a origem e retorna um caminho normalizado. Parâmetros percent-encoded
continuam permitidos na query para especialidades e outros filtros.

Cabeçalhos de todas as rotas Next.js: nosniff, DENY, no-referrer, bloqueio de
câmera/microfone/geolocalização e CSP com frame-ancestors none, object-src none e
base-uri self. X-Powered-By é removido. A aplicação não poderá ser embutida em
iframes, inclusive previews embutidos; abrir a URL diretamente para revisão.
A CSP não restringe scripts: não representa proteção completa contra XSS.
A landing independente não é afetada por esta configuração Next.js.

## Revisão do Supabase (somente leitura, 17/11/2026)

O advisor retornou:

- RLS ativada sem policies em specialties e doctor_day_availability (INFO).
  Isso bloqueia acesso direto normal; não adicionar políticas permissivas só
  para eliminar o aviso. Conferir os fluxos RPC antes de mudar permissões.
- admin_list_staff e admin_deactivate_staff são SECURITY DEFINER executáveis por
  authenticated (WARN). As definições versionadas verificam administrador ativo
  e usam search_path vazio; a execução por authenticated não equivale a conceder
  operação administrativa. Não foi comparado o corpo remoto com as migrações.
- Proteção contra senhas vazadas desativada (WARN). Pendência de configuração
  para revisão do responsável antes da liberação real da autenticação.

Referências dos avisos:
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Revisão das migrações (somente leitura, 26/11/2026)

Os avisos acima continuam no Supabase, agora com mais funções e uma tabela a
mais por causa dos painéis da secretaria e do médico. A análise leu as 22
migrações da `main` em `9121a72`. Nada foi alterado no banco.

### Funções SECURITY DEFINER executáveis por authenticated (WARN)

É o padrão adotado no projeto: as tabelas não aceitam leitura ou escrita direta,
e cada operação passa por uma função `public.*` que chama uma `private.*` com
SECURITY DEFINER e `search_path` vazio. O papel `authenticated` precisa de
EXECUTE nas duas, por isso o aviso aparece.

As 35 funções privadas liberadas para `authenticated` verificam o chamador no
início e recusam com erro (`42501` ou “indisponível”) quando ele não pode agir:

| Grupo | Verificação |
| --- | --- |
| Administração (`admin_*`, especialidades, equipe, horários, agenda) | `is_active_hospital_admin()`: administrador com vínculo ativo |
| Secretaria (`receptionist_*`) | `is_active_hospital_receptionist()` |
| Médico (agenda, resultado, anotações clínicas) | médico com vínculo ativo e responsável pela consulta (`active_clinical_doctor()` e `doctor_id`) |
| Paciente (listar médicos, agendar, remarcar, cancelar) | `assert_booking_patient()`: paciente autenticado e ativo |

Um paciente desativado continua conseguindo entrar no sistema, mas o banco
recusa novos agendamentos dele. O ensaio local de 26/11 confirmou na prática
que um segundo médico não abre o atendimento nem o exame de outro médico
([evidências](evidencias-ensaio-local-26nov.md)).

Não remover o EXECUTE só para eliminar o aviso: os painéis deixariam de
funcionar. Qualquer função nova deve repetir a verificação do chamador.

### RLS ativada sem policies (INFO)

`public.specialties`, `public.doctor_day_availability` e
`private.doctor_clinical_note_versions` têm RLS ativa, nenhuma policy e
`revoke all` para `anon` e `authenticated`. É um bloqueio intencional: o acesso
acontece só pelas funções acima. Não adicionar políticas permissivas para
silenciar o aviso.

### Proteção contra senhas vazadas (WARN)

Continua desativada. É uma opção do Supabase Auth no painel do projeto online,
não uma mudança de código, e pode depender do plano contratado. Ligar ou não é
decisão da equipe.

### Limite desta revisão

Comparou o código versionado. Não comparou o corpo das funções no banco online
com as migrações nem fez teste de invasão.

## Limites e validação

O modo de demonstração ainda guarda senha simulada em registeredUser e usa token
local. Não oferece autenticação segura nem deve receber dados reais. A flag de
Auth da Vercel não foi modificada. Esta PR não certifica segurança de produção,
não aplica SQL, não modifica contas ou configuração de Auth e não substitui uma
auditoria completa. Antes de publicar dados reais, eliminar o uso do fluxo demo,
validar isolamento de contas e resolver as pendências operacionais de Auth.

Executar npm test e npm run build. Novos testes exercitam URLs maliciosas,
controles, escapes, caminhos legítimos e cabeçalhos. Testes de permissões/RLS
existentes continuam usando banco descartável. Revisar login e navegação em URL
direta antes do merge, incluindo confirmação e recuperação de senha.
