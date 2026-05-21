Aqui está o prompt pronto pra colar em outro chatbot. Inclui tudo: contexto do negócio, decisões já tomadas, paleta, código já escrito, e onde paramos.

---

```markdown
# Contexto: Automação de Painéis Individuais de Avaliação 360° via Google Apps Script

## Sobre o projeto
Estou automatizando a geração de painéis individuais de avaliação de competências
para os membros de uma organização (Fluxo/PAME — empresa júnior universitária).
O cliente pediu uma planilha por pessoa contendo a média das notas dela em cada
competência, mais feedbacks textuais recebidos.

## Fonte de dados (a "planilha Hub")
- **Origem:** Google Form que coleta avaliações 360°. As respostas caem numa
  aba do tipo "Form Responses".
- **Formato bruto:** cada linha = uma submissão de um avaliador. Cada coluna
  segue o padrão `Projeto | Pessoa (Papel) [Competência]`, por exemplo:
  `DesEq Telecom | Pedro Fonseca (Consultor) [Disciplina]`.
  Também há colunas de Feedback textual: `Projeto | Feedback | Pessoa`.
- A planilha bruta tem várias abas derivadas (pivots, resumos por projeto,
  painéis individuais), mas todas são DERIVADAS do Form Responses.
  Form Responses é a única fonte da verdade.

## As 11 competências avaliadas (ordem fixa)
1. Disciplina
2. Organização
3. Adaptabilidade
4. Trabalho em equipe
5. Influência e Mobilização
6. Comunicação Assertiva
7. Excelência Técnica
8. Gestão de riscos
9. Delegar Tarefas
10. Gestão de Pessoas
11. Pensamento Estratégico e Holístico

Cada avaliação é uma nota de 1 a 4 (vi isso nos dados).

## Cadastro de membros (planilha SEPARADA)
Existe uma planilha externa já existente com cadastro pessoa → coordenação → email.
Não é a mesma da Form Responses. O script precisa abri-la por ID via
`SpreadsheetApp.openById(...)`.

## Coordenações existentes
CCE, ACE, QAB, PRO, MNP. Cada coordenação define a cor visual do painel
da pessoa.

## Decisões de arquitetura já fechadas

1. **Uma planilha por pessoa**, salva como arquivo independente no Google Drive.
2. **Atualização manual** via menu customizado na planilha Hub (`onOpen()` +
   `SpreadsheetApp.getUi()`).
3. **Fonte da verdade continua sendo o Form Responses** + cadastro externo.
4. **Cor da planilha vem da coordenação** da pessoa.
5. **Organização no Drive em subpastas por coordenação**:
   ```
   📁 Painéis de Membros
      📁 CCE
      📁 ACE
      📁 QAB
      📁 PRO
      📁 MNP
   ```
6. **Idempotência total**: rodar o script N vezes produz o mesmo resultado
   (limpa e reescreve, nunca acumula).
7. **Código separado em vários arquivos `.gs`** (não tudo em Code.gs):
   - `Config.gs` — constantes (IDs, nomes de aba, lista de competências)
   - `Coordenacoes.gs` — paleta de cores
   - `Leitura.gs` — parser de cabeçalho + leitura de Form Responses e cadastro
   - `Modelo.gs` — cálculos puros (médias, top 3, agrupar feedbacks). Sem APIs do Google.
   - `Escrita.gs` — criar/atualizar planilha-filha + formatação com cores
   - `Main.gs` — menu, orquestração, validação de consistência
   - `Util.gs` — helpers

## Princípios técnicos adotados
- **Parser de cabeçalho via regex** (não hardcodar índices). O padrão é
  `^(.+?)\s*\|\s*(.+?)\s*\((Gerente|Consultor)\)\s*\[(.+?)\]$`.
  Captura projeto, pessoa, papel, competência. Adicionar projeto novo no
  Form não quebra o script.
- **Uma única leitura, uma única escrita**: `getDataRange().getValues()`
  no início, processar tudo em arrays JS, `setValues()` no final.
  Evita estourar o limite de 6min do Apps Script.
- **Logs em aba dedicada** na Hub (não `console.log` que some).
- **Fallback de cor**: paleta `DEFAULT` cinza pra casos onde a coordenação
  está vazia ou desconhecida (evita quebrar o script).

## Paleta de cores fechada

| Coord | primaria   | secundaria | texto    |
|-------|-----------|-----------|----------|
| CCE   | `#00695C` | `#E0F2F1` | `#FFFFFF` |
| ACE   | `#6A1B9A` | `#F3E5F5` | `#FFFFFF` |
| QAB   | `#E65100` | `#FFF3E0` | `#FFFFFF` |
| PRO   | `#1565C0` | `#E3F2FD` | `#FFFFFF` |
| MNP   | `#AD1457` | `#FCE4EC` | `#FFFFFF` |
| DEFAULT | `#424242` | `#F5F5F5` | `#FFFFFF` |

