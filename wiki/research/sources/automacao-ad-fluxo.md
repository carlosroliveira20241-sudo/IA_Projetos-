---
title: "Planejamento: Automação de AD da Fluxo Consultoria"
type: source
track: research
source_type: other
source_path: "raw/cycles/cycle-2026-05-25.md"
author: "Carlos Oliveira"
date_published: 2026-05-25
url: ""
tags: [google-apps-script, automacao, rh, avaliacao-de-desempenho, fluxo-consultoria]
created: 2026-05-27
updated: 2026-05-27
source_count: 1
status: draft
---

## Metadados

| Campo | Valor |
|-------|-------|
| Autor | Carlos Oliveira |
| Produzido em | 2026-05-25 |
| Tipo | Planejamento técnico (brainstorm de ciclo) |
| Caminho local | raw/cycles/cycle-2026-05-25.md |

## Resumo executivo

Este documento registra o planejamento completo da automação do ciclo de Avaliação de Desempenho 360° da [[fluxo-consultoria]], implementada via [[google-apps-script]]. O objetivo central é eliminar o trabalho manual de tabulação e geração de painéis individuais por membro, além de preparar a base para geração automática de feedbacks textuais por IA (Parte 2, pós-validação da Parte 1).

A solução é dividida em dois grandes marcos. A Parte 1 cobre leitura do Google Form, cálculo de médias por competência e geração de planilhas-filho individuais a partir de um template, com cores por coordenação. A Parte 2, planejada mas não implementada, usará Gemini via UrlFetchApp para gerar feedbacks textuais a partir das médias calculadas na Parte 1.

O design prioriza robustez operacional: parser de cabeçalho via regex (resistente a mudanças no Form), leitura única por execução (evita timeout de 6 min), idempotência total (rodar N vezes produz mesmo resultado) e separação rígida entre cálculo puro e escrita.

## Pontos-chave

- Arquitetura em 7 arquivos `.gs` com responsabilidades isoladas: Config, Coordenacoes, Leitura, Modelo, Escrita, Main, Util — ver [[arquitetura-apps-script-em-camadas]].
- Parser de cabeçalho usa regex `^(.+?)\s*\|\s*(.+?)\s*\((Gerente|Consultor)\)\s*\[(.+?)\]$` — adição de projetos no Form não quebra o script.
- Leitura única via `getDataRange().getValues()` no início da execução; todas as escritas via `setValues()` ao final.
- Idempotência: painel existente é reaproveitado (preserva URL e compartilhamentos); a aba é limpa e reescrita.
- Separação entre `Modelo.gs` (cálculo puro, sem APIs Google) e `Escrita.gs` (APIs) permite testes isolados de `Modelo.gs`.
- Log persistente em aba dedicada da planilha-índice, não `console.log`.
- Validação de consistência por nomes normalizados (sem acento, lowercase) antes de geração em massa.
- Objeto `painel` é o contrato entre `Modelo.gs` e `Escrita.gs`; já projetado para alimentar a Parte 2 sem refatoração.
- 5 coordenações: ACE, CCE, QAB, PRO, MNP — cada uma com paleta de cores primária/secundária/texto definida.
- Consultores têm 8 competências; Gerentes têm 11 (as mesmas 8 + Delegar Tarefas, Gestão de Pessoas, Pensamento Estratégico e Holístico).
- Template tem duas abas ("Exemplo — Consultor" / "Exemplo — Gerente"); após `makeCopy()`, a aba da outra função é deletada.
- Ordem de implementação definida em 9 etapas, com Parte 2 (IA) bloqueada até etapa 8 aprovada.

## Citações notáveis

> "Este objeto já está desenhado para alimentar a Parte 2 (IA) sem refatoração posterior."

> "Validação de consistência (nomes normalizados — sem acento, lowercase) entre cadastro e Form antes de geração em massa."

## Conexões

- [[fluxo-consultoria]] — organização para a qual a automação é desenvolvida; contexto dos ciclos de AD.
- [[google-apps-script]] — plataforma de execução de toda a solução técnica.
- [[avaliacao-desempenho-360]] — metodologia de avaliação implementada; define competências, papéis e escalas.
- [[arquitetura-apps-script-em-camadas]] — padrão arquitetural de 7 arquivos descrito nesta fonte.

## Perguntas em aberto

- Nome exato da aba de respostas do Form na planilha Hub (provável: "Respostas ao formulário 1") — a confirmar.
- Nomes e ordem das colunas no cadastro externo (presumido: Nome, Coordenação, Função, Email).
- Layout exato da aba Gerente no template: confirmar linha da síntese geral (D51 ou outra).
- Possíveis divergências de nome entre Form e cadastro (ex: "Ana Julia" vs "Ana Júlia Marques") — `validarConsistencia()` vai surfaçar.
- Estratégia de prompting para Parte 2 (Gemini): tom, tamanho do feedback, estrutura por competência.
