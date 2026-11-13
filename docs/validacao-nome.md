# Validação do nome do paciente

Subtarefa do card **Implementar validações de dados**, responsável Arthur.

Cadastro e perfil passam a usar `patientNameError`, em
`src/shared/validation/patient-name.js`. A função também é chamada pelo serviço
`savePatientProfile` antes de consultar a sessão ou enviar uma atualização.

## Regra

- O nome deve ter entre 3 e 120 caracteres após `trim()`.
- Espaços no início e no fim não contam para os limites e são removidos ao salvar.
- Espaços internos, acentos, apóstrofos e hífens são preservados.
- Não é obrigatório conter sobrenome: `Ana` é uma entrada válida pela regra.
- Nome fora dos limites apresenta “Informe um nome entre 3 e 120 caracteres.”.

O cadastro já exigia no mínimo três caracteres, mas não verificava o limite de
120 no handler. O serviço do perfil aceitava nomes de um ou dois caracteres e o
modo de demonstração não aplicava a mesma regra. Agora os fluxos usam a função
compartilhada para evitar essas diferenças.

## Retorno visual do perfil

Mensagens de erro no perfil usam texto vermelho, fundo vermelho claro e borda
vermelha clara (`.profile-message.error`). Isso inclui erros de validação,
carregamento e salvamento. A confirmação de sucesso permanece verde. O texto e
os papéis acessíveis `alert`/`status` continuam diferenciando os resultados.

## Escopo

Esta entrega modifica a validação de nome do paciente na aplicação, seus testes,
o retorno visual de erro no perfil e esta documentação. Mantém os campos e o fluxo de cadastro já
integrados pela equipe. Não altera serviços administrativos, dados existentes,
SQL, permissões ou configurações de Auth/Vercel.

A validação ocorre ao cadastrar ou salvar; nomes antigos fora dos limites não
são reescritos automaticamente. Ao editar o perfil, é necessário corrigir o nome
antes de salvar. Não é uma comprovação da identidade da pessoa.

As restrições do banco continuam independentes. Chamadas diretas à Data API não
recebem uma nova restrição SQL de nome nesta entrega. As regras dos formulários
administrativos permanecem sob seus próprios serviços e funções de banco.

## Testes

```bash
node --test tests/patient-name.test.js tests/patient-profile.test.js
npm test
npm run build
npm run test:e2e:install
npm run test:e2e -- --workers=2 --reporter=line
```

Os testes unitários conferem limites de 3/120, rejeição de 1/2/121, espaços e tipos
inesperados. Os testes do serviço comprovam que um nome inválido não consulta a
sessão nem escreve dados e que um nome válido é enviado sem espaços externos.

`tests/e2e/patient-name.spec.js` verifica erro no cadastro sem gravar dados locais,
erro no perfil sem sobrescrever o nome anterior e persistência de um nome válido
após recarregar a tela. A suíte roda somente com dados fictícios, Auth desligada
e requisições externas bloqueadas. Não substitui validação com Supabase Auth real.

Nesta entrega, `npm test` passou com 104 testes e `npm run build` foi concluído.
Os dois cenários novos tiveram descoberta/sintaxe conferidas pelo Playwright.
A instalação do Chromium recebeu um ZIP inválido; a alternativa com Chromium
do sistema também foi tentada usando configuração temporária, mas a criação de
socket foi recusada pelo ambiente (Operation not permitted). Os 13 cenários
falharam no lançamento do navegador, antes de interagir com a aplicação. As
configurações temporárias foram removidas. A validação da interface permanece
pendente para o revisor em um ambiente que permita iniciar o navegador.

O card geral de validações permanece em andamento enquanto houver outros campos
ou critérios pendentes. A conclusão desta subtarefa não conclui os cards de
cadastro de usuários, painel administrativo ou testes de toda a aplicação.
