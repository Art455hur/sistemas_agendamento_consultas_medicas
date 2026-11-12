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

A conta do funcionário deve existir previamente no Auth. O formulário não cria
contas nem promove administradores. Para editar, use o mesmo e-mail.
Os detalhes e restrições estão em [gestão de funcionários](gestao-funcionarios.md).

## Pendente

- Módulos de agenda e serviços, ainda indicados como “Em breve”.
- Gestão completa de especialidades e horários por profissional.
- Validação manual dos formulários, contas e tentativas negadas antes da publicação.

Não considerar o painel inteiro concluído só porque a gestão de equipe foi integrada.
Siga o [roteiro de testes](gestao-funcionarios.md#roteiro-manual-antes-de-publicar)
e registre evidências na PR/card. Não habilitar Auth na Vercel antes da revisão da equipe.
