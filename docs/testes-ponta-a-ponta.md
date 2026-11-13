# Testes de ponta a ponta

## Escopo desta entrega

Os testes de navegador cobrem os caminhos principais da demonstração local do
AgendaSaúde: página inicial, consulta de especialidade, navegação para cadastro e
login, validações dos formulários e entrada com um usuário de demonstração.

Os cenários usam dados fictícios no navegador local. Eles não acessam o projeto
Supabase compartilhado, não criam contas reais e não substituem a revisão de
RLS ou os testes do fluxo autenticado. A flag de Auth fica desligada durante a
execução.

## Critérios de conclusão

- Os caminhos testados abrem sem erros de interface;
- A modal de especialidade abre e pode ser fechada;
- Cadastro e login mostram mensagens coerentes para entradas inválidas;
- Um paciente fictício consegue percorrer cadastro e login no modo local;
- Nenhuma chave ou arquivo `.env.local` é necessário para executar a suíte.

As instruções de instalação e execução serão mantidas junto da configuração do
Playwright nesta documentação.
