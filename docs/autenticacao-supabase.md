# Autenticação Supabase — etapa preparatória

Este incremento prepara cadastro, login, confirmação de e-mail, recuperação de senha e logout com Supabase Auth. **Não habilitar em produção ainda**: perfil, consultas e agendamentos continuam em `localStorage`, sem isolamento entre usuários nem persistência remota. Também não há autorização de rotas por perfil vinculada ao banco. Uma conta local simulada não é migrada automaticamente para Supabase Auth.

## Ativação futura (após migrar os dados e revisar RLS)

1. Configurar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com valores públicos do projeto Supabase, no ambiente local e na Vercel. Nunca usar a chave `service_role`/secreta no navegador.
2. Em Supabase Auth → URL Configuration, cadastrar a URL do aplicativo como Site URL e permitir `https://SEU-DOMINIO/auth/callback` e `https://SEU-DOMINIO/auth/callback?next=/redefinir-senha` em Redirect URLs. Adicionar também `http://localhost:3000` para desenvolvimento. Configurar o provedor de e-mail conforme o ambiente.
3. Após validar migrações, políticas RLS e fluxo de ponta a ponta, colocar `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH=true` e fazer novo deploy. A simples presença de URL e chave **não** liga o novo fluxo.

Ao habilitar, a sessão passa a usar cookies gerenciados pelo SDK. O Proxy exige sessão nas rotas de paciente, e o cadastro não aceita papel/perfil no navegador. O passo seguinte é armazenar dados por `auth.uid()` e aplicar permissões no servidor e em políticas RLS; a base de papéis em `access-control.js` não é, isoladamente, autorização segura.
