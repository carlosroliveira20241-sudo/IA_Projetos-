// =============================================================
// Escrita.gs — Criar/atualizar painéis individuais + índice
// =============================================================

function obterOuCriarSubpasta(pastaBase, nomeSubpasta) {
  var subpastasEncontradas = pastaBase.getFoldersByName(nomeSubpasta);
  return subpastasEncontradas.hasNext() ? subpastasEncontradas.next() : pastaBase.createFolder(nomeSubpasta);
}

function obterOuCriarPainelFile(pastaDaCoordenacao, nomeArquivo, funcao) {
  var arquivosEncontrados = pastaDaCoordenacao.getFilesByName(nomeArquivo);
  if (arquivosEncontrados.hasNext()) return { file: arquivosEncontrados.next(), novo: false };

  // Criar cópia do template e deletar a aba que não corresponde à função
  var arquivoCopiado      = DriveApp.getFileById(ID_DO_TEMPLATE_DE_EXEMPLO).makeCopy(nomeArquivo, pastaDaCoordenacao);
  var spreadsheet         = SpreadsheetApp.openById(arquivoCopiado.getId());
  var nomeAbaParaRemover  = funcao === 'Gerente' ? ABA_TEMPLATE_CONSULTOR : ABA_TEMPLATE_GERENTE;
  var abaParaRemover      = spreadsheet.getSheetByName(nomeAbaParaRemover);
  if (abaParaRemover && spreadsheet.getNumSheets() > 1) spreadsheet.deleteSheet(abaParaRemover);

  return { file: arquivoCopiado, novo: true };
}

/*
 * Aplica as cores da coordenação ao painel.
 * - Header (linhas 1-4): cor primária, texto branco
 * - Labels de competência (linha imediatamente acima de cada nota): cor secundária
 * - Label de síntese geral: cor primária
 * - Tab: cor primária
 */
function aplicarCores(aba, cores, funcao) {
  var ultimaColuna = aba.getLastColumn() || 6;

  // Header
  aba.getRange(1, 1, 4, ultimaColuna)
     .setBackground(cores.primaria)
     .setFontColor(cores.texto);

  // Labels de competência e notas
  var celulasNotas = funcao === 'Gerente' ? CELULAS_NOTAS_GERENTE : CELULAS_NOTAS_CONSULTOR;
  celulasNotas.forEach(function(celulaDaNota) {
    var linhaDaNota  = parseInt(celulaDaNota.replace(/[A-Z]/gi, ''));
    var linhaDaLabel = linhaDaNota - 1;
    aba.getRange(linhaDaLabel, 1, 1, ultimaColuna)
       .setBackground(cores.secundaria)
       .setFontColor(cores.primaria)
       .setFontWeight('bold');
  });

  // Label de síntese (linha acima da célula de síntese)
  var celulaDaSintese = funcao === 'Gerente' ? CELULA_SINTESE_GERENTE : CELULA_SINTESE_CONSULTOR;
  var linhaDaSintese  = parseInt(celulaDaSintese.replace(/[A-Z]/gi, ''));
  aba.getRange(linhaDaSintese - 1, 1, 1, ultimaColuna)
     .setBackground(cores.primaria)
     .setFontColor(cores.texto)
     .setFontWeight('bold');

  aba.setTabColor(cores.primaria);
}

/*
 * Grava (cria ou atualiza) o painel de um membro.
 * Idempotente: roda N vezes, resultado é o mesmo.
 */
