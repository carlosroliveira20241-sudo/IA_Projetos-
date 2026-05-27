---
title: "Arquitetura Apps Script em Camadas"
type: concept
track: research
origin_field: "engenharia de software, google-apps-script"
related_concepts: ["[[google-apps-script]]", "[[avaliacao-desempenho-360]]"]
tags: [google-apps-script, arquitetura, separacao-de-responsabilidades, automacao]
created: 2026-05-27
updated: 2026-05-27
source_count: 1
status: stub
---

## Definição

Padrão de organização de projetos [[google-apps-script]] em múltiplos arquivos `.gs` com responsabilidades estritamente isoladas. Cada arquivo encapsula uma camada funcional — configuração, lógica de domínio, leitura de dados, cálculo puro, escrita e orquestração — de modo que mudanças em uma camada não cascateiam para as demais.

O princípio central é a separação entre **cálculo puro** (sem APIs do Google, testável isoladamente) e **efeitos colaterais** (APIs do Google Workspace, I/O). Isso é especialmente importante no GAS, onde o ambiente de teste é limitado.

## Origem

Adaptação de princípios de arquitetura limpa e separação de responsabilidades ao ambiente específico do Google Apps Script, que não possui módulos nativos (não há `import`/`export`); todos os arquivos `.gs` compartilham o mesmo escopo global. A separação é, portanto, uma convenção de organização, não uma barreira técnica imposta pela linguagem.

## Variações e debates

A ausência de módulos reais no GAS significa que a separação de camadas depende inteiramente de disciplina: qualquer arquivo pode chamar qualquer função de outro. Frameworks como `clasp` e TypeScript podem introduzir modularidade real, mas aumentam a complexidade de deploy.

## Aplicações

Na automação de AD da [[fluxo-consultoria]], o padrão é materializado em 7 arquivos:

| Arquivo | Camada | Tem APIs Google? |
|---|---|---|
| `Config.gs` | Configuração / constantes | Não |
| `Coordenacoes.gs` | Domínio de cores | Não |
| `Util.gs` | Utilitários (log, normalização) | Sim (log em aba) |
| `Leitura.gs` | Leitura de dados externos | Sim |
| `Modelo.gs` | Cálculo puro (médias, top 3) | **Não** — testável isoladamente |
| `Escrita.gs` | Escrita em planilhas e Drive | Sim |
| `Main.gs` | Orquestração e menu | Sim |

O contrato entre `Modelo.gs` e `Escrita.gs` é o objeto `painel`, definido explicitamente com campos `pessoa`, `coordenacao`, `funcao`, `medias`, `mediaGeral`, `feedbacks`, `topPontosFortes` e `topPontosDesenvolver`.

Princípios adicionais aplicados na implementação da Fluxo:
- **Leitura única por execução** — `getDataRange().getValues()` no início, `setValues()` no final; evita estourar o limite de 6 min do GAS.
- **Idempotência** — rodar N vezes produz o mesmo resultado; painéis existentes são reaproveitados.
- **Parser via regex** — cabeçalhos do Form são parseados por padrão, não por índice; adição de projetos não quebra o script.

## Conceitos relacionados

- [[google-apps-script]] — plataforma onde o padrão é aplicado; suas restrições (timeout, escopo global) motivam o design
- [[avaliacao-desempenho-360]] — processo de negócio que o padrão viabiliza na Fluxo

## Fontes referentes

- [[automacao-ad-fluxo]] — instância concreta do padrão: descreve os 7 arquivos, seus contratos e os princípios técnicos adotados.
