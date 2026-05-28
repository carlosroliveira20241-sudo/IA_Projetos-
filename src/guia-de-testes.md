# Guia de testes — AD Fluxo (Apps Script)

Passo a passo para validar se os scripts do projeto estão funcionando. Ordem: do mais leve (lógica pura) ao mais pesado (escreve no Drive).

## 1. Preparação no editor do Apps Script

1. Abra a **planilha-índice** (`ID_INDICE` no `Config.gs`).
2. Menu → **Extensões → Apps Script**.
3. Confirme que os 8 arquivos estão lá: `Config`, `Util`, `Coordenacoes`, `Leitura`, `Modelo`, `Escrita`, `Main`, `Testes`.
4. Em `Config.gs`, confira os 4 IDs: template, cadastro, form responses, índice.
5. Salve tudo (Ctrl+S) — dispara a checagem de sintaxe.

## 2. Testes em ordem

Rodar no editor: selecione a função no dropdown e clique ▶ Executar. Veja saída em **Ver → Logs** (Ctrl+Enter).

### Etapa A — `testeNormalizarNome()` (`Testes.gs:10`)
- Função pura, sem acesso a planilha.
- Esperado:
  ```
  pedro de souza angelo
  anna clara moura
  livia alves da costa
  ```

### Etapa B — `testeLerCadastro()` (`Testes.gs:18`)
- Lê o Cadastro (`ID_PLANILHA_PROJETOS_E_EQUIPES`).
- Esperado: `Total de membros até agora: N` (N > 0) + 5 objetos JSON.
- Primeira execução pede autorização — aceitar com a conta `pnaves9@gmail.com`.
- Se N = 0: nomes de aba mudaram ou ID errado.

### Etapa C — `testeLerFormsResponses()` (`Testes.gs:29`)
- Parsing das respostas do Form (`ID_AVALIACAO_DE_PROJETOS`, aba `ABA_DE_RESPOSTAS_DO_FORMS`).
- Esperado: contagem de pessoas + 2 amostras com competências.
- Se competências vierem vazias: `normalizarNome()` não casa os headers do Form ("Trabalho em equipe" vs "Trabalho em Equipe").

### Etapa D — `testeValidarConsistencia()` (`Testes.gs:45`)
- Cruzamento Cadastro × Form.
- Esperado: popup "Cadastro e forms em sincronia" OU lista de divergências.
- Mesmo com divergências = bom sinal (as duas leituras funcionaram).

### Etapa E — `testeCalcularPainel()` (`Testes.gs:52`) ⚠️ escreve no Drive
- **Antes:** ajustar `NOME_TESTE` em `Testes.gs:50` para nome real que esteja no Cadastro **e** tenha respostas no Form (usar resultado da Etapa D).
- O que faz: calcula médias → cria pasta `Painéis AD Fluxo` no Drive (se não existir) → copia o template → escreve as notas → registra na planilha-índice.
- Esperado: `OK — painel de <nome> gravado.`
- Conferir:
  1. Planilha-índice → aba da coordenação da pessoa → linha 3 com nome, função, link.
  2. Clicar no link → painel individual → notas em D7, D11… (Consultor) ou C7, C11… (Gerente); média em D39 / C51.
  3. Executar `abrirPastaDePaineis` para confirmar que `PASTA_PAINEIS_ID` foi persistida.

## 3. Testes pela UI da planilha

Recarregar a planilha-índice no navegador. Menu **AD- Fluxo** aparece (vem de `onOpen` em `Main.gs:7`).

1. **Validar consistência cadastro - Form** — equivalente à Etapa D via menu.
2. **Atualizar painel de uma pessoa…** — testar com nome da Etapa E; deve atualizar sem duplicar linha na índice.
3. **Abrir pasta de painéis no drive** — abre a pasta em nova aba.
4. **Atualizar paineis de TODOS** ⚠️ — só rodar depois de A→E. Limpa linhas 3+ de todas as abas de coordenação e regera tudo. Popup final: `N painéis gerados` sem erros.

## 4. Checklist de "passou"

- [ ] Etapas A–D rodam sem exceção.
- [ ] Etapa E gera painel com notas nas células corretas.
- [ ] Linha aparece na aba de coordenação da planilha-índice (linha 3).
- [ ] `abrirPastaDePaineis` abre a pasta certa.
- [ ] Re-rodar `testeCalcularPainel` para a mesma pessoa **atualiza** o painel existente, não duplica.
- [ ] `atualizarTodos` termina com 0 erros.