function gravarPainel(painel) {
  log('Iniciando painel: ' + painel.pessoa + ' (' + painel.coordenacao + ')');

  // ── Pasta raiz ───────────────────────────────────────────────────────────
  var propriedades     = PropertiesService.getScriptProperties();
  var idDaPastaDePaineis = propriedades.getProperty('PASTA_PAINEIS_ID');
  var pastaDePaineis;

  if (idDaPastaDePaineis) {
    try { pastaDePaineis = DriveApp.getFolderById(idDaPastaDePaineis); } catch (e) { pastaDePaineis = null; }
  }
  if (!pastaDePaineis) {
    pastaDePaineis = DriveApp.createFolder('Painéis de Membros — AD ' + CICLO_ATUAL);
    propriedades.setProperty('PASTA_PAINEIS_ID', pastaDePaineis.getId());
    log('Pasta raiz criada: ' + pastaDePaineis.getId());
  }

  // ── Subpasta da coordenação ──────────────────────────────────────────────
  var pastaDaCoordenacao = obterOuCriarSubpasta(pastaDePaineis, painel.coordenacao);

  // ── Arquivo do painel ────────────────────────────────────────────────────
  var nomeArquivo     = 'Painel — ' + painel.pessoa;
  var resultado       = obterOuCriarPainelFile(pastaDaCoordenacao, nomeArquivo, painel.funcao);
  var arquivoDoPainel = resultado.file;

  // ── Abrir aba correta do painel ──────────────────────────────────────────
  var spreadsheetDoPainel = SpreadsheetApp.openById(arquivoDoPainel.getId());
  var nomeAba             = painel.funcao === 'Gerente' ? ABA_TEMPLATE_GERENTE : ABA_TEMPLATE_CONSULTOR;
  var abaDoPainel         = spreadsheetDoPainel.getSheetByName(nomeAba);
  if (!abaDoPainel) throw new Error('Aba "' + nomeAba + '" não encontrada no painel de ' + painel.pessoa);

  // Limpar área de dados (mantém estrutura do template intacta)
  abaDoPainel.clearContents();

  // ── Escrever cabeçalho ───────────────────────────────────────────────────
  var ehGerente = painel.funcao === 'Gerente';

  if (ehGerente) {
    abaDoPainel.getRange(CELULA_NOME_GERENTE  ).setValue(painel.pessoa);
    abaDoPainel.getRange(CELULA_FUNCAO_GERENTE).setValue('Gerente de Projetos');
    abaDoPainel.getRange(CELULA_CICLO_GERENTE ).setValue(CICLO_ATUAL);
    abaDoPainel.getRange(CELULA_COORD_GERENTE ).setValue(painel.coordenacao);
  } else {
    abaDoPainel.getRange(CELULA_NOME_CONSULTOR  ).setValue(painel.pessoa);
    abaDoPainel.getRange(CELULA_FUNCAO_CONSULTOR).setValue('Consultor de Projetos');
    abaDoPainel.getRange(CELULA_CICLO_CONSULTOR ).setValue(CICLO_ATUAL);
    abaDoPainel.getRange(CELULA_COORD_CONSULTOR ).setValue(painel.coordenacao);
  }

  // ── Notas por competência ────────────────────────────────────────────────
  var competencias  = ehGerente ? COMPETENCIAS_GERENTE : COMPETENCIAS_CONSULTOR;
  var celulasNotas  = ehGerente ? CELULAS_NOTAS_GERENTE : CELULAS_NOTAS_CONSULTOR;
  var celulaSintese = ehGerente ? CELULA_SINTESE_GERENTE : CELULA_SINTESE_CONSULTOR;

  competencias.forEach(function(nomeCompetencia, indice) {
    var celulaDaCompetencia = celulasNotas[indice];
    if (!celulaDaCompetencia) return;
    var media = painel.medias[nomeCompetencia];
    abaDoPainel.getRange(celulaDaCompetencia).setValue(media !== null ? media : '—');
  });

  // ── Síntese geral ────────────────────────────────────────────────────────
  abaDoPainel.getRange(celulaSintese).setValue(painel.mediaGeral !== null ? painel.mediaGeral : '—');

  // ── Cores ────────────────────────────────────────────────────────────────
  aplicarCores(abaDoPainel, corDaCoordenacao(painel.coordenacao), painel.funcao);

  SpreadsheetApp.flush();

  // ── Atualizar planilha-índice ────────────────────────────────────────────
  atualizarIndice(painel, arquivoDoPainel.getUrl());

  log('Painel de ' + painel.pessoa + ' gravado. ' + arquivoDoPainel.getUrl());
}

/*
 * Insere ou atualiza a linha do membro na aba de coordenação da planilha-índice.
 * Estrutura da aba: L1=título, L2=cabeçalho, L3+=dados.
 * Colunas: A=#  B=Nome  C=E-mail  D=Função  E=Link  F=Reunião Agendada  G=Reunião Realizada  H=Observações
 */
function atualizarIndice(painel, urlDoPainel) {
  var spreadsheet        = SpreadsheetApp.openById(ID_INDICE);
  var abaDaCoordenacao   = spreadsheet.getSheetByName(painel.coordenacao);
  if (!abaDaCoordenacao) {
    log('AVISO: aba "' + painel.coordenacao + '" não encontrada na planilha-índice. Pulando.');
    return;
  }

  var dadosDaAba            = abaDaCoordenacao.getDataRange().getValues();
  var nomePessoaNormalizado = normalizarNome(painel.pessoa);
  var linhaEncontrada       = -1;

  // Procurar linha existente pelo nome (col B = índice 1)
  // Linhas de dados começam em dadosDaAba[2] (L3)
  for (var indiceDaLinha = 2; indiceDaLinha < dadosDaAba.length; indiceDaLinha++) {
    if (normalizarNome(String(dadosDaAba[indiceDaLinha][1])) === nomePessoaNormalizado) {
      linhaEncontrada = indiceDaLinha + 1; // +1 porque getValues() é 0-based e Sheet é 1-based
      break;
    }
  }

  var labelDaFuncao = painel.funcao === 'Gerente' ? 'Gerente de Projetos' : 'Consultor de Projetos';

  if (linhaEncontrada !== -1) {
    // Atualizar linha existente: cols B-E (colunas 2 a 5, 1-based)
    abaDaCoordenacao.getRange(linhaEncontrada, 2, 1, 4).setValues([[painel.pessoa, painel.email, labelDaFuncao, urlDoPainel]]);
  } else {
    // Adicionar nova linha
    var numeroDaLinha = abaDaCoordenacao.getLastRow() - 1; // linhas de dados anteriores = lastRow - título - cabeçalho + 1
    abaDaCoordenacao.appendRow([numeroDaLinha, painel.pessoa, painel.email, labelDaFuncao, urlDoPainel, false, false, '']);
  }
}