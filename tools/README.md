# /tools — Scripts CLI

Esta pasta é reservada para scripts utilitários futuros que auxiliem na
manutenção e exploração da wiki.

## Scripts planejados

Cada script deve ser autocontido, documentado no topo do arquivo, e não deve
modificar `/raw`.

Exemplos de ferramentas a implementar conforme a necessidade:

- **search.py** — busca ingênua (grep + frontmatter) sobre as páginas wiki,
  retornando resultados com score de relevância simples.
- **validate-frontmatter.py** — valida que todas as páginas wiki possuem os
  campos obrigatórios do esquema definido em `CLAUDE.md`.
- **link-checker.py** — varre wiki-links `[[...]]` e reporta referências para
  arquivos inexistentes.
- **stats.py** — estatísticas da wiki: contagem de páginas por tipo/trilha/status,
  páginas mais linkadas, páginas órfãs.

## Convenções para novos scripts

- Linguagem preferida: Python 3.10+
- Um arquivo por ferramenta, sem dependências externas salvo stdlib quando possível
- Documentar uso no topo do arquivo com um comentário `# Usage: python script.py ...`
- Outputs para stdout; erros para stderr
