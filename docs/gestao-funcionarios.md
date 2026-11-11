# Gestão de funcionários — Hospital Sapiens

As migrations `20261111205951_gestao_funcionarios_hospital.sql` e `20261111210414_bloquear_agenda_medico_inativo.sql` estão aplicadas no projeto Supabase de testes e versionadas com os mesmos números registrados no histórico remoto. O administrador ativo pode listar os vínculos de equipe, vincular uma conta Auth existente como médico(a) ou secretário(a), reativá-la e desativar o vínculo. Não é possível criar ou alterar um administrador por esses formulários. O cadastro público continua criando apenas pacientes. Um médico desativado perde a leitura de suas consultas pelo banco; o paciente continua vendo as suas.

O painel `/administracao` exige `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH=true`, uma sessão válida, `profiles.role = admin` **e** vínculo ativo no `hospital_staff`. A aplicação usa apenas a chave publicável; nunca coloca a chave secreta ou `service_role` no navegador. Na Vercel, o login real permanece desligado até a aprovação dos testes completos.

## Procedimento de teste

1. Mantenha contas de teste sem dados reais. Crie no Supabase Auth uma conta de funcionário com e-mail controlado, confirme-a e defina uma senha de teste; a conta precisa ter seu `profiles` criado pelo trigger.
2. Em ambiente de desenvolvimento com Auth habilitada, entre com a conta de teste `admin@hospital-sapiens.test` e abra `/administracao`. Ela já tem papel `admin` e vínculo ativo, mas precisa de senha conhecida para o teste de navegador.
3. No formulário, vincule a conta recém-criada como médico(a) ou secretaria. Confirme que aparece na lista e que o papel mudou no banco. Desative e confirme que o vínculo ficou inativo; a conta Auth não é excluída.
4. Tente entrar no painel como paciente e chamar as RPCs como paciente/usuário anônimo. O banco deve negar. Tente atribuir `admin`, alterar o próprio vínculo e trocar o papel de uma conta com consultas: também deve negar.
5. Teste médico e secretaria depois que os painéis respectivos consultarem `hospital_staff.active`; **não ative Auth em produção antes disso**. Depois integre a agenda, verifique RLS de consultas e teste os fluxos de ponta a ponta.

O teste SQL já confirmou a listagem pelo administrador, a negação da listagem para paciente e a negação da autodesativação. Em transação revertida, a atribuição de médico e uma consulta temporária confirmaram que o médico ativo conseguia ler a consulta, o desativado não, e o paciente ainda a via. Os dados de teste permaneceram intactos após o `ROLLBACK`.

As três RPCs públicas são `SECURITY DEFINER` e têm `EXECUTE` concedido apenas a `authenticated`; cada uma checa no banco o papel **e o vínculo ativo** do chamador antes de consultar/escrever, e usam `search_path` vazio. O advisor [0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) sinaliza esse acesso deliberadamente; revise-o em cada mudança. O advisor também informa que [Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) está desligada; habilite-a antes de usar contas reais.

Não execute manualmente a migration outra vez: ela já está registrada no Supabase. A branch e a PR permitem revisão antes do merge; a migration foi aplicada ao banco de testes para permitir validar as permissões agora.
