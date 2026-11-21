# Roteiro de demonstração da N2 — AgendaSaúde

Preparado por Sandro para o card **Preparar demonstração da N2**.
Este roteiro organiza a apresentação da versão disponível; não certifica
funcionalidades ainda não validadas.

## Links para deixar abertos

- [Site publicado](https://sistemas-agendamento-consultas-medi.vercel.app/)
- [Repositório](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas)
- [PR #46: correção móvel e testes de navegador](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/pull/46)
- [Validação da main após o merge](https://github.com/Art455hur/sistemas_agendamento_consultas_medicas/actions/runs/44807602752)
- [Contribuições e limites dos testes](revisao-testes-funcionalidades.md)
- [Conferência de publicação](publicacao-n2.md)

A execução acima validou a base `3ccc737`: 128 testes Node/PGlite,
28 execuções de navegador (14 cenários em duas configurações) e build.
A Vercel foi conferida como READY nessa base. Verifique o deployment atual
se a equipe integrar novos commits.

## Antes de apresentar

- Separar uma conta de paciente de teste já confirmada e uma conta de
  administrador autorizada. Guardar as senhas fora dos slides e do Git.
- Usar dados fictícios e horários de teste combinados com a equipe.
- Ensaiar as ações abaixo antes de executá-las diante do professor.
- Combinar quem apresenta cada módulo. Usar os autores registrados no Git;
  a soma dos testes pertence à equipe.
- Confirmar a entrega formal no Praxi. Ter código na main ou cards concluídos
  não comprova que o formulário de entrega foi enviado.

## Sequência sugerida — 8 a 10 minutos

| Tempo | O que mostrar | O que explicar |
| --- | --- | --- |
| 1 min | Home e especialidades | O problema é organizar consultas e disponibilidade de profissionais. A interface foi feita com Next.js; persistência e autenticação usam Supabase. |
| 2 min | Login de paciente, perfil e meus agendamentos | Mostrar a conta de teste e a separação dos dados do paciente. Editar um dado fictício e conferir após atualizar, se esse fluxo tiver sido ensaiado no ambiente. |
| 2 min | Agendar, remarcar e cancelar uma consulta de teste | Selecionar profissional, data e horário disponível. Mostrar como a lista e os horários são atualizados. Explicar que o banco verifica conflitos novamente ao confirmar. |
| 2 min | Área administrativa | Com a conta autorizada, apresentar pacientes, profissionais, especialidades e agenda. Mostrar busca/filtros de profissionais; evitar alterar contas reais durante a demonstração. |
| 1 min | GitHub Actions e PR #46 | Exibir os checks aprovados. Explicar que a execução móvel encontrou o botão Entrar escondido e que a correção ganhou teste de regressão em 320 px. |
| 1 min | Pendências e próximos passos | Distinguir o que está publicado, o que foi testado automaticamente e o que ainda exige validação real. |

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

Na conferência da base `3ccc737`, as rotas próprias de médico e secretaria
não estavam na main, apesar de seus cards constarem concluídos no quadro.
Alinhar essa entrega com o responsável antes de demonstrá-la como integrada.
A criação das contas de teste, o ensaio por perfil e a validação real de e-mail
continuam sendo verificações separadas do preparo deste roteiro.

## Conferência final do apresentador

- [ ] Contas fictícias e permissões conferidas.
- [ ] Fluxos escolhidos ensaiados no ambiente que será apresentado.
- [ ] Links, PRs e resultado dos testes acessíveis.
- [ ] Pendências explicadas com clareza.
- [ ] Autoavaliação e entrega formal preenchidas pelo responsável com dados reais.
