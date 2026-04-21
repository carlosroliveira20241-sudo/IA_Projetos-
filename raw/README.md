# /raw — Fontes Brutas

## Contrato de imutabilidade

**O LLM nunca modifica, renomeia ou deleta arquivos nesta pasta.**

Os arquivos aqui são os documentos originais exatamente como você os coletou.
Eles são a fonte primária de verdade. A wiki em `/wiki` é derivada deles —
não o contrário.

## Subpastas

| Pasta | Conteúdo |
|-------|----------|
| `articles/` | Artigos web exportados via Obsidian Web Clipper (`.md`) |
| `papers/` | PDFs e papers acadêmicos |
| `transcripts/` | Transcrições de podcasts e vídeos |
| `assets/` | Imagens, diagramas e figuras referenciados por fontes |

## Convenção de nomenclatura

Use nomes descritivos, em kebab-case, prefixados com a data de coleta:

```
YYYY-MM-DD-titulo-descritivo.md
YYYY-MM-DD-titulo-descritivo.pdf
```

Exemplos:
- `2026-04-21-attention-is-all-you-need.pdf`
- `2026-04-21-como-construir-habitos-atomic-habits-cap3.md`

**Regras:**
- Apenas ASCII nos nomes (remover acentos)
- Sem espaços — usar hífens
- Sem caracteres especiais

## Como depositar uma fonte

1. Copie o arquivo para a subpasta correta com o nome no formato acima.
2. Abra uma sessão Claude Code e diga: `ingira raw/{subpasta}/{nome}.md`
3. O Claude vai ler, resumir e perguntar se deve prosseguir com a ingestão
   completa antes de escrever qualquer coisa na wiki.
