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
