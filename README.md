# Sistema Espaço de Beleza Valquíria Goes

Sistema web de gestão e vitrine digital para um salão de beleza: cadastro de clientes,
agenda de horários com detecção de conflito e uma página pública com os serviços do
salão. Backend em **Python (Flask + SQLite)** e frontend em **React (Vite)**.

## Sobre o projeto

Este é um **trabalho acadêmico**, desenvolvido como Projeto de Extensão (PEX III) do
curso de **Engenharia de Software** da Descomplica/Uniamérica.

O Projeto de Extensão é uma atividade curricular obrigatória em que o aluno aplica os
conhecimentos do curso em uma demanda real de uma comunidade ou organização parceira.
Este sistema é a terceira etapa de um trabalho contínuo com o mesmo microempreendimento
parceiro:

1. **PEX I** — diagnóstico do negócio. Problemas identificados: agendamento manual,
   ausência de cadastro estruturado de clientes, controle de estoque não sistematizado e
   divulgação limitada.
2. **PEX II** — protótipo em Java, com funcionamento em console, para cadastro de
   clientes e agendamentos. Servia como prova de conceito, mas sem interface gráfica,
   sem persistência de dados e utilizável apenas no computador do desenvolvedor.
3. **PEX III (este repositório)** — evolução para um sistema web de verdade, com
   interface gráfica, dados persistidos em banco e acesso pelo computador ou pelo
   celular. O escopo foi validado presencialmente com a proprietária do salão, que
   priorizou o cadastro de clientes e a agenda, e pediu também uma página pública para
   divulgar os serviços. O módulo de controle de estoque ficou conscientemente fora
   desta etapa, por decisão dela.

O projeto está alinhado ao **ODS 8** (Trabalho Decente e Crescimento Econômico) e ao
**ODS 9** (Indústria, Inovação e Infraestrutura) da Agenda 2030 da ONU.

> **Sobre os dados exibidos:** os clientes e agendamentos usados em demonstrações são
> fictícios. Os preços dos serviços e o número de WhatsApp da vitrine são valores de
> exemplo e devem ser substituídos pelos reais antes de qualquer uso pelo salão.

## Funcionalidades

**Clientes**
- Cadastro com nome, telefone e observações (preferências, alergias, histórico).
- Edição e exclusão de cadastros.
- Busca por nome ou telefone.
- Bloqueio de telefone duplicado, evitando o mesmo cliente cadastrado duas vezes.

**Agenda**
- Agendamento associando cliente, serviço, data e horário.
- Detecção automática de conflito de horário considerando a duração de cada serviço: o
  sistema recusa a marcação e informa qual atendimento já ocupa aquela faixa.
- Filtro por data e cancelamento de agendamento.
- Soma do faturamento previsto a partir dos serviços agendados.

**Vitrine pública**
- Nome, endereço e horário de funcionamento do salão.
- Lista de serviços com preço e duração.
- Link direto de contato via WhatsApp.

A interface é responsiva e funciona tanto no computador quanto no celular.

## Como rodar

### Pré-requisitos

- **Python 3.10 ou superior** — verifique com `python3 --version`
- **Node.js 18 ou superior** — verifique com `node --version`
- **Git** — para clonar o repositório

### 1. Clonar o repositório

```bash
git clone https://github.com/devguimaraesraphael/salao-valkiria-goes.git
cd salao-valkiria-goes
```

### 2. Subir o backend (API)

Em um terminal:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # no Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

A API sobe em **http://127.0.0.1:5000**. Na primeira execução o arquivo `salao.db` é
criado automaticamente, já com os serviços do salão cadastrados.

Deixe esse terminal aberto — o servidor precisa continuar rodando.

### 3. Subir o frontend (interface)

Em um **segundo terminal**, a partir da raiz do projeto:

```bash
cd frontend
npm install
npm run dev
```

A interface sobe em **http://localhost:5173**. Abra esse endereço no navegador.

O Vite faz proxy das chamadas `/api` para o backend, então basta manter os dois
servidores rodando ao mesmo tempo.

### 4. Usar o sistema

Ao abrir, o sistema mostra três abas:

- **Vitrine** — a página pública do salão, com serviços, preços e contato.
- **Clientes** — comece por aqui: cadastre pelo menos um cliente.
- **Agenda** — com um cliente cadastrado, é possível marcar um atendimento. Tente marcar
  dois serviços em horários que se sobreponham para ver a validação de conflito.

### Parar os servidores

Pressione `Ctrl+C` em cada um dos dois terminais.

### Começar com o banco limpo

Apague o arquivo `backend/salao.db` e suba o backend novamente — ele será recriado
vazio, apenas com os serviços iniciais.

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/vitrine` | Dados públicos do salão e lista de serviços |
| `GET` | `/api/servicos` | Serviços com preço e duração |
| `GET` | `/api/clientes` | Lista clientes (aceita `?busca=`) |
| `POST` | `/api/clientes` | Cadastra cliente |
| `PUT` | `/api/clientes/<id>` | Atualiza cliente |
| `DELETE` | `/api/clientes/<id>` | Remove cliente |
| `GET` | `/api/agendamentos` | Lista agendamentos (aceita `?data=`) |
| `POST` | `/api/agendamentos` | Cria agendamento, validando conflito de horário |
| `DELETE` | `/api/agendamentos/<id>` | Cancela agendamento |

## Estrutura do projeto

```
backend/
  app.py           rotas da API e regra de conflito de horário
  database.py      conexão, schema e dados iniciais
  requirements.txt dependências Python
frontend/
  src/App.jsx      navegação entre as três telas
  src/api.js       cliente HTTP e formatação (moeda, data, duração)
  src/index.css    estilos da aplicação
  src/components/  Vitrine, Clientes, Agenda e Aviso
  vite.config.js   configuração do dev server e do proxy da API
```

## Tecnologias

- **Backend:** Python, Flask, Flask-CORS, SQLite
- **Frontend:** React 18, Vite
- **Banco de dados:** SQLite (arquivo local, sem servidor)

## Próximos passos

Levantados durante o projeto e deixados para etapas futuras:

- Módulo de controle de estoque de produtos.
- Autenticação de usuários, para múltiplas profissionais do salão.
- Lembretes automáticos de agendamento via WhatsApp.
- Upload de fotos dos trabalhos diretamente pela interface da vitrine.
- Hospedagem em ambiente acessível pela internet, hoje limitado à rede local.

## Licença

Trabalho acadêmico de uso educacional.
