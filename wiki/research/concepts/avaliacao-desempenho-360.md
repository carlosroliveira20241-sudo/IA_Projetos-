---
title: "Avaliação de Desempenho 360°"
type: concept
track: research
origin_field: "gestão de pessoas, recursos humanos"
related_concepts: ["[[arquitetura-apps-script-em-camadas]]"]
tags: [rh, avaliacao-de-desempenho, feedback, gestao-de-pessoas]
created: 2026-05-27
updated: 2026-05-27
source_count: 1
status: stub
---

## Definição

A Avaliação de Desempenho 360° (AD 360°) é uma metodologia de feedback estruturado em que um colaborador é avaliado por múltiplas perspectivas — pares, subordinados, superiores e, em alguns modelos, clientes — ao contrário da avaliação tradicional unidirecional (apenas superior → subordinado).

A coleta é feita por instrumento padronizado (questionário) com escala quantitativa por competência e, frequentemente, campo aberto para feedback textual. O resultado é um painel individual por avaliado, consolidando médias por competência, pontos fortes e áreas de desenvolvimento.

## Origem

O modelo 360° ganhou popularidade nas décadas de 1980–1990 no contexto de gestão por competências. É amplamente usado em organizações que buscam desenvolver lideranças e alinhar comportamentos a valores organizacionais.

## Variações e debates

A escala de coleta varia por organização: Likert 1–5, 1–4 (sem ponto neutro, forçando posição), ou descritiva. A [[fluxo-consultoria]] adota escala 1–4 por competência.

Debates comuns incluem: viés de amizade nas avaliações entre pares, dificuldade de anonimato em equipes pequenas, e risco de uso punitivo versus desenvolvimento.

## Aplicações

Na [[fluxo-consultoria]], a AD 360° é realizada em ciclos periódicos. As competências avaliadas variam por função:

**Consultor de Projetos (8 competências):** Disciplina, Organização, Adaptabilidade, Trabalho em Equipe, Influência e Mobilização, Comunicação Assertiva, Excelência Técnica, Gestão de Riscos.

**Gerente de Projetos (11 competências):** as 8 acima + Delegar Tarefas, Gestão de Pessoas, Pensamento Estratégico e Holístico.

A coleta é feita via Google Form com colunas no padrão `Projeto | Pessoa (Papel) [Competência]`, automatizada pelo sistema descrito em [[automacao-ad-fluxo]].

## Conceitos relacionados

- [[arquitetura-apps-script-em-camadas]] — padrão técnico que viabiliza a automação do processo de AD na Fluxo

## Fontes referentes

- [[automacao-ad-fluxo]] — descreve a implementação da AD 360° na Fluxo: competências, escala, estrutura do Form e geração de painéis.
