# Notificações integradas aos agendamentos

## Escopo

O sino do menu usa os agendamentos retornados pelo serviço existente, tanto no
modo de demonstração quanto no Supabase. Cada consulta futura ou cancelada gera
um aviso com especialidade, profissional, data, horário e link para a consulta.
A próxima consulta vem primeiro; as demais futuras seguem por horário e os
cancelamentos, depois, por data decrescente.

A remarcação atualiza a data e o horário do mesmo aviso. O cancelamento substitui
o aviso futuro pelo cancelado, com link para a aba Canceladas. Consultas
concluídas ou passadas não aparecem como próximas. Registros sem identificação
ou sem horário válido são ignorados.

O contador representa o **total de avisos atuais**, incluindo cancelamentos,
mesmo quando não existem consultas futuras. Não é um contador de não lidas.
Não há marcação de leitura ou histórico de eventos; abrir o painel não apaga
avisos. Os cancelamentos permanecem enquanto constarem nos agendamentos.

São avisos internos, sem e-mail, SMS, push ou tarefa agendada no servidor. Não se
cria uma segunda cópia das consultas em armazenamento local.

## Atualização e acesso

O hook `useAppointments` recarrega os dados:

- Após criação, remarcação ou cancelamento bem-sucedido, pelo evento já emitido
  pelo serviço (`appointmentsUpdated`). Uma falha não emite um falso sucesso.
- Ao voltar à janela ou tornar a aba visível.
- No modo simulado, quando outra aba altera `appointments`, `authToken` ou limpa
  o armazenamento local.
- A cada 60 segundos com a aba visível. Isso também remove avisos de horários que
  passaram e permite perceber alterações feitas em outra sessão Supabase.

Não é Supabase Realtime: alterações externas podem levar até um minuto para
aparecer na aba visível. Os consumidores do hook compartilham uma única consulta e um único
intervalo por aplicação aberta. Aba oculta não executa consultas periódicas; listeners e intervalo
são removidos na desmontagem. O controle já existente de respostas antigas é
preservado e os dados são limpos em mudanças de sessão Supabase.

O painel e o contador não exibem consultas anteriores durante carregamento ou
falha. Mensagens de carregamento, erro e lista vazia são diferenciadas. O painel
fecha por botão, Escape ou clique externo. Escape devolve o foco ao sino.

No modo real, a consulta continua filtrada por `patient_id` da sessão e sujeita
às políticas existentes. Nenhuma política, tabela ou migração é alterada por
este card. A consulta de identificação do projeto Supabase foi somente leitura.
O modo simulado mantém suas limitações de isolamento e não deve conter dados reais.

## Links para os agendamentos

Cada aviso aponta para `/agendamentos?aba=scheduled#consulta-<id>` ou
`/agendamentos?aba=cancelled#consulta-<id>`. A listagem acompanha mudanças no
parâmetro `aba`, inclusive quando o paciente já está na mesma página, e destaca
o cartão correspondente. Após carregar a consulta, a página rola até o cartão;
a atualização periódica não força novas rolagens para o mesmo destino.

## Validação

```bash
npm test
npm run build
git diff --check
```

Sete testes novos cobrem a evolução criação → remarcação → cancelamento, total
com apenas cancelamentos, expiração de horários, ordenação, dados inválidos e
legados, atualização pelos eventos e pausa/limpeza do intervalo. A suíte atual
tem 71 testes, incluindo as entregas anteriores da equipe. Testes de banco usam
PGlite descartável e não gravam no Supabase compartilhado.

Roteiro manual em demonstração com dados fictícios:

1. Agendar duas consultas futuras e conferir dois avisos com detalhes; a próxima
   aparece primeiro. Abrir um aviso e conferir a aba e o cartão destacados.
2. Remarcar uma consulta e confirmar que o aviso passa a mostrar o novo horário,
   sem duplicar a consulta.
3. Cancelar uma consulta e abrir seu aviso; conferir a aba Canceladas. Repetir
   quando já estiver na página Agendamentos em outra aba de status.
4. Manter apenas cancelamentos e conferir que o sino continua com contador.
5. Alterar os agendamentos em outra aba da mesma origem, voltar à primeira e
   conferir atualização. Horários passados devem sair dos avisos futuros.
6. Conferir abertura e fechamento pelo teclado, clique externo, lista longa e
   largura de celular. Verificar os estados vazio, carregamento e falha.
7. Em ambiente de teste Supabase, validar o isolamento com duas contas e a
   atualização ao alternar a sessão. Esse roteiro exige contas de teste e não
   autoriza ativar autenticação no site publicado.

A suíte automatizada e a compilação não substituem a conferência das interações
no navegador e do fluxo real com contas de teste.

## Publicação

Manter `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH` desligada na Vercel. A entrega é uma
branch com PR; aguardar revisão de outro integrante antes do merge. Não aplicar
migrações nem alterar a publicação de Realtime para este card.
