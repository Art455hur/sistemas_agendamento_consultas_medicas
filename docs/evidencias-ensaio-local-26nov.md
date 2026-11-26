# Evidências do ensaio local — 26/11/2026

Registro dos testes manuais feitos com o roteiro “Ensaiar uma consulta do início ao
fim” da N2. Serve como evidência para os cards do PraxiLab indicados abaixo.
Não substitui um teste funcional completo na versão publicada.

## Ambiente

| Item | Valor |
| --- | --- |
| Código | `main` em `ae28ec6` (inclui as PRs #48, #49, #50 e #51) |
| Aplicação | `npm run dev` em `localhost:3000` |
| Banco | Supabase local em Docker (`127.0.0.1:54321`), sem `db reset` |
| Conferência do destino | Requisição `auth/v1/token` observada no DevTools indo para `127.0.0.1:54321` antes de gravar dados |
| Dados | Contas, consultas, CPFs de exemplo e PDF de exame fictícios, criados só no banco local |
| Fuso da agenda | America/Sao_Paulo |

Contas usadas: um administrador, uma secretaria, dois médicos e duas pacientes,
todos fictícios. Senhas e chaves ficaram fora deste documento e do Git.

## Preparação dos dados

- A segunda paciente foi criada pelo próprio cadastro do site, com CPF de exemplo
  válido, e entrou em `/dashboard`.
- O segundo médico foi criado no Supabase Auth local e vinculado pela tela
  **Equipe** do administrador.
- O catálogo local de especialidades estava vazio, porque o médico de teste tinha
  sido preparado direto no banco em uma sessão anterior. Sem uma especialidade
  ativa com o mesmo nome do perfil, `booking_doctors` não lista o médico para o
  paciente. A especialidade foi cadastrada pelo painel do administrador. O
  vínculo feito pela tela Equipe já exige uma especialidade do catálogo.
- Para o fluxo médico, duas consultas da segunda paciente foram inseridas com
  SQL no banco local em 26/11, às 08:00 e às 09:00 (horário de São Paulo), porque
  a aplicação não agenda no passado. O relógio do computador não foi alterado.

## Resultados

| Fluxo | Esperado | Observado | Card relacionado |
| --- | --- | --- | --- |
| Duas pacientes, em sessões separadas, confirmam o mesmo médico, data e horário | Só a primeira reserva é aceita; a segunda recebe aviso e a lista de horários é atualizada | Conforme o esperado; a segunda paciente ficou sem consulta nesse horário | Impedir conflitos de horários |
| A mesma consulta vista por paciente, secretaria, médico e administrador | Mesmos dados nos quatro perfis, também depois de recarregar | Conforme o esperado | CRUD de agendamentos; painéis |
| Novo agendamento pela secretaria | Consulta criada e exibida na agenda da clínica | Conforme o esperado | Painel da secretaria e agenda da clínica |
| Remarcação pela secretaria | Só horários livres; desistir mantém a consulta; confirmar atualiza também para a paciente | Conforme o esperado; o horário ocupado não foi oferecido | CRUD de agendamentos |
| Cancelamento pela secretaria | Desistir mantém a consulta; confirmar muda para Cancelada, atualiza contador, aba e aviso do sino, e libera o horário | Conforme o esperado | CRUD de agendamentos; notificações |
| Consulta passada sem registro | “Aguardando registro”, sem marcação automática | Conforme o esperado | Painel do médico e sua agenda |
| Registrar “Atendida” e anotação | Anotação obrigatória; salvar, editar e manter depois de recarregar | Conforme o esperado; salvar vazio foi bloqueado | Painel do médico |
| Anexar exame | PDF aceito e baixado; tipo não permitido recusado | Conforme o esperado (`.txt` recusado) | Painel do médico |
| Registrar “Paciente faltou” | Contadores de atendidas, faltas e aguardando registro corretos | Conforme o esperado | Painel do médico |
| Resultado visto pela paciente e pela secretaria | Atendida e Falta visíveis, sem anotações, diagnóstico, conduta ou exame | Conforme o esperado | Controle de acesso por perfil |
| Segundo médico | Não vê as consultas do outro médico; o link direto do atendimento e o do exame não exibem dados | Conforme o esperado | Controle de acesso por perfil; reforço de segurança |
| Login dos quatro perfis, painel de outro perfil, retorno a link interno, Sair e Voltar, vínculo inativo e reativado | Ver PR #50 | Testado localmente em 25/11 e registrado na PR #50 | Autenticação; proteção de rotas e sessão |

## Celular (DevTools, iPhone 16, 393 px)

| Área | Observado |
| --- | --- |
| Secretaria e médico | Legíveis; botão **Sair** visível |
| Paciente | Botão **Sair** cortado na borda direita; menu ocupa cerca de meia tela antes do conteúdo |
| Administração | Página mais larga que a tela; **Sair**, selo do perfil e item “Horários” ficam cortados |

Os problemas do celular ficaram para a melhoria de layout e design, ainda não
implementada.

## O que este ensaio não cobre

- Teste funcional completo dos quatro perfis na versão publicada (Supabase online).
- Entrega real dos e-mails de confirmação e recuperação de senha no domínio publicado.
- Celular físico: a verificação usou a emulação do DevTools.
- Avisos de segurança do Supabase registrados no README em 26/11.
- Convites de funcionários pelo painel, ainda no backlog.