## Código já escrito

### Config.gs
\`\`\`javascript
const CONFIG = {
  ABA_FORM: 'Respostas ao formulário 1',  // AJUSTAR
  ABA_LOG: 'Log',
  CADASTRO_PLANILHA_ID: 'COLE_O_ID_AQUI',
  CADASTRO_ABA: 'Membros',
  CADASTRO_COL_NOME: 'Nome',
  CADASTRO_COL_COORD: 'Coordenação',
  CADASTRO_COL_EMAIL: 'Email',
  PASTA_PAINEIS_ID: 'COLE_O_ID_AQUI',
  COMPETENCIAS: [
    'Disciplina', 'Organização', 'Adaptabilidade', 'Trabalho em equipe',
    'Influência e Mobilização', 'Comunicação Assertiva', 'Excelência Técnica',
    'Gestão de riscos', 'Delegar Tarefas', 'Gestão de Pessoas',
    'Pensamento Estratégico e Holístico'
  ],
  TOP_N: 3
};
\`\`\`

### Coordenacoes.gs
\`\`\`javascript
const COORDENACOES = {
  'CCE': { primaria: '#00695C', secundaria: '#E0F2F1', texto: '#FFFFFF' },
  'ACE': { primaria: '#6A1B9A', secundaria: '#F3E5F5', texto: '#FFFFFF' },
  'QAB': { primaria: '#E65100', secundaria: '#FFF3E0', texto: '#FFFFFF' },
  'PRO': { primaria: '#1565C0', secundaria: '#E3F2FD', texto: '#FFFFFF' },
  'MNP': { primaria: '#AD1457', secundaria: '#FCE4EC', texto: '#FFFFFF' },
  'DEFAULT': { primaria: '#424242', secundaria: '#F5F5F5', texto: '#FFFFFF' }
};

function corDaCoordenacao(nomeCoord) {
  if (!nomeCoord) return COORDENACOES['DEFAULT'];
  const chave = String(nomeCoord).trim().toUpperCase();
  return COORDENACOES[chave] || COORDENACOES['DEFAULT'];
}

function coordenacoesConhecidas() {
  return Object.keys(COORDENACOES).filter(k => k !== 'DEFAULT');
}
\`\`\`

### Leitura.gs (cadastro externo — função parcial)
\`\`\`javascript
function lerCadastroDeMembros() {
  let planilha;
  try {
    planilha = SpreadsheetApp.openById(CONFIG.CADASTRO_PLANILHA_ID);
  } catch (e) {
    throw new Error(
      `Não consegui abrir a planilha de cadastro. Verifique ID e permissões. ${e.message}`
    );
  }
  const aba = planilha.getSheetByName(CONFIG.CADASTRO_ABA);
  if (!aba) throw new Error(`Aba "${CONFIG.CADASTRO_ABA}" não encontrada.`);
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return {};
  const cabecalho = dados[0].map(c => String(c).trim());
  const idxNome = cabecalho.indexOf(CONFIG.CADASTRO_COL_NOME);
  const idxCoord = cabecalho.indexOf(CONFIG.CADASTRO_COL_COORD);
  const idxEmail = cabecalho.indexOf(CONFIG.CADASTRO_COL_EMAIL);
  if (idxNome === -1 || idxCoord === -1) {
    throw new Error(`Colunas obrigatórias não encontradas: ${cabecalho.join(', ')}`);
  }
  const cadastro = {};
  dados.slice(1).forEach(linha => {
    const nome = String(linha[idxNome] || '').trim();
    if (!nome) return;
    cadastro[nome] = {
      coordenacao: String(linha[idxCoord] || '').trim() || null,
      email: idxEmail >= 0 ? String(linha[idxEmail] || '').trim() || null : null
    };
  });
  return cadastro;
}

// AINDA FALTA: função lerFormResponses() com o parser de cabeçalho.
// Pseudocódigo já desenhado:
//   parseHeader(titulo) extrai {projeto, pessoa, papel, competencia} via regex
//   lerFormResponses() devolve { linhas, indice, cabecalho }
//   onde indice = { pessoa: { competencia: [colunas] } }
\`\`\`

## Estrutura de dados do "painel" (modelo em memória)
\`\`\`javascript
{
  pessoa: 'Pedro Carneiro',
  coordenacao: 'CCE',
  email: 'pedro@example.com',
  dataEmissao: Date,
  medias: {
    'Disciplina': 3.0,
    'Organização': 3.5,
    // ... 11 competências
  },
  // ainda preciso desenhar a parte de feedbacks textuais e top 3 / a desenvolver
}
\`\`\`

## Onde paramos
Já estão prontos: `Config.gs`, `Coordenacoes.gs` e a função `lerCadastroDeMembros`
em `Leitura.gs`.

Próximos passos na ordem (sugerida — dentro pra fora):
1. **`Leitura.gs` completo** — implementar `parseHeader()` e `lerFormResponses()`
   que retornam o índice `{pessoa: {competencia: [colunas]}}`.
2. **`Modelo.gs`** — funções puras: `calcularPainelDaPessoa(nome, linhas, indice, cadastro)`
   retornando o objeto painel acima. Inclui também agrupar feedbacks textuais
   e calcular top 3 / pontos a desenvolver.
3. **`Escrita.gs`** — `gravarPainel(painel)`:
   - Procura/cria pasta da coordenação dentro de PASTA_PAINEIS_ID.
   - Procura/cria arquivo `Painel - {nome}` dentro dessa pasta.
   - `aba.clear()` + montar matriz de saída + `setValues()` único.
   - Aplicar formatação usando `corDaCoordenacao(painel.coordenacao)`:
     cabeçalho com fundo `primaria` e texto `texto`; seções com `secundaria`;
     `aba.setTabColor(cores.primaria)`.
4. **`Main.gs`** — `onOpen()` cria menu "🤖 Automação" com:
   - "Atualizar painel de uma pessoa" (prompt pra escolher nome)
   - "Atualizar painéis de TODOS"
   - "Validar consistência cadastro × Form Responses" (lista quem está num e não no outro)
   - "Abrir pasta de painéis"
5. **`Util.gs`** — logger pra aba Log, normalizador de nome (caixa, acentos),
   slug pra nome de arquivo.

## Atenções já mapeadas

- **Nomes inconsistentes entre Form e cadastro** (ex: "Anna Júlia" no Form vs
  "Anna Júlia Marques dos Santos" no cadastro). A função
  `validarConsistencia()` no menu deve listar essas divergências antes de
  rodar a geração em massa.
- **Permissões da planilha externa**: quem executa o script precisa ter
  acesso de leitura.
- **Cache de leitura no loop em massa**: ler Form Responses e cadastro
  UMA vez no início e passar pros cálculos individuais. Não reler dentro
  do loop.

---

**Por favor, continue de onde parei.** Comece pela implementação completa
do `Leitura.gs` (parser de cabeçalho + leitura do Form Responses), depois
podemos avançar pro `Modelo.gs`.
```

---

Algumas observações sobre como usar:

**Por que está em markdown dentro de um bloco de código:** assim você copia o conteúdo inteiro de uma vez e cola direto no próximo chat sem perder formatação.

**O que omiti de propósito:** detalhes de UX da conversa anterior (perguntas que fiz, alternativas que considerei e descartei), porque o novo chatbot não precisa disso — só do estado atual e direção a seguir. Mantive os "porquês" das decisões importantes (idempotência, parser de cabeçalho, separação em arquivos) porque elas são princípios que devem guiar o código futuro.

**Se quiser ajustar antes de usar:** me avisa se quer que eu acrescente alguma restrição (ex: "responda em português", "sou iniciante em Apps Script, explique cada linha"), o link da planilha original, ou se quer que eu encurte mais agressivamente.