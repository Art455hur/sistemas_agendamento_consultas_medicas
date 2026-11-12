# Revisão de desempenho das consultas

Dashboard/listagem e sino utilizavam instâncias independentes do mesmo hook,
repetindo consultas, listeners de sessão e intervalos de 60 segundos.

O hook agora usa uma fonte compartilhada com useSyncExternalStore. O primeiro
consumidor inicia carregamento e assinaturas; o último a sair remove todas as
assinaturas e limpa os dados. Cada aba do navegador mantém sua própria fonte.
O snapshot de servidor é vazio e nenhuma consulta é iniciada durante SSR.

Mudanças de sessão invalidam imediatamente os dados e respostas antigas. Falhas
limpam a lista; uma atualização posterior pode recuperar o estado. Não há cache
persistente, alteração de RLS, migração ou mudança na flag de autenticação.

Com dois consumidores simultâneos, os testes demonstram uma consulta inicial e
uma conexão de eventos, em vez de duas. Não foi medido ganho percentual de tempo
em produção. O formatador Intl do fuso da clínica também é reutilizado entre
consultas, evitando uma construção por registro.

Validação: npm test, npm run build e git diff --check. Os testes novos cobrem
consumidores simultâneos, troca de conta com resposta atrasada, desmontagem e
recuperação após erro. Revisar no navegador dashboard, sino, atualização após
cancelamento e troca de conta antes de integrar a PR.
