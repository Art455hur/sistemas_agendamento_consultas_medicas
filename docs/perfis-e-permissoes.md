# Perfis e permissões — AgendaSaúde N2

Atualizado em 12/11/2026. As regras abaixo descrevem o código com Supabase habilitado.
O modo de demonstração continua local e não oferece autorização para uso real.

| Perfil | Implementação atual | Pendente |
| --- | --- | --- |
| Paciente | Próprio perfil e consultas; agendar, listar, cancelar e remarcar | Completar validações e testes de ponta a ponta |
| Médico | RLS permite ler suas consultas com vínculo ativo | Painel `/medico` e gestão de agenda |
| Secretaria | Próprio perfil e vínculo | Painel `/secretaria` e agenda do hospital |
| Administrador | Painel `/administracao` e gestão de médicos/secretárias, exigindo vínculo ativo | Gestão geral de agenda e serviços |

## Regras de acesso

- Cadastro público cria apenas `patient`; dados enviados pelo navegador não concedem papel.
- Perfil e vínculo são verificados no servidor/banco; a tabela de permissões de
  `access-control.js` também contém intenções futuras e não substitui RLS.
- Cada pessoa lê/edita os campos permitidos do próprio perfil, sem alterar `role`.
- Operações de consulta passam por funções SQL que conferem paciente e titularidade.
- Médico desativado perde leitura de consultas e sai do catálogo; paciente mantém seu histórico.
- RPCs de equipe exigem administrador ativo e não permitem alterar administradores
  ou o próprio papel. O formulário não cria contas Auth.
- A primeira conta administrativa depende de operação autorizada e auditável;
  não existe promoção pública nem automatismo no cadastro.

As rotas `/medico` e `/secretaria` ainda não existem como páginas. Não declarar
acesso à agenda clínica como implementado somente porque consta nas permissões previstas.

Consulte [o guia técnico](documentacao-tecnica.md) e o
[roteiro da gestão de equipe](gestao-funcionarios.md). A liberação de Auth no site
publicado permanece condicionada à revisão e aos testes completos.
