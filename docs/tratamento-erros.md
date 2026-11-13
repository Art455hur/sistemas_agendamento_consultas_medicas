# Tratamento de erros

As rotas possuem error.js com recuperação por reset. Falhas no layout raiz são
capturadas por global-error.js, com HTML próprio e apresentação independente do
CSS global. Nenhuma dessas telas imprime mensagem técnica, stack ou dados do erro.

Dashboard, notificações e listagem de consultas mostram uma mensagem segura e
Tentar novamente. A ação refaz somente a leitura compartilhada das consultas,
sem repetir agendamento, cancelamento ou outras escritas. Falhas limpam a lista;
respostas antigas e trocas de sessão continuam protegidas pelo controle de geração.
Rejeições com null, undefined, strings ou objetos também são tratadas.

A rejeição assíncrona de getUser no AuthGuard mostra falha de verificação com
opção de recarregar, mantendo o acesso protegido. Nenhum erro concede acesso.

Validação: npm test, npm run build e git diff --check. O teste adicional cobre
rejeições de tipos inesperados, ocultação de conteúdo interno e recuperação.
No navegador, revisar falha de rede nas consultas, recuperação, rejeição de sessão
e as telas de erro em ambiente de teste. Error boundaries não substituem os
tratamentos próprios de eventos e operações assíncronas das demais funcionalidades.

Sem migração ou alteração da configuração da Vercel. Manter autenticação real
desligada no site publicado e aguardar revisão de outro integrante antes do merge.
