# Documentação Inicial — Sistema de Agendamento de Consultas Médicas

## 1. Nome do Projeto

**MedAgenda — Sistema Web de Agendamento de Consultas Médicas**

> Nome provisório do projeto, podendo ser alterado posteriormente pela equipe.

---

## 2. Definição do Problema

Atualmente, muitos pacientes enfrentam dificuldades para encontrar profissionais de determinadas especialidades, consultar horários disponíveis e realizar agendamentos de maneira rápida.

Em alguns casos, o processo de agendamento depende de ligações telefônicas, mensagens ou atendimento presencial, podendo causar demora, falta de informações e conflitos de horários.

Diante desse problema, o projeto propõe o desenvolvimento de um sistema web que facilite a busca por profissionais da área da saúde e o processo de agendamento de consultas.

---

## 3. Público-Alvo

O público-alvo principal do sistema é formado por **pacientes que desejam pesquisar profissionais e agendar consultas médicas pela internet**.

O sistema também possuirá funcionalidades destinadas aos profissionais responsáveis pela organização dos atendimentos.

### Paciente

- Pesquisar especialidades médicas;
- Pesquisar profissionais;
- Consultar datas e horários disponíveis;
- Realizar agendamentos;
- Visualizar seus agendamentos.

### Médico

- Visualizar sua agenda;
- Consultar seus horários e consultas agendadas.

### Recepcionista

- Auxiliar na organização de médicos;
- Organizar horários;
- Visualizar e acompanhar consultas agendadas.

---

## 4. Proposta de Solução

A proposta é desenvolver um sistema web simples, responsivo e de fácil utilização que permita ao paciente pesquisar especialidades ou médicos, consultar horários disponíveis e realizar o agendamento de uma consulta.

Após o agendamento, o paciente poderá consultar as informações da consulta em uma área destinada aos seus agendamentos.

O sistema também contará com uma área destinada a médicos e recepcionistas para visualização e organização da agenda.

Durante o desenvolvimento do MVP, os dados poderão ser simulados, permitindo demonstrar o funcionamento do sistema sem depender inicialmente de um banco de dados real.

---

## 5. Objetivo Geral

Desenvolver um **MVP visual e navegável** de um sistema web para facilitar o agendamento e a organização de consultas médicas.

---

## 6. Objetivos Específicos

- Facilitar a busca por especialidades médicas;
- Facilitar a busca por médicos;
- Apresentar datas e horários disponíveis;
- Permitir o agendamento de consultas;
- Apresentar a confirmação do agendamento;
- Permitir que o paciente visualize seus agendamentos;
- Auxiliar médicos e recepcionistas na organização da agenda;
- Desenvolver uma interface responsiva para computadores e dispositivos móveis.

---

## 7. Escopo do MVP

A primeira versão do sistema terá como principais funcionalidades:

1. Login do usuário;
2. Busca por especialidade;
3. Visualização dos médicos;
4. Visualização de datas e horários disponíveis;
5. Agendamento de consulta;
6. Confirmação do agendamento;
7. Área "Meus Agendamentos";
8. Visualização da agenda para médicos ou recepcionistas.

### Dados do sistema

Inicialmente, os dados utilizados no sistema serão simulados para facilitar o desenvolvimento e a demonstração do MVP.

---

## 8. Requisitos Funcionais

| Código | Requisito |
|---|---|
| RF01 | Permitir que o paciente entre no sistema. |
| RF02 | Apresentar as especialidades médicas disponíveis. |
| RF03 | Apresentar os médicos relacionados a cada especialidade. |
| RF04 | Exibir datas e horários disponíveis para consulta. |
| RF05 | Permitir que o paciente realize o agendamento de uma consulta. |
| RF06 | Apresentar a confirmação após a realização do agendamento. |
| RF07 | Permitir que o paciente visualize seus agendamentos. |
| RF08 | Permitir que médicos ou recepcionistas visualizem a agenda. |

---

## 9. Requisitos Não Funcionais

| Código | Requisito |
|---|---|
| RNF01 | O sistema deverá funcionar em computadores e dispositivos móveis. |
| RNF02 | A interface deverá ser simples e de fácil compreensão. |
| RNF03 | A navegação entre as páginas deverá ser clara e intuitiva. |
| RNF04 | O sistema deverá utilizar cores e textos com boa legibilidade. |
| RNF05 | As páginas deverão apresentar carregamento rápido. |

---

## 10. Regras de Negócio

- Um horário não poderá ser reservado por dois pacientes.
- Somente horários disponíveis poderão ser selecionados.
- Para realizar um agendamento, o paciente deverá selecionar especialidade, profissional, data e horário.
- Após a realização do agendamento, o horário deverá aparecer como ocupado.
- O agendamento realizado deverá aparecer na área "Meus Agendamentos".
- Os dados utilizados inicialmente poderão ser simulados.

---

## 11. Referências

O projeto utiliza como referências de estudo e inspiração os sistemas de agendamento e atendimento do **Samar** e da **MedPrev**.

- Samar: https://hospitalsamar.com.br/
- MedPrev: https://agendamento.medprev.online/

As referências serão utilizadas para observar funcionalidades, organização e experiência de uso, sem copiar a identidade visual ou o conteúdo das plataformas.

---

## 12. Contribuição do Membro 1

O Membro 1 é responsável pela definição inicial do projeto e pela documentação, incluindo:

- Definição do problema;
- Definição do público-alvo;
- Proposta de solução;
- Objetivos do projeto;
- Definição do escopo do MVP;
- Requisitos funcionais;
- Requisitos não funcionais;
- Regras de negócio;
- Registro das referências utilizadas.

Esta documentação servirá como base para os demais membros da equipe durante o desenvolvimento do projeto.

