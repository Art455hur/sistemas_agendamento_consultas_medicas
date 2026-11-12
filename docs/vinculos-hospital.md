# Hospital único e vínculos de funcionários

> **Registro histórico da modelagem dos vínculos.** As próximas etapas listadas abaixo pertencem ao momento dessa migração. A gestão administrativa de médicos e secretárias já foi integrada posteriormente; veja [gestão de funcionários](gestao-funcionarios.md) e o [guia técnico atual](documentacao-tecnica.md). A atribuição inicial de administrador continua dependendo de operação autorizada.

A migração `20261111191220_20261111190359_vinculos_hospital.sql` cria o hospital único (ID 1; nome "Hospital Sapiens") e a tabela `hospital_staff`. O papel continua na coluna protegida `profiles.role`, que só deve ser alterada por um operador autorizado; `hospital_staff` registra se o médico, secretário(a) ou administrador está vinculado e ativo. Pacientes não devem ter vínculo de funcionário. O prefixo `20261111191220` corresponde à versão registrada no histórico do Supabase.

Esta é **somente a modelagem**. Não cria usuários, não promove ninguém e não habilita o painel com dados reais. Com RLS, a pessoa autenticada pode consultar o hospital e apenas seu próprio vínculo. Não existe `INSERT`, `UPDATE` ou `DELETE` para os clientes. A coluna `hospital_id` prepara uma possível expansão futura, mas o banco agora aceita somente o hospital de ID 1.

## Próxima implementação, em outra PR

1. Definir quem será o primeiro administrador e atribuir seu papel por operação administrativa auditável (nunca pelo cadastro público).
2. Criar fluxo seguro para vincular e desvincular funcionários, validando o papel escolhido e impedindo autoelevação, troca do próprio papel e remoção do último administrador.
3. Criar leitura administrativa restrita de perfis/vínculos para alimentar a seção Equipe do painel, sem expor pacientes desnecessariamente.
4. Testar usuário anônimo, paciente, médico, secretária e administrador; testar tanto permissões quanto tentativas negadas.

Não aplicar a migração manualmente de novo se ela já constar no histórico remoto. A ativação de Auth na Vercel continua independente desta mudança.

