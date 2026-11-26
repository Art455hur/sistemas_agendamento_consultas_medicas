# Roteiro de demonstração da N2 — AgendaSaúde

Preparado por Sandro para o card **Preparar demonstração da N2**.
Atualizado em 26/11/2026 com os painéis da secretaria e do médico, o login
único por perfil e os dados de demonstração preparados em produção.
Este roteiro organiza a apresentação da versão disponível; não certifica
funcionalidades ainda não validadas.

## Links para deixar abertos

- [Site publicado](https://sistemas-agendamento-consultas-medi.vercel.app/)
- [Repositório](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas)
- [PR #46: correção móvel e testes de navegador](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/46)
- [Validação da main após o merge](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/44807602752)
- [Contribuições e limites dos testes](revisao-testes-funcionalidades.md)
- [Conferência de publicação](publicacao-n2.md)
- [PR #48: painel da secretaria](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/48)
- [PR #49: painel do médico](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/49)
- [PR #50: login único e botão Sair](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/50)
- [Evidências do ensaio local de 26/11](evidencias-ensaio-local-26nov.md)
- [Reforço de segurança e avisos do Supabase](reforco-seguranca.md)

A execução acima validou a base `3ccc737`: 128 testes Node/PGlite,
28 execuções de navegador (14 cenários em duas configurações) e build.
A Vercel foi conferida como READY nessa base.

Em 26/11/2026 a `main` estava em `4200c40`, com as PRs #48 a #53. Antes de
apresentar, confirmar na Vercel que o deployment de produção está READY no
commit atual da `main`.

## Dados de demonstração em produção

Preparados em 26/11/2026 pelo próprio sistema, com nomes fictícios. As senhas
ficam com a equipe, fora dos slides e do Git.

| Perfil | Conta | Uso na apresentação |
| --- | --- | --- |
| Paciente | Paciente Demonstração | Agendar, remarcar, cancelar e ver o histórico |
| Secretaria | Sofia Demo | Agenda da clínica e novo agendamento |
| Médica | Dra. Ana Demo (Clínica Geral) | Agenda do dia e registro do atendimento |
| Médicos | Dr. Bruno Demo (Cardiologia), Dra. Carla Demo (Pediatria) | Opções de agendamento |
| Administrador | conta administrativa da equipe | Equipe, especialidades, horários e pacientes |

Consultas já marcadas para a demonstração:

- Dra. Ana Demo em 27/11 e em 04/12, no início da tarde. À noite, na data da
  apresentação, essa consulta terá passado e aparecerá como
  **Aguardando registro** para a médica.
- Dr. Bruno Demo em 30/11 às 10:00, para mostrar remarcação ou cancelamento.

Há grade de horários em 30/11 e 07/12 para os três médicos. As contas de teste
antigas foram desativadas pela tela Equipe ou Pacientes, sem exclusão. Datas
anteriores ainda podem mostrar consultas canceladas de testes; mostrar apenas
as datas acima ou filtrar a agenda por situação.

## Antes de apresentar

- Conferir que as contas da tabela acima entram e abrem o painel certo.
- Usar dados fictícios e horários de teste combinados com a equipe.
- Ensaiar as ações abaixo antes de executá-las diante do professor.
- Combinar quem apresenta cada módulo. Usar os autores registrados no Git;
  a soma dos testes pertence à equipe.
- Confirmar a entrega formal no Praxi. Ter código na main ou cards concluídos
  não comprova que o formulário de entrega foi enviado.

## Sequência sugerida — 10 a 12 minutos

| Tempo | O que mostrar | O que explicar |
| --- | --- | --- |
| 1 min | Home e especialidades | O problema é organizar consultas e disponibilidade de profissionais. A interface foi feita com Next.js; persistência e autenticação usam Supabase. |
| 1 min | Login único | Uma tela `/login` para os quatro perfis. O sistema consulta o papel no banco pelo ID da sessão e abre o painel do perfil; não usa o texto do e-mail. |
| 2 min | Paciente: agendar e acompanhar | Selecionar especialidade, profissional, data e horário livre. Mostrar Meus agendamentos e o aviso no sino. Explicar que o banco confere conflitos de novo ao confirmar. |
| 2 min | Secretaria (Sofia Demo) | Agenda da clínica por data e situação. Mostrar a consulta da paciente; remarcar oferecendo só horários livres ou cancelar com confirmação. |
| 2 min | Médica (Dra. Ana Demo) | Somente a própria agenda. Consulta que já passou aparece como Aguardando registro; marcar Atendida, salvar a anotação e, se ensaiado, anexar um exame fictício. |
| 1 min | Resultado nos outros perfis | A paciente vê Atendida no histórico, sem anotações nem exames do médico. |
| 1 min | Administração | Equipe com vínculos ativos e inativos, especialidades, grade de horários e pacientes. Não alterar contas reais. |
| 1 min | Acesso por perfil | Com a secretaria, digitar `/medico`: o sistema volta para a área dela. Clicar em Sair e tentar voltar: pede login de novo. |
| 1 min | Testes e evidências | Checks do GitHub Actions e o documento de evidências do ensaio local de 26/11. |

Se uma operação não foi ensaiada no ambiente publicado, apresentar seu código
e a evidência automatizada com essa ressalva, sem dizer que foi demonstrada.

## Fala curta sobre as entregas de Sandro

“As minhas entregas desta etapa estão nas PRs #42, #43, #44 e #46.
Acrescentei testes de integração da gestão de pacientes, busca e filtros de
profissionais e a execução automática de testes e build. Ao executar os fluxos
também no tamanho de celular, apareceu um erro: o botão de login sumia.
Corrigi o cabeçalho e acrescentei uma regressão para uma tela estreita.
Os cenários anteriores da equipe foram preservados.”

A fala descreve entregas verificáveis no repositório. Cada integrante deve
explicar sua parte e ajustar o relato à própria experiência.

## Perguntas técnicas que podem aparecer

**Por que testar conflito no banco?** Duas pessoas podem escolher o mesmo
horário antes de qualquer uma confirmar. Conferir apenas a tela não resolve
essa disputa; as regras do banco precisam rejeitar a gravação conflitante.

**O que os testes de navegador comprovam?** Os caminhos de demonstração:
home, especialidades, cadastro/login, validações, perfil e navegação em desktop
e celular emulado. Não comprovam recebimento de e-mail ou sessão real do
Supabase.

**Qual a diferença entre commit, PR e deploy?** Commit registra uma alteração;
PR reúne mudanças para integração; deploy publica uma versão. Um PR aberto
não significa que a mudança já está no endereço de produção.

**Como mostrar contribuição individual?** Abrir os commits e as alterações da
PR correspondente. Não atribuir a uma pessoa todo o código ou a suíte da equipe.

## Se o e-mail ou a internet falhar

- Usar a conta de teste previamente confirmada. Não apagar usuários nem
  desativar a confirmação em produção para forçar a apresentação.
- Mostrar a execução já registrada no GitHub e explicar o limite observado.
- Se houver cópia local preparada, usar o modo de demonstração com Auth
  desligada e identificar claramente que ele usa armazenamento local.
  Não apresentar dados locais como se fossem persistência no Supabase.

## Pendências que não devem ser escondidas

- Na tela de celular, a área do paciente corta o botão Sair e o painel de
  administração fica mais largo que a tela. Apresentar em desktop. A correção
  está prevista na melhoria de layout.
- O link de confirmação de cadastro pode mostrar que não foi possível verificar
  o link, mesmo com a conta confirmada, quando aberto em outro navegador.
  A conta funciona; a mensagem precisa ser revista.
- Notificações são avisos internos no sino; não há envio de e-mail, SMS ou push
  sobre consultas.
- Não há convite de funcionários pelo painel: a conta é criada no Supabase Auth
  e depois vinculada na tela Equipe.
- Um médico tem uma única especialidade, e a grade semanal recorrente de
  horários ainda não existe.
- Os testes de navegador cobrem o modo de demonstração; os fluxos com login
  real foram ensaiados manualmente (ver evidências).

## Conferência final do apresentador

- [ ] Contas fictícias e permissões conferidas.
- [ ] Deployment de produção READY no commit atual da `main`.
- [ ] Consulta da Dra. Ana Demo no dia da apresentação aparecendo como Aguardando registro.
- [ ] Fluxos escolhidos ensaiados no ambiente que será apresentado.
- [ ] Links, PRs e resultado dos testes acessíveis.
- [ ] Pendências explicadas com clareza.
- [ ] Autoavaliação e entrega formal preenchidas pelo responsável com dados reais.
