# Painel do administrador — N2

A rota `/administracao` tem layout responsivo e exige Auth Supabase habilitada,
sessão válida, `profiles.role = 'admin'` e vínculo ativo no Hospital Sapiens.
Com a flag desligada, informa indisponibilidade. Dados locais não concedem acesso.

## Implementado

- Listagem da equipe por `admin_list_staff`.
- Formulário para vincular/editar médicos e secretárias por `admin_save_staff`.
- Nome obrigatório; especialidade obrigatória para médico.
- Desativação por `admin_deactivate_staff` e reativação por `admin_reactivate_staff`.
- CRUD de especialidades, com proteção de histórico e catálogo de médicos ativos.
- Verificação de administrador ativo no banco e preservação do histórico.
- Consulta da agenda por dia no fuso `America/Sao_Paulo`, limitada às consultas
  de médicos vinculados ao Hospital Sapiens, inclusive histórico de inativos.
  A RPC `admin_list_appointments` retorna somente horário, nomes, especialidade
  e status (até 200 linhas por dia); não retorna CPF, telefone nem motivo.
- Página `/administracao/horarios` para configurar os cinco horários da grade
  por médico ativo e dia (hoje até 365 dias). Sem configuração vale a grade
  padrão; desmarcar todos fecha o dia e restaurar remove a personalização.
  O banco bloqueia a remoção de horários com consultas agendadas e usa a mesma
  grade ao listar opções e validar criação/remarcação de consultas.

A conta do funcionário deve existir previamente no Auth. O formulário não cria
contas nem promove administradores. Para editar, use o mesmo e-mail.
Os detalhes e restrições estão em [gestão de funcionários](gestao-funcionarios.md).

## Pendente

- Escrita/alteração de consultas pelo administrador e módulo de serviços.
- Grade semanal recorrente e inclusão de horários fora dos cinco horários
  atuais; esta etapa configura datas individuais.
- Reorganização visual do painel em telas próprias para Agenda, Equipe e outros módulos.
- Validação manual dos formulários, contas e tentativas negadas antes da publicação.

Não considerar o painel inteiro concluído só porque a gestão de equipe foi integrada.
Siga o [roteiro de testes](gestao-funcionarios.md#roteiro-manual-antes-de-publicar)
e registre evidências na PR/card. Não habilitar Auth na Vercel antes da revisão da equipe.

Para testar a agenda: entrar como administrador ativo, selecionar um dia com consultas e
conferir os horários, pacientes, médicos e estados. Repetir com paciente,
médico, secretaria, visitante e administrador desativado: nenhum deles deve
conseguir chamar a RPC de agenda. O filtro usa o dia da clínica, não o do aparelho.

Antes de testar horários em um ambiente compartilhado, revisar a migração
`20261112194248_horarios_profissionais.sql` e aplicá-la uma única vez após
a PR aprovada. Em seguida, escolher um médico ativo e um dia futuro, salvar
uma seleção menor, confirmar as opções no agendamento do paciente e restaurar
a grade. Conferir também que não é possível remover um horário com consulta
marcada nem configurar como paciente, médico ou administrador sem vínculo ativo.
