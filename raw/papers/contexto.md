Planejamento completo da automação de Avaliação de Desempenho (AD) da Fluxo Consultoria via Google Apps Script.

---

## Sobre o projeto

A Fluxo Consultoria realiza ciclos periódicos de Avaliação de Desempenho 360°. Um Google Form coleta avaliações em escala 1–4 por competência, além de feedbacks textuais. O objetivo é automatizar dois processos:

- Parte 1 — Organização das notas: ler as respostas do Form, calcular médias por competência por membro, gerar uma planilha individual por pessoa a partir de um template, com cor própria por coordenação.
- Parte 2 — Feedback por IA: gerar feedbacks textuais por competência a partir das médias, com tom de RH (construtivo, não disruptivo). Esta parte só será iniciada após a Parte 1 estar completamente implementada e testada.

A organização tem 5 coordenações: ACE, CCE, QAB, PRO, MNP. Cada membro tem uma função: Consultor de Projetos ou Gerente de Projetos.

---

## Arquitetura — 8 arquivos .gs (em src/)

| Arquivo | Responsabilidade | Status |
|---|---|---|
| Config.gs | Constantes globais: IDs, nomes de abas, competências, mapeamento de células | ✅ ESCRITO |
| Coordenacoes.gs | Paleta de cores fechada por coordenação e função de lookup | ✅ ESCRITO |
| Util.gs | log(), normalizarNome(), slugNome() | ✅ ESCRITO |
| Leitura.gs | parseHeader() + parseFeedbackHeader() + lerCadastroDeMembros() + lerFormResponses() | ✅ ESCRITO |
| Modelo.gs | calcularPainelDaPessoa() — cálculos puros sem APIs do Google | ✅ ESCRITO |
| Escrita.gs | gravarPainel() + atualizarIndice() + aplicarCores() | ✅ ESCRITO |
| Main.gs | onOpen(), orquestração geral, validarConsistencia() | ✅ ESCRITO |
| Testes.gs | Funções de teste manual — apagar após validação | ✅ ESCRITO |

### Princípios técnicos

- Parser de cabeçalho via regex, não índices hardcoded. Padrão: `^(.+?)\s*\|\s*(.+?)\s*\((Gerente|Consultor)\)\s*\[(.+?)\]$`. Adicionar projeto novo no Form não quebra o script.
- Leitura única por execução: getDataRange().getValues() no início, processar em arrays JS, setValues() no final. Evita estourar o limite de 6 min do Apps Script.
- Idempotência total: rodar N vezes produz o mesmo resultado. Painel existente é reaproveitado (preserva URL e compartilhamentos); a aba é limpa e reescrita.
- Separação entre cálculo puro (Modelo.gs, sem APIs) e escrita (Escrita.gs, com APIs) — Modelo.gs é testável isoladamente.
- Log persistente em aba dedicada na planilha-índice, não console.log que some.
- Validação de consistência (nomes normalizados — sem acento, lowercase) entre cadastro e Form antes de geração em massa.

---

## Fonte de dados

- Form Responses: cada linha = uma submissão de um avaliador. Colunas de nota no padrão `Projeto | Pessoa (Papel) [Competência]`. Colunas de feedback textual no padrão `Projeto | Feedback | Pessoa`. Primeiras colunas fixas: Carimbo de data/hora | Endereço de e-mail | Nome | Leva de entrada | Primeiro projeto.
- Cadastro (Base Autoavaliação e Avaliação de Equipe): planilha com abas "Projetos e Equipes {COORD}". Cada aba tem colunas: Projeto (A) | Equipe (B, fórmula) | Gerente (C) | Consultores (D-I). Coordenação inferida do nome da aba. Não tem coluna de email.
- Ambas são lidas uma única vez por execução e passadas como parâmetro para as funções de cálculo.

### Inferência de função e coordenação (sem cadastro explícito)

O script infere do Cadastro:
- Coordenação → nome da aba ("Projetos e Equipes ACE" → coord = "ACE")
- Função → quem aparece na col C (Gerente) em qualquer projeto → funcao = "Gerente"; demais → "Consultor"
- Confirmação → cabeçalhos do Form Responses têm `Pessoa (Gerente)` ou `Pessoa (Consultor)`, que sobrescreve a inferência do Cadastro (mais confiável)

Email: campo vazio no painel atual. Pode ser preenchido manualmente na planilha-índice.

---

## Competências por função

Consultor (8 competências):
1. Disciplina
2. Organização
3. Adaptabilidade
4. Trabalho em Equipe
5. Influência e Mobilização
6. Comunicação Assertiva
7. Excelência Técnica
8. Gestão de Riscos

Gerente (11 competências = as 8 acima + 3):
9. Delegar Tarefas
10. Gestão de Pessoas
11. Pensamento Estratégico e Holístico

⚠️ O Form Responses usa case diferente em 2 competências:
- Form: "Trabalho em equipe" → Config: "Trabalho em Equipe"
- Form: "Gestão de riscos" → Config: "Gestão de Riscos"
O matching é feito via normalizarNome() (lowercase + sem acento) — não causa problema.

---

