# Refatoração de código e componentes do paciente

## Escopo

Este card extrai código repetido e responsabilidades de apresentação das telas
existentes. Complementa a organização de pastas do card de arquitetura: agora as
páginas reutilizam componentes em vez de copiar sua estrutura.

| Código | Responsabilidade |
| --- | --- |
| `src/components/layout/PatientShell.js` | Menu lateral e cabeçalho das cinco telas do paciente, com título, item ativo e conteúdo fornecidos pela página |
| `src/features/appointments/components/AppointmentListItem.js` | Apresentação de uma consulta, status, motivo e botões de remarcação/cancelamento |
| `src/components/navigation/Notifications.js` | Botão, estado aberto/fechado e conteúdo das notificações derivadas das consultas |
| `src/features/profile/hooks/useSavedProfile.js` | Leitura do perfil para os menus e atualização pelos eventos já existentes |
| `src/shared/formatting/patient-fields.js` | Máscaras de telefone e CPF, compartilhadas por cadastro e perfil |
| `src/shared/formatting/date.js` | Apresentação de data civil, compartilhada por confirmação, consultas, dashboard e notificações |

## Contratos preservados

- `PatientShell` mantém as classes CSS e os links existentes. A confirmação
  continua direcionando o item Início para `/`; as demais telas usam `/dashboard`.
  O título do agendamento muda quando o fluxo é de remarcação. O menu passa a
  identificar o item atual também com `aria-current="page"`.
- A página de agendamentos continua responsável por confirmar o cancelamento,
  chamar o serviço, bloquear ações durante a operação e apresentar erros.
  O cartão recebe `appointment`, `cancelling` e `onCancel` e preserva as condições
  para exibir os botões. A extração não libera ações para consultas canceladas ou
  concluídas.
- O menu mantém a confirmação de saída e os tratamentos de sessão reais e
  simulados. A lista de notificações mantém os filtros, ordenação, contagem,
  carregamento, erros e links anteriores.
- O hook de perfil mantém o fallback, os eventos `profileUpdated`/`storage` e a
  limpeza dos listeners. Os consumidores antigos de `UserMenu` e `SidebarUser`
  continuam usando a mesma API.
- As máscaras preservam a digitação parcial, a formatação de telefone fixo e
  celular e o limite de onze dígitos. A máscara não substitui validação de CPF.
- A data `YYYY-MM-DD` é apresentada como `DD/MM/YYYY` sem criar um `Date`, evitando
  alterar o dia pelo fuso do aparelho. As regras do fuso da clínica continuam no
  módulo de consultas.

## Validação automatizada

```bash
npm test
npm run build
git diff --check
```

Os três novos testes cobrem máscaras em entradas parciais, reformatadas e longas,
zeros à esquerda e datas civis. A suíte total tem 55 testes e usa banco PGlite
local descartável. Não acessa o banco Supabase compartilhado.

## Roteiro de revisão manual

Com autenticação real desligada e dados fictícios no modo de demonstração:

1. Cadastre um paciente, verificando as máscaras durante a digitação; entre e
   navegue por Início, Agendar consulta, Meus agendamentos e Perfil. Confira título,
   seleção do menu e layout em telas largas e estreitas.
2. Agende uma consulta futura e confira a confirmação, os indicadores e o cartão
   na listagem. Abra/feche as notificações e use o link para os agendamentos.
3. Remarque a consulta e confira o título e os dados. Cancele uma consulta e
   confira a confirmação, a aba Canceladas e a ausência de botões de alteração.
   Verifique que consultas concluídas também não oferecem esses botões.
4. Edite nome e telefone no perfil e confira a atualização dos menus. Saia e
   confirme o redirecionamento e a proteção das telas privadas.

A compilação e os testes automatizados não substituem essa revisão visual e de
interações. A navegação em navegador e o fluxo real autenticado ainda precisam
ser conferidos pelo revisor no ambiente apropriado.

## Banco e publicação

Não há mudança de esquema, migração ou configuração de autenticação. Não aplicar
migrações para este card e não ativar `NEXT_PUBLIC_ENABLE_SUPABASE_AUTH` na Vercel.
A integração GitHub/Vercel pode gerar um preview ao abrir a PR. A integração na
`main` deve aguardar revisão de outro integrante da equipe.
