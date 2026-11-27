# Publicação e conferência da N2

O site público é https://sistemas-agendamento-consultas-medi.vercel.app/.
A Vercel publica a branch `main`. Antes de apresentar, confira se o commit
do deployment pronto corresponde ao último merge que a equipe pretende mostrar.
Um preview de PR não é o mesmo que o site de produção.

Na revisão de 26/11/2026, a aplicação em `https://sistemas-agendamento-consultas-medi.vercel.app/`
respondeu HTTP 200 e a Vercel marcou o deploy da `main` em `80e52b2` como READY.
As PRs #48–#50 já integraram painéis da secretaria e do médico e login unificado.
As 22 migrações remotas estavam alinhadas às 22 versões do repositório.
Depois dessa verificação, as PRs #52–#54 acrescentaram evidências e roteiro
de demonstração, e a [PR #55](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/55)
integrou o menu móvel do paciente, ajustes visuais de administração, retorno
ao dashboard e mensagens específicas de confirmação e recuperação.
O READY acima refere-se ao commit anterior `80e52b2`: confirmar um novo
READY para a versão da `main` que inclui a PR #55 antes de apresentá-la.

## Verificação automática

O workflow **Testes e build** roda em PRs destinados à `main`, em pushes na
`main` e por execução manual na aba Actions. Ele instala as versões do lockfile
com `npm ci`, executa `npm test` e compila com `npm run build`, usando Node 22.
Depois executa os testes Playwright no build de demonstração em desktop e
celular emulado. O relatório fica disponível por sete dias no artefato
`testes-navegador`; veja [execução e limites](testes-ponta-a-ponta.md).
Uma falha interrompe o job e aparece nos checks do PR. Novos commits cancelam
uma execução anterior da mesma referência para evitar trabalho duplicado.

Os testes de banco usam PGlite descartável. O build usa Auth desligada apenas
nesse ambiente de CI, sem URL, chave do Supabase ou dados reais. O workflow não
altera a configuração da Vercel, não aplica migrações, não envia e-mails e não
publica o site por conta própria. O token tem somente leitura de conteúdo.

O check não bloqueia merge automaticamente: isso depende das regras de proteção
da branch, que não são alteradas por este arquivo. A equipe deve verificar o
resultado dos testes e da Vercel antes de integrar alterações.

O [workflow da `main` de 26/11/2026](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/45751679524)
concluiu todas as etapas com sucesso, incluindo Playwright em desktop e celular
emulado. A execução usa o modo de demonstração e não valida sessões reais,
permissões do banco hospedado ou entrega de e-mails.

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
- [ ] Validar os painéis já implementados de médico e secretaria com contas de
      teste, conferindo autorização por perfil, remarcação, cancelamento,
      registro de atendimento, histórico clínico e anexos de exames.
- [ ] Conferir confirmação e recuperação de e-mail com uma caixa acessível,
      usando o link mais recente e o domínio publicado; conta criada não comprova
      entrega do e-mail. Respeitar a cota e não apagar contas para tentar contorná-la.
- [ ] Testar logout e impedimento de acesso cruzado entre paciente, médico,
      secretaria e administrador no ambiente publicado.
- [ ] Percorrer o fluxo principal no celular físico e pelo teclado, incluindo
      abrir/fechar o menu do paciente, visualizar Sair, verificar que a
      administração não corta conteúdo e voltar ao dashboard após confirmar.
- [ ] Conferir as mensagens para links de confirmação/recuperação abertos no
      navegador correto e em outro navegador, sem presumir sucesso de Auth.
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
