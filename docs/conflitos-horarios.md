# Conflitos de horários

Uma reserva só é confirmada depois de ser aceita pelo banco. A lista de horários
é uma consulta de disponibilidade e pode mudar enquanto a tela estiver aberta.
Os índices únicos de `appointments` protegem o horário do médico e do paciente
para consultas com status `scheduled`, inclusive em duas transações simultâneas.
A proteção vale tanto para novos agendamentos como para remarcações.

A tela atualiza a disponibilidade ao voltar à aba e pelo botão **Atualizar horários**.
Uma seleção que deixou de estar disponível é limpa. Se outra conta ocupar o
horário entre a consulta e a confirmação, o banco rejeita a tentativa e a tela
mostra uma mensagem, limpa a seleção e busca os horários novamente.
A data fica bloqueada durante o salvamento.

## Verificação

`npm test` cobre conflitos por médico e por paciente, remarcação para horário
ocupado sem perda da consulta original, manutenção do próprio horário, liberação
do horário antigo e cancelamento. Médicos distintos podem atender pacientes
distintos no mesmo instante. `npm run build` verifica a compilação.

Para verificar concorrência real com duas conexões PostgreSQL, de forma opcional:

```sh
npm install --no-save --package-lock=false --ignore-scripts embedded-postgres@18.6.0-beta.19
node scripts/check-booking-concurrency.mjs
```

O script sobe um PostgreSQL temporário em `127.0.0.1:55439`, aplica as migrações
e cria somente dados fictícios locais. Não usa as variáveis do Supabase.
Confere que a segunda transação aguarda o bloqueio da primeira e recebe `23505`
após o commit, sem duplicar a reserva. Testa dois pacientes disputando um médico,
um paciente disputando dois médicos e uma reserva disputando com remarcação.
O servidor é encerrado ao final. Executado em 12/11/2026: os três cenários passaram.

## Teste pela tela

1. Abra duas sessões com pacientes diferentes e escolha o mesmo médico, data e horário.
2. Confirme na primeira e tente confirmar a seleção antiga na segunda.
3. Só a primeira deve ser confirmada. A segunda deve pedir outro horário.
4. Confira que o horário ocupado some ao atualizar a disponibilidade.
5. Remarque ou cancele a primeira consulta; o horário antigo deve voltar a ficar livre.

A grade atual usa horários fixos no fuso de Brasília. Gestão de disponibilidade
e consultas com duração variável pertencem a outros cards.
