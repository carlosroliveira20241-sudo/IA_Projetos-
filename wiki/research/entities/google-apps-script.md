---
title: "Google Apps Script"
type: entity
track: research
entity_type: tool
aliases: ["GAS", "Apps Script"]
tags: [google-workspace, automacao, javascript, serverless]
created: 2026-05-27
updated: 2026-05-27
source_count: 1
status: stub
---

## Resumo

Google Apps Script (GAS) é uma plataforma de scripting baseada em JavaScript hospedada pelo Google, projetada para automatizar e estender produtos do Google Workspace (Sheets, Forms, Drive, Gmail, etc.). Executa no servidor do Google sem necessidade de infraestrutura própria. Relevante nesta base de conhecimento como plataforma de execução da automação de AD da [[fluxo-consultoria]].

## Contexto

O GAS é acionado por triggers (tempo, evento de Form, menu customizado) e executa com limite de 6 minutos por execução. Acessa a API do Google Workspace via serviços nativos (`SpreadsheetApp`, `DriveApp`, `UrlFetchApp`, etc.). Scripts são escritos em arquivos `.gs` (JavaScript ES5/ES6 parcial) e organizados em projetos vinculados a uma planilha ou a um projeto standalone.

Uma restrição operacional importante é o limite de tempo de execução de 6 minutos, que impõe a necessidade de leituras e escritas em lote (`getValues()`/`setValues()`) em vez de chamadas célula a célula.

## Relações

- Relacionado com: [[fluxo-consultoria]] — contexto de uso da plataforma
- Relacionado com: [[arquitetura-apps-script-em-camadas]] — padrão de organização de projetos GAS em múltiplos arquivos `.gs`
- Relacionado com: [[avaliacao-desempenho-360]] — processo automatizado via GAS

## Fontes referentes

- [[automacao-ad-fluxo]] — descreve arquitetura de 7 arquivos `.gs`, princípios técnicos e restrições operacionais da plataforma.
