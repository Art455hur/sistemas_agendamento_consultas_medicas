# Validação do CPF

O cadastro e a edição do perfil usam a função compartilhada `isValidCpf`, em
`src/lib/cpf.js`, antes de enviar ou salvar os dados. O serviço de atualização do
perfil também executa a validação antes de chamar o Supabase. A regra vale para
os formulários no modo de demonstração e no modo Supabase.

## Regra implementada

- Aceita 11 números ou a máscara `000.000.000-00`, com espaços externos opcionais.
- Rejeita tamanho incorreto e sequências com todos os números iguais.
- Calcula e confere os dois dígitos verificadores.
- Exibe “Digite um CPF válido.” ao impedir a operação.

É uma validação matemática, sem consulta à Receita Federal, situação cadastral
ou comprovação de titularidade. Os dados fictícios dos testes não são associados
a pessoas. `123.456.789-09` é um vetor de teste que passa na regra matemática;
`123.456.789-01` e `111.111.111-11` devem ser rejeitados.

CPFs antigos armazenados não são reescritos ou removidos. Ao editar o perfil,
um CPF que não passe na regra deve ser corrigido antes de salvar, inclusive quando
apenas outro campo estiver sendo alterado. Use dados fictícios nos testes.

## Validação no Supabase

A migração `20261112173011_validar_cpf_perfis.sql` acrescenta
`private.is_valid_cpf(text)` e o trigger `profiles_validate_cpf` em `public.profiles`.
Ambas as funções usam `SECURITY INVOKER` e `search_path` vazio; não concedem acesso
adicional a dados ou papéis. A função matemática não é uma RPC no esquema público.

O trigger rejeita com SQLSTATE `23514` e mensagem “CPF inválido.” qualquer CPF novo
ou alterado com dígitos incorretos ou números repetidos, inclusive em chamadas
que ignorem os formulários. O banco espera 11 números sem máscara. O trigger de
criação de perfis a partir do Auth também passa por essa validação ao inserir o perfil.
CPF nulo continua permitido para contas ainda sem o dado; formato e unicidade existentes
permanecem em vigor.

Um CPF inválido antigo pode permanecer quando o número não muda. Isso permite editar
outros dados diretamente no banco/API e gerir funcionários sem alterar o legado.
Um novo valor inválido continua proibido; depois de corrigido, o antigo valor inválido
não pode ser restaurado. O formulário de perfil mantém sua validação mais estrita:
exige corrigir o CPF antes de salvar, mesmo ao editar outro campo.

Foi escolhido um trigger que considera a mudança do número, em vez de uma restrição
CHECK sobre todas as linhas, para preservar os dados fictícios existentes. Não há
limpeza automática nem garantia de que todos os CPFs históricos sejam válidos.

## Aplicação e limites

A migração já foi aplicada no projeto de testes `rgggijnypvvdkskyalip` e consta no
histórico remoto com versão `20261112173011`. O arquivo criado pela CLI foi alinhado
a essa versão. Não executar novamente nesse projeto. Em outro ambiente, aplicar
somente migrações pendentes na ordem de versão.

Verificação em 12/11/2026: 52 testes automatizados aprovados. No banco hospedado,
a atualização como `authenticated` rejeitou CPF inválido e aceitou um CPF de teste
matematicamente válido; a transação foi revertida. Os 11 perfis e o único CPF antigo
preenchido foram preservados. O trigger foi conferido ativo, com funções invoker e
sem execução da função matemática por anônimos. Os avisos de segurança existentes
permanecem sem novos avisos desta entrega.

Esta entrega não altera os campos enviados pelo cadastro ao Supabase Auth, tarefa
que permanece com o integrante responsável por “Criar usuários”. Também não habilita
Auth no site publicado nem muda as configurações da Vercel.

## Verificação

```bash
node --test tests/cpf.test.js tests/patient-profile.test.js tests/cpf-database.test.js
npm test
npm run build
```

Os testes conferem máscara, zero à esquerda, entradas inválidas, todos os números
repetidos, erros em cada dígito verificador e bloqueio de atualização de perfil
inválido antes de acessar o banco. Os testes SQL também cobrem gravação direta,
metadados Auth, preservação do legado, CPF opcional, unicidade e isolamento por RLS.

Roteiro manual para revisão:

1. No cadastro, preencha os demais campos com dados fictícios e um CPF com
   dígitos incorretos. Envie: deve aparecer o erro sem criar a conta.
2. Troque por um CPF de teste com dígitos corretos e repita. A validação do CPF
   deve permitir seguir; as demais regras do cadastro continuam valendo.
3. No perfil de teste, tente salvar um CPF repetido ou com dígitos incorretos.
   O erro deve impedir o salvamento, preservando os dados anteriores.
4. Salve um CPF de teste válido e confira após recarregar. No modo Supabase,
   também deve ser respeitada a regra de CPF único por conta.

Não é necessário usar CPFs de pessoas reais. O card geral de validações continua
em andamento até que os demais campos e critérios também sejam revisados.
