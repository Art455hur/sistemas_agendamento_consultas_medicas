# Publicação e conferência da N2

O site público é https://sistemas-agendamento-consultas-medi.vercel.app/.
A Vercel publica a branch `main`. Antes de apresentar, confira se o commit
do deployment pronto corresponde ao último merge que a equipe pretende mostrar.
Um preview de PR não é o mesmo que o site de produção.

## Verificação automática

O workflow **Testes e build** roda em PRs destinados à `main`, em pushes na
`main` e por execução manual na aba Actions. Ele instala as versões do lockfile
com `npm ci`, executa `npm test` e compila com `npm run build`, usando Node 22.
Uma falha interrompe o job e aparece nos checks do PR. Novos commits cancelam
uma execução anterior da mesma referência para evitar trabalho duplicado.

Os testes de banco usam PGlite descartável. O build usa Auth desligada apenas
nesse ambiente de CI, sem URL, chave do Supabase ou dados reais. O workflow não
altera a configuração da Vercel, não aplica migrações, não envia e-mails e não
publica o site por conta própria. O token tem somente leitura de conteúdo.

O check não bloqueia merge automaticamente: isso depende das regras de proteção
da branch, que não são alteradas por este arquivo. A equipe deve verificar o
resultado dos testes e da Vercel antes de integrar alterações.

Para reproduzir no computador:

```bash
npm ci
npm test
npm run build
```

Não apague nem substitua seu `.env.local` para testar. O CI executa em ambiente
limpo. No Windows, use `npm.cmd` caso o PowerShell bloqueie `npm`.

## Conferência antes da apresentação

- [ ] Confirmar deployment READY da `main` e abrir o domínio público.
- [ ] Cadastrar/entrar como paciente, editar o perfil e verificar após novo login.
- [ ] Agendar, remarcar e cancelar; conferir atualização do horário disponível.
- [ ] Testar duas contas de paciente e confirmar que uma não acessa dados da outra.
- [ ] Entrar como administrador e conferir pacientes, profissionais,
      especialidades e agenda; testar busca/filtros e edição de profissionais.
- [ ] Concluir e validar os painéis próprios de médico e secretaria com seus
      responsáveis. Na base de 20/11/2026, esses caminhos ainda não estão no código.
- [ ] Conferir confirmação e recuperação de e-mail com uma caixa acessível,
      usando o link mais recente e o domínio publicado; conta criada não comprova
      entrega do e-mail. Respeitar a cota e não apagar contas para tentar contorná-la.
- [ ] Percorrer o fluxo principal no celular e pelo teclado.
- [ ] Preparar contas fictícias previamente verificadas para demonstrar o fluxo
      caso o provedor de e-mail esteja indisponível. Não expor senhas no repositório
      nem desativar a confirmação de e-mail em produção para a apresentação.

Os itens acima são critérios pendentes de conferência, não uma declaração de
aprovação. Testes unitários e de banco não comprovam a experiência no navegador,
a entrega de e-mails ou as permissões da configuração hospedada.

## Se um check falhar

Abra o job na aba Actions e leia a primeira etapa com erro. Falha em `npm ci`
pode indicar divergência entre manifesto e lockfile; falha em testes deve ser
investigada antes de integrar. Reexecute apenas se houver motivo para considerar
a falha transitória. Não remova testes nem use `continue-on-error` para ocultá-la.
