# CLAUDE.md — LLM Wiki Schema & Contract

Este arquivo é lido no início de **toda sessão Claude Code** neste projeto.
É autoritativo: em caso de conflito entre este arquivo e qualquer instrução
ad-hoc na conversa, este arquivo prevalece, salvo instrução explícita do humano
de alterá-lo (o que requer confirmação prévia — ver §6).

---

## 1. Propósito do projeto e as três camadas

Este repositório implementa o padrão **LLM Wiki**: uma base de conhecimento
persistente e cumulativa onde o LLM escreve e mantém todo o conteúdo, e o
humano curada fontes, faz perguntas e direciona a exploração.

| Camada | Pasta | Responsável | Mutabilidade |
|--------|-------|-------------|--------------|
| Fontes brutas | `/raw` | Humano | **Imutável** — o LLM nunca modifica |
| Base de conhecimento | `/wiki` | LLM | Mantida e evoluída pelo LLM |
| Configuração/esquema | `CLAUDE.md` | Humano (com confirmação) | Só alterar com aprovação explícita |

**Contrato de imutabilidade do `/raw`:** os arquivos em `/raw` são documentos
originais exatamente como o humano os depositou. O LLM lê, nunca escreve,
renomeia ou deleta nada dentro de `/raw` — **exceto** a subpasta `raw/cycles/`,
onde o LLM salva automaticamente os arquivos de brainstorm durante ciclos ativos
(ver §5.1). Qualquer outra exceção requer instrução explícita do humano.

---

## 2. Convenções de linguagem e estilo

| Elemento | Idioma |
|----------|--------|
| Corpo das páginas wiki (texto corrido, resumos, reflexões) | **Português (pt-BR)** |
| Entradas do `log.md` | **Português (pt-BR)** |
| Nomes de pastas e arquivos | **Inglês** |
| Chaves de frontmatter | **Inglês** |
| Vocabulário de tags | **Inglês** |
| Mensagens de commit git | **Inglês** |

**Nomes de arquivo:** `kebab-case.md`, apenas ASCII, sem acentos, sem espaços.
Exemplos corretos: `transformer-architecture.md`, `habito-leitura.md` (acento
removido → `habito-leitura.md`).

**Tom — conteúdo de pesquisa:** preciso, baseado em fontes, sem hipérboles.
Cite sempre a página-fonte (`[[nome-da-pagina]]`) ao afirmar algo.

**Tom — conteúdo pessoal:** direto, honesto, não-julgamental. Primeira pessoa
é apropriada em reflexões.

---

## 3. Esquema de frontmatter

### 3.1 Campos comuns (obrigatórios em todas as páginas)

```yaml
---
title: "Título da Página"
type: entity | concept | source | comparison | synthesis | reflection
track: research | personal
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
source_count: 0
status: stub | draft | stable
---
```

- `source_count`: quantas fontes em `/raw` informam esta página. Incrementar
  a cada ingestão que toca a página.
- `status`: `stub` = criada mas incompleta; `draft` = substancial mas não
  revisada; `stable` = revisada e consistente com as fontes atuais.

### 3.2 Extensões por tipo

**`type: source`**
```yaml
source_type: article | paper | transcript | image | other
source_path: "raw/articles/nome-do-arquivo.md"
author: "Nome Sobrenome"
date_published: YYYY-MM-DD
url: "https://..."          # opcional
```

**`type: entity`**
```yaml
entity_type: person | organization | tool | dataset | product | practice | habit | other
aliases: ["Nome Alternativo", "Abreviação"]
```

**`type: concept`**
```yaml
related_concepts: ["[[conceito-a]]", "[[conceito-b]]"]
origin_field: "área de origem (ex: machine-learning, psicologia)"
```

**`type: comparison`**
```yaml
subjects: ["[[sujeito-a]]", "[[sujeito-b]]"]
criteria_count: 0
```

**`type: synthesis`**
```yaml
thesis_version: 1
covers: ["[[pagina-a]]", "[[pagina-b]]"]
```

**`type: reflection`** *(somente track: personal)*
```yaml
revisit_on: YYYY-MM-DD    # data sugerida para revisitar
mood: ""                  # opcional, livre
```

---

## 4. Convenções de links