## Objeto painel — contrato entre Modelo.gs e Escrita.gs

```javascript
{
  pessoa: string,
  coordenacao: string,           // 'CCE' | 'ACE' | 'QAB' | 'PRO' | 'MNP'
  funcao: string,                // 'Consultor' | 'Gerente'
  email: string,                 // '' (vazio — não disponível no Cadastro)
  medias: {                      // float por competência (apenas as da função)
    'Disciplina': 3.0,
    'Organização': 3.5,
    // ...
  },
  mediaGeral: float,
  feedbacks: [string],           // textos brutos de todos os campos "Projeto | Feedback | Pessoa"
  topPontosFortes: [string x3],      // Top 3 maiores médias
  topPontosDesenvolver: [string x3]  // Bottom 3 menores médias
}
```

Nota: feedbacks é uma lista plana (não por competência), pois o Form tem um campo de feedback por projeto, não por competência. Ajuste para Parte 2 se necessário.

---

## Mapeamento de células do template — CONFIRMADO (leitura direta do xlsx em 2026-05-26)

O template tem duas abas: "Exemplo — Consultor" e "Exemplo — Gerente". Após makeCopy(), a aba correspondente à função da pessoa é mantida e a outra é deletada.

### Aba Consultor

Notas em **coluna D**, feedback IA (Parte 2) em **coluna B**:

| Linha | Col B | Col C | Col D |
|---|---|---|---|
| 1 | Nome | — | — |
| 2 | Função | Consultor de Projetos | — |
| 3 | Ciclo da AD | Maio de 2026 | — |
| 4 | Coordenação | ACE | — |
| 6 | DISCIPLINA (label) | — | — |
| 7 | [AI feedback] | — | **nota** → D7 |
| 10 | ORGANIZAÇÃO (label) | — | — |
| 11 | [AI feedback] | — | **nota** → D11 |
| 14 | ADAPTABILIDADE | — | — |
| 15 | [AI feedback] | — | D15 |
| 18 | TRABALHO EM EQUIPE | — | — |
| 19 | [AI feedback] | — | D19 |
| 22 | INFLUÊNCIA E MOBILIZAÇÃO | — | — |
| 23 | [AI feedback] | — | D23 |
| 26 | COMUNICAÇÃO ASSERTIVA | — | — |
| 27 | [AI feedback] | — | D27 |
| 30 | EXCELÊNCIA TÉCNICA | — | — |
| 31 | [AI feedback] | — | D31 |
| 34 | GESTÃO DE RISCOS | — | — |
| 35 | [AI feedback] | — | D35 |
| 38 | SÍNTESE GERAL (label) | — | — |
| 39 | [AI feedback síntese] | — | **D39** (síntese) |

Células no Config.gs:
- CELULAS_NOTAS_CONSULTOR: ['D7','D11','D15','D19','D23','D27','D31','D35']
- CELULA_SINTESE_CONSULTOR: 'D39'
- Header: B1=Nome, C2=Função, C3=Ciclo, C4=Coordenação

### Aba Gerente

Notas em **coluna C** (⚠️ NÃO coluna D — corrige versão anterior do contexto), feedback IA em **coluna A**:

| Linha | Col A | Col B | Col C |
|---|---|---|---|
| 1 | Nome | — | — |
| 2 | Função | Gerente de Projetos | — |
| 3 | Ciclo da AD | Maio de 2026 | — |
| 4 | Coordenação | PRO | — |
| 6 | DISCIPLINA (label) | — | — |
| 7 | [AI feedback] | — | **nota** → C7 |
| 10–35 | (idem Consultor) | — | C11..C35 |
| 38 | DELEGAR TAREFAS | — | — |
| 39 | [AI feedback] | — | C39 |
| 42 | GESTÃO DE PESSOAS | — | — |
| 43 | [AI feedback] | — | C43 |
| 46 | PENSAMENTO ESTRATÉGICO E HOLÍSTICO | — | — |
| 47 | [AI feedback] | — | C47 |
| 50 | SÍNTESE GERAL (label) | — | — |
| 51 | [AI feedback síntese] | — | **C51** (síntese) |

Células no Config.gs:
- CELULAS_NOTAS_GERENTE: ['C7','C11','C15','C19','C23','C27','C31','C35','C39','C43','C47']
- CELULA_SINTESE_GERENTE: 'C51'
- Header: A1=Nome, B2=Função, B3=Ciclo, B4=Coordenação

---

## Paleta de cores por coordenação

| Coordenação | Primária | Secundária | Texto |
|---|---|---|---|
| CCE | #00695C | #E0F2F1 | #FFFFFF |
| ACE | #6A1B9A | #F3E5F5 | #FFFFFF |
| QAB | #E65100 | #FFF3E0 | #FFFFFF |
| PRO | #1565C0 | #E3F2FD | #FFFFFF |
| MNP | #AD1457 | #FCE4EC | #FFFFFF |
| DEFAULT | #424242 | #F5F5F5 | #FFFFFF |

Fallback DEFAULT para coordenação vazia ou desconhecida — nunca quebra o script.

---

## Organização no Drive

