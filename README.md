# LLM Wiki — Segundo Cérebro

Base de conhecimento pessoal mantida pelo LLM (Claude Code), curada pelo humano.

## Arquitetura em três camadas

```
/raw      ← você deposita fontes aqui (imutável)
/wiki     ← Claude mantém e sintetiza o conhecimento
CLAUDE.md ← contrato/esquema que governa tudo
```

1. **`/raw`** — documentos originais que você coleta: artigos web (Obsidian Web
   Clipper), PDFs/papers acadêmicos, transcrições de podcasts/vídeos, imagens e
   diagramas. O LLM lê, **nunca modifica**.

2. **`/wiki`** — a base de conhecimento. Resumos, páginas de entidades,
   conceitos, comparações, sínteses e um log de operações. Tudo escrito e
   mantido pelo LLM em português (pt-BR).

3. **`CLAUDE.md`** — o esquema que define convenções, frontmatter, fluxos de
   trabalho e regras de supervisão. Lido pelo Claude no início de cada sessão.

## Como adicionar fontes

1. Salve o arquivo em `/raw` na subpasta correta:
   - Artigos web → `raw/articles/`
   - Papers/PDFs → `raw/papers/`
   - Transcrições → `raw/transcripts/`
   - Imagens/diagramas → `raw/assets/`
2. Use nomes descritivos em kebab-case, prefixados com data:
   `2026-04-21-titulo-do-artigo.md`
3. Abra uma sessão Claude Code neste diretório e diga:
   `ingira raw/articles/nome-do-arquivo.md`

## Como fazer consultas

Abra uma sessão Claude Code e faça sua pergunta naturalmente. O Claude vai
consultar a wiki, citar fontes e oferecer arquivar respostas substanciais.

Exemplo: *"Quais são as principais diferenças entre RAG e LLM Wiki?"*

## Como rodar o lint

```
lint the wiki
```

O Claude vai varrer a wiki em busca de inconsistências, páginas órfãs,
contradições e campos faltando, e produzirá um relatório sem auto-corrigir.

## Setup do Obsidian (recomendado)

1. Abrir esta pasta raiz como um vault no Obsidian.
2. Habilitar o plugin **Dataview** (Community Plugins) — permite queries nas
   páginas via frontmatter YAML.
3. Em Settings → Files & Links, definir a pasta de attachments como
   `raw/assets/`.
4. Instalar o plugin **Marp** se quiser visualizar decks diretamente no Obsidian.
5. O arquivo `.obsidian/workspace*` está no `.gitignore`; a configuração do
   vault (`.obsidian/`) é versionada.

## Estrutura de diretórios

```
/
├── CLAUDE.md
├── README.md
├── .gitignore
├── raw/
│   ├── articles/
│   ├── papers/
│   ├── transcripts/
│   └── assets/
├── wiki/
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
└── tools/
```