- Usar **sempre** a sintaxe wiki-link do Obsidian: `[[nome-do-arquivo]]` ou
  `[[nome-do-arquivo|texto de exibição]]`.
- O nome no link é o nome do arquivo **sem** a extensão `.md`.
- Ao mencionar pela primeira vez um conceito, entidade ou fonte em qualquer
  página, inserir o link correspondente.
- Ao criar uma nova página, o LLM deve atualizar todas as páginas existentes
  que deveriam apontar para ela. Isso faz parte do fluxo de ingestão, não é
  opcional.
- Backlinks nativos do Obsidian dispensam seção manual de "backlinks". Mas
  links de saída (forward links) devem ser inseridos proativamente.
- **Regra de isolamento de trilhas:** links cruzados entre `research/` e
  `personal/` são permitidos **somente** em `overview.md` ou em sínteses
  explicitamente cross-track. Nunca colocar conceito de pesquisa dentro de
  `personal/` ou vice-versa.

---

## 5. Fluxos de trabalho

### 5.1 Fluxo de Ciclo (CICLO)

*Acionado quando o humano escreve `CICLO`.*

1. Confirmar o início do ciclo e entrar em **modo escuta silenciosa**.
2. A cada ideia recebida:
   - Salvar o conteúdo da ideia no arquivo do ciclo ativo em `raw/cycles/`
     (um único arquivo por ciclo, apenas conteúdo das ideias, sem timestamps
     ou comentários do LLM).
   - Comentar a ideia e fazer perguntas para aprofundar.
   - Se o humano responder "pula", avançar sem insistir.
3. O ciclo só encerra quando o humano escreve `INGEST`.
4. **Nomenclatura do arquivo:** `cycle-YYYY-MM-DD.md`. Se houver mais de um
   ciclo no mesmo dia: `cycle-YYYY-MM-DD-2.md`, etc.

### 5.2 Fluxo de Ingest (INGEST)

*Acionado quando o humano escreve `INGEST`.*

1. Reportar em tempo real cada etapa executada.
2. Ler o arquivo do ciclo ativo em `raw/cycles/` integralmente.
3. Identificar o tema emergente automaticamente e nomeá-lo.
4. Criar página `source` em `wiki/{track}/sources/` com: resumo executivo,
   pontos-chave, seção "Conexões" listando entidades e conceitos relacionados,
   e "Perguntas em aberto".
5. Identificar entidades e conceitos introduzidos. Para cada um: criar nova
   página (a partir do template correspondente) ou atualizar página existente,
   incrementando `source_count` e adicionando à seção "Fontes referentes".
6. Atualizar `wiki/index.md` com as novas páginas.
7. Anexar entrada em `wiki/log.md` com o formato exato:
   ```
   ## [YYYY-MM-DD] ciclo | {tema emergente identificado}
   Breve descrição de uma linha.
   - Páginas tocadas: [[pag-a]], [[pag-b]], …
   ```
8. Sinalizar contradições explicitamente: se o ciclo discorda de página
   existente, adicionar callout Obsidian:
   ```
   > [!warning] Contradição
   > Ciclo afirma Y; [[pagina-existente]] afirma Z. Aguarda resolução.
   ```
   Nunca sobrescrever silenciosamente.
9. Apresentar resumo das páginas criadas e atualizadas.

### 5.3 Fluxo PP / P (Perguntas e Propostas)

*Acionado a qualquer momento, dentro ou fora de um ciclo.*

- **PP:** Fazer perguntas ao humano para entender melhor o contexto, depois
  formular propostas com base nas respostas.
- **P:** Formular propostas diretamente, sem perguntas prévias.

### 5.4 Fluxo PC / C (Perguntas e Conexões)

*Acionado a qualquer momento, dentro ou fora de um ciclo.*

- **PC:** Fazer perguntas ao humano para entender o que precisa ser conectado,
  depois mapear conexões entre páginas da wiki (ou entre wiki e ciclo ativo).
- **C:** Mapear conexões diretamente, sem perguntas prévias.

### 5.5 Fluxo de lint

*Acionado por solicitação explícita, ex: "lint the wiki".*

