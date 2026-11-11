# Painel do administrador (N2)

A rota `/administracao` já possui estrutura visual responsiva, sem dados fictícios de pacientes ou consultas. Seu acesso exige a autenticação Supabase ativada, sessão validada e `role = 'admin'` no perfil lido do banco com RLS. Com a flag desligada, a rota informa que ainda não está disponível; nenhum token local concede acesso.

## O que ainda falta para concluir o card

- Implementar o vínculo de médicos e secretárias com a clínica, com autorização adequada no banco.
- Criar as políticas de acesso para o administrador ler e gerenciar os registros necessários. A política atual permite consultar apenas o próprio perfil; não abrir acesso amplo antes de definir o escopo da clínica.
- Integrar serviços/API para equipe, agenda, especialidades e horários; substituir os estados "Em breve" somente quando houver funcionalidade real.
- Testar com conta `admin` definida por operador autorizado, conta comum `patient` e visitante sem sessão. Nunca confiar em papéis enviados no cadastro ou no navegador.
- Revisar integração e migração dos dados antes de ativar `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH` no site publicado.

Não marque o card como concluído só pela interface: ele fica em desenvolvimento até a integração e os testes de acesso.
