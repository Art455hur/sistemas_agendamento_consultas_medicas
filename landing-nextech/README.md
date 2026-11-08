# Landing page — NexTech Soluções

Site institucional da NexTech Soluções para a entrega da N1, baseado no projeto exportado do Figma Make.

Esta pasta é uma aplicação independente dentro do mesmo repositório do AgendaSaúde. Não substitui a aplicação da raiz, não altera suas rotas e não compartilha seu servidor de desenvolvimento.

## Tecnologias

React, TypeScript, Vite e Tailwind CSS.

## Executar no Windows (PowerShell)

Com Node.js 22.12 ou superior instalado, abra o terminal na raiz do repositório:

```powershell
cd landing-nextech
npm.cmd ci
npm.cmd run dev
```

Abra o endereço exibido no terminal. Por padrão, esta versão usa `http://localhost:8443`. Mantenha o terminal aberto durante o uso.

Em outros terminais, use `npm` no lugar de `npm.cmd`.

## Gerar a versão de produção

Dentro de `landing-nextech`:

```powershell
npm.cmd run build
npm.cmd run preview
```

O build gera a pasta `dist`, que não deve ser versionada. Colocar o código no GitHub não publica automaticamente o site.

## Contato e links

- O formulário valida os campos e prepara um e-mail por `mailto:`. O visitante precisa concluir o envio no próprio aplicativo de e-mail.
- O site não envia nem armazena mensagens em um backend.
- Os links do protótipo e do repositório do AgendaSaúde foram mantidos. Não há link público da aplicação AgendaSaúde nesta versão.

## Origem dos arquivos

Código e recursos copiados do RAR atualizado fornecido pela equipe, com a alteração de contato por e-mail já aplicada. As configurações do Figma usadas pelo `vite.config.ts` foram preservadas. Dependências instaladas, artefatos de build e regras de Git LFS geradas pelo exportador não acompanham este envio.