1. Escanear para: páginas órfãs (sem links de entrada), páginas `stub` com
   mais de 30 dias, contradições entre páginas, afirmações desatualizadas
   superadas por fontes mais recentes, conceitos mencionados ≥3 vezes sem
   página dedicada, wiki-links quebrados, campos de frontmatter ausentes,
   timestamps `updated:` desatualizados.
2. Produzir relatório em `wiki/_lint/YYYY-MM-DD-report.md`. **Não corrigir
   automaticamente** — apresentar achados e perguntar quais tratar.
3. Anexar entrada no log:
   ```
   ## [YYYY-MM-DD] lint | N problemas encontrados
   ```

### 5.6 Fluxo de output

*Quando o humano pede deck, gráfico ou tabela.*

- **Decks Marp:** salvar como `.md` com frontmatter Marp em
  `wiki/{track}/syntheses/` (ou `wiki/_decks/`, criar na primeira vez).
- **Gráficos matplotlib/mermaid:** gerar script de renderização em `/tools/`,
  salvar outputs em `raw/assets/generated/` (criar na primeira vez),
  referenciar das páginas wiki.
- **Tabelas de comparação:** normalmente inline em página sob `comparisons/`.

---

## 6. Regras de supervisão (nível médio — vinculante)

### Agir sem perguntar
- Corrigir links quebrados
- Atualizar backlinks
- Incrementar contadores (`source_count`)
- Anexar ao `log.md`
- Atualizar `index.md`
- Atualizar timestamps `updated:`
- Corrigir erros tipográficos pequenos
- Salvar ideias em `raw/cycles/` durante ciclo ativo (CICLO)

### Lote + confirmar antes de executar
- Criar nova página
- Mesclar ou renomear páginas
- Reescrever um resumo substancialmente
- Reorganizar uma pasta
- Alterar o esquema de frontmatter
- Arquivar output de consulta de volta na wiki

### Sempre perguntar (nunca agir sem aprovação explícita)
- Qualquer coisa que modifique `/raw`
- Qualquer alteração em `CLAUDE.md`
- Deletar uma página
- Qualquer ação sem precedente aprovado anteriormente

---

## 7. O que o LLM nunca deve fazer

1. Modificar qualquer coisa em `/raw` — exceto escrever em `raw/cycles/` durante
   ciclo ativo, conforme autorizado em §5.1.
2. Escrever conteúdo wiki em inglês (chaves estruturais são inglês; prosa é português).
3. Fabricar citações ou inventar fontes não presentes em `/raw`.
4. Resolver contradições silenciosamente — sempre surfacear.
5. Criar páginas sem frontmatter.
6. Usar nomes de arquivo genéricos como `notes.md` ou `new-page.md`.
7. Criar links para páginas que ainda não existem sem sinalizar que são stubs
   a criar.

---

## 8. Checklist de inicialização de sessão

No início de cada sessão Claude Code neste projeto:

1. Ler este arquivo (`CLAUDE.md`).
2. Ler `wiki/index.md` para ter visão geral do conteúdo atual.
3. Ler as últimas ~10 entradas de `wiki/log.md`:
   ```bash
   grep "^## \[" wiki/log.md | tail -10
   ```
4. Cumprimentar o humano com um resumo de 2–3 linhas da atividade recente.

---

## 9. Estrutura de diretórios (referência)

```
/
├── CLAUDE.md               ← este arquivo
├── README.md
├── .gitignore
├── raw/                    ← imutável, gerenciado pelo humano
│   ├── articles/
│   ├── papers/
│   ├── transcripts/
│   ├── assets/
│   ├── cycles/             ← arquivos de brainstorm (escritos pelo LLM durante CICLO)
│   └── README.md
├── wiki/                   ← mantido pelo LLM
│   ├── index.md
│   ├── log.md
│   ├── overview.md
│   ├── research/
│   │   ├── entities/
│   │   ├── concepts/
│   │   ├── sources/
│   │   ├── comparisons/
│   │   └── syntheses/
│   ├── personal/
│   │   ├── entities/
│   │   ├── concepts/
│   │   ├── sources/
│   │   ├── reflections/
│   │   └── syntheses/
│   └── _templates/
│       ├── entity.md
│       ├── concept.md
│       ├── source.md
│       ├── comparison.md
│       ├── synthesis.md
│       └── reflection.md
└── tools/
    └── README.md
```
