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

## Limites

Esta entrega cobre a aplicação e não modifica o esquema ou as migrações. O banco
mantém as restrições existentes de formato e unicidade, sem cálculo de dígitos
verificadores. Chamadas diretas à API que ignorem o cliente não recebem essa nova
proteção matemática no banco; sua implementação exige outro incremento e migração.
Esta entrega também não altera os campos enviados pelo cadastro ao Supabase Auth.

## Verificação

```bash
node --test tests/cpf.test.js tests/patient-profile.test.js
npm test
npm run build
```

Os testes conferem máscara, zero à esquerda, entradas inválidas, todos os números
repetidos, erros em cada dígito verificador e bloqueio de atualização de perfil
inválido antes de acessar o banco.

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