```
📁 Painéis de Membros — AD Maio de 2026  (ID persistido via PropertiesService)
   📁 CCE
   📁 ACE
   📁 QAB
   📁 PRO
   📁 MNP
```

Subpastas criadas automaticamente se não existirem.

---

## IDs das planilhas — estado em 2026-05-27

| Planilha | Constante em Config.gs | ID | Status |
|---|---|---|---|
| Template | `ID_DO_TEMPLATE_DE_EXEMPLO` | `1uM6Wr6gp6N8pW_gb8lYuuY3JTFYmuZ45tKesjisEFWQ` | ✅ confirmado |
| Cadastro (Base Autoavaliação e Avaliação de Equipe) | `ID_PLANILHA_PROJETOS_E_EQUIPES` | `1KSnCTmL5F8aecSiNYBGDAcOoYHQM7gTyFGpgxNsCsaE` | ✅ confirmado (tem abas "Projetos e Equipes {COORD}") |
| Form Responses (Avaliação de Projetos) | `ID_AVALIACAO_DE_PROJETOS` | `1bUWKFtNYIYLiuC_z7Qu-c2XiAmnCHCvIb2wyrOdjgKU` | ✅ confirmado |
| Planilha-índice | `ID_INDICE` | `1wpJBrxEG_UEfr3uP_7fO6ie6hj-lNSxjQl7YW3VYZZI` | ✅ confirmado |

---

## Estrutura da Planilha-índice

Abas: Geral, ACE, CCE, MNP, PRO, QAB

Aba Geral: resumo com total de membros e reuniões por coordenação (fórmulas automáticas).
Abas de coordenação (ex: ACE):
- L1: "Índice de Membros - ACE"
- L2: cabeçalho — A=# | B=Nome | C=E-mail | D=Função | E=Link da Planilha | F=Reunião Agendada | G=Reunião Realizada | H=Observações
- L3+: dados dos membros

O script escreve nas colunas B-E de cada aba de coordenação.

---

## Estrutura do Cadastro (Base Autoavaliação e Avaliação de Equipe)

Abas no arquivo:
- "Projetos e Equipes ACE" / "...CCE" / "...MNP" / "...PRO" / "...QAB" → usadas pelo script
- "Cópia de Projetos e Equipes" → aba combinada, ignorada pelo script
- "Competencias" → descrições das 11 competências, não usada pelo script

Estrutura de cada aba "Projetos e Equipes {COORD}":
- L1: Projeto | Equipe | Gerente | Consultores | (colunas D-I para consultores)
- L2+: dados de projetos (col A = nome do projeto, col C = gerente, cols D-I = consultores)
- Após projetos: lista calculada por fórmula de todos os membros únicos (ignorada pelo script)

---

## Menu "🤖 AD Fluxo"

- Atualizar painel de uma pessoa… (prompt para digitar nome)
- Atualizar painéis de TODOS
- Validar consistência cadastro × Form Responses
- Abrir pasta de painéis no Drive
- Limpar log

---

## Ordem de implementação — estado atual

1. Config.gs ✅
2. Coordenacoes.gs ✅
3. Util.gs ✅
4. Leitura.gs ✅
5. Modelo.gs ✅
6. Escrita.gs ✅
7. Main.gs ✅
8. Testes com dados reais → **PRÓXIMA ETAPA**
   - [x] Preencher `ID_AVALIACAO_DE_PROJETOS` em Config.gs ✅
   - [x] Confirmar `ABA_DE_RESPOSTAS_DO_FORMS` = `'Respostas ao formulário 1'` ✅
   - [ ] Colar os 8 arquivos no Apps Script editor (planilha-índice → Extensões → Apps Script)
   - [ ] Rodar testeLerCadastro() → ver membros encontrados
   - [ ] Rodar testeLerFormResponses() → ver pessoas no Form
   - [ ] Rodar testeValidarConsistencia() → resolver divergências de nome
   - [ ] Rodar testeGravarUmPainel() (NOME_TESTE = nome real) → validar painel gerado
   - [ ] Rodar atualizarTodos() → verificar todos os painéis e subpastas
9. Parte 2 (Gemini via UrlFetchApp) — só após etapa 8 aprovada

---

## Pontos a confirmar antes de rodar pela primeira vez

- [x] Nome exato das abas do template: "Exemplo — Consultor" e "Exemplo — Gerente" ✅
- [x] Células do template Consultor: D7, D11...D35, síntese D39 ✅
- [x] Células do template Gerente: C7, C11...C47, síntese C51 ✅ (era D antes — corrigido)
- [x] Nomes e colunas do Cadastro: abas "Projetos e Equipes {COORD}", col C=Gerente, cols D-I=Consultores ✅
- [x] ID do Form Responses real — `1bUWKFtNYIYLiuC_z7Qu-c2XiAmnCHCvIb2wyrOdjgKU` preenchido em Config.gs ✅
- [x] Nome exato da aba de respostas do Form — `ABA_DE_RESPOSTAS_DO_FORMS = 'Respostas ao formulário 1'` ✅
- [ ] Divergências de nome entre Form e Cadastro — validarConsistencia() vai listar
