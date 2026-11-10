# Perfis e permissões — AgendaSaúde N2

Esta é a base para a implementação dos painéis e da autenticação real. O MVP da N1
continua com o fluxo simulado de paciente; as regras abaixo **ainda não protegem**
as páginas ou os dados em produção.

| Perfil | Escopo | Ações previstas |
| --- | --- | --- |
| Paciente | Seus próprios dados | Consultar, agendar, cancelar e remarcar suas consultas |
| Médico | Sua agenda e consultas | Consultar horários e informações necessárias ao atendimento |
| Secretaria | Agenda do estabelecimento | Consultar agendamentos e contatar pacientes para atendimento |
| Administrador | Estabelecimento | Consultar agenda, gerenciar funcionários e profissionais |

## Regras de implementação

- Cadastro público cria apenas pacientes. O usuário não pode escolher seu próprio papel.
- Papel e vínculo com o estabelecimento devem ser atribuídos por fluxo administrativo
  autorizado, nunca por um campo livre enviado pelo navegador.
- A checagem visual de rotas não substitui autorização no servidor e políticas RLS no banco.
- Dados de pacientes só podem ser vistos por quem precisa deles para o atendimento.
- Um profissional não pode acessar a agenda de outro somente alterando a URL.
- A desativação de um funcionário deve preservar o histórico dos atendimentos.

## Próxima etapa

Migrar o login simulado para autenticação real; modelar estabelecimento, perfis,
vínculos e agendamentos no banco; aplicar RLS e testes por perfil; somente depois
ativar as rotas `/medico`, `/secretaria` e `/administracao`.
