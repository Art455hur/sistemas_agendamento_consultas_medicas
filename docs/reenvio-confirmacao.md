# Reenvio de confirmação de e-mail

Após cadastrar no Supabase sem uma sessão ativa, a tela mostra o endereço usado e a opção de reenviar a confirmação. A mesma opção aparece quando a API informa que o e-mail já está cadastrado. Se o cadastro já devolveu uma sessão, não pede confirmação adicional.

O primeiro reenvio fica disponível após 60 segundos. Cada tentativa bloqueia outra por pelo menos 60 segundos, inclusive em falhas. Uma requisição ainda em andamento também impede outra. O temporizador é uma proteção de interface; os limites reais continuam sendo aplicados pelo Supabase. Recarregar a página não preserva essa etapa do formulário.

O botão chama `auth.resend` com `type: "signup"`, o endereço do cadastro e o mesmo `/auth/callback` usado no cadastro. Uma resposta aceita é apresentada como pedido de reenvio, sem afirmar entrega. O erro `over_email_send_rate_limit` orienta tentar mais tarde e não apagar a conta; outros limites e falhas de conexão têm mensagens próprias. Não há repetição automática.

## Validação

- `npm test`: inclui envio com parâmetros corretos, espera inicial, cliques simultâneos, requisição demorada, nova tentativa após o intervalo, limite de e-mails e falha de rede.
- `npm run build`: verifica a compilação da tela e do componente.
- A conferência visual e a entrega real de e-mail ainda precisam ser feitas na prévia. O navegador local de teste não iniciou por restrição do ambiente. Os testes automatizados usam respostas simuladas e não enviam e-mails.

## Conferência na prévia

1. Cadastrar um usuário de teste com um e-mail acessível. Conferir o endereço no painel de confirmação e o contador antes de o botão ser liberado.
2. Após 60 segundos, clicar em Reenviar confirmação. Conferir o estado de envio, a mensagem e o novo intervalo. Não solicitar vários envios para evitar consumir a cota compartilhada.
3. Abrir o link mais recente na mesma sessão do navegador usada no cadastro e confirmar que o login funciona.
4. Conferir a tela no celular. Se o serviço retornar limite ou houver falha de rede, verificar se aparece a orientação correspondente sem falso sucesso.

Esta mudança não configura SMTP, aumenta cotas ou altera tabelas, políticas e confirmações de usuários. A configuração de um provedor de e-mail continua sendo uma tarefa separada. O PR deve permanecer em rascunho até a validação e autorização para merge.
