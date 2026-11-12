# Painel do administrador — N2

A rota `/administracao` tem layout responsivo e exige Auth Supabase habilitada,
sessão válida, `profiles.role = 'admin'` e vínculo ativo no Hospital Sapiens.
Com a flag desligada, informa indisponibilidade. Dados locais não concedem acesso.

## Implementado

- Listagem da equipe por `admin_list_staff`.
- Formulário para vincular/editar médicos e secretárias por `admin_save_staff`.
- Nome obrigatório; especialidade obrigatória para médico.
- Desativação por `admin_deactivate_staff` e reativação por `admin_reactivate_staff`.
- Verificação de administrador ativo no banco e preservação do histórico.
- Consulta da agenda por dia no fuso `America/Sao_Paulo`, limitada às consultas
  de médicos vinculados ao Hospital Sapiens, inclusive histórico de inativos.
  A RPC `admin_list_appointments` retorna somente horário, nomes, especialidade
  e status (até 200 linhas por dia); não retorna CPF, telefone nem motivo.

A conta do funcionário deve existir previamente no Auth. O formulário não cria
contas nem promove administradores. Para editar, use o mesmo e-mail.
Os detalhes e restrições estão em [gestão de funcionários](gestao-funcionarios.md).

## Pendente

- Escrita/alteração de consultas pelo administrador e módulo de serviços.
- Gestão completa de especialidades e horários por profissional.
- Validação manual dos formulários, contas e tentativas negadas antes da publicação.

Não considerar o painel inteiro concluído só porque a gestão de equipe foi integrada.
Siga o [roteiro de testes](gestao-funcionarios.md#roteiro-manual-antes-de-publicar)
e registre evidências na PR/card. Não habilitar Auth na Vercel antes da revisão da equipe.

Para testar a agenda: aplicar somente a nova migração pendente em um ambiente
de teste, entrar como administrador ativo, selecionar um dia com consultas e
conferir os horários, pacientes, médicos e estados. Repetir com paciente,
médico, secretaria, visitante e administrador desativado: nenhum deles deve
conseguir chamar a RPC de agenda. O filtro usa o dia da clínica, não o do aparelho.
