// Escrita.gs
// Toda escrita em planilhas e Drive:
//   gravarPainel(painel)         → cria/atualiza planilha individual do membro
//   atualizarIndice(painel, url) → linha do membro na planilha-índice
//   aplicarCores(aba, coord)     → paleta visual por coordenação
//
// Depende de: Config.gs, Coordenacoes.gs, Util.gs

// ─── gravarPainel ─────────────────────────────────────────────────────────────

/**
 * Cria ou atualiza a planilha individual de um membro.
 * Idempotente: planilha existente (identificada pelo nome na subpasta) é
 * reaproveitada — preserva URL e compartilhamentos; a aba é reescrita.
 * @param {Object} painel  Contrato definido em Modelo.gs
 * @returns {string}       URL da planilha gerada
 */
function gravarPainel(painel) {
  var pasta = _obterOuCriarSubpasta(painel.coordenacao);
  var nome  = slugNome(painel.pessoa) + ' — AD';
  var ss    = _obterOuCopiarTemplate(pasta, nome);

  var nomeFuncAba  = painel.funcao === 'Gerente' ? 'Exemplo — Gerente'   : 'Exemplo — Consultor';
  var nomeFuncOuta = painel.funcao === 'Gerente' ? 'Exemplo — Consultor' : 'Exemplo — Gerente';

  // Remove a aba da função oposta (presente na cópia fresca do template)
  var abaOuta = ss.getSheetByName(nomeFuncOuta);
  if (abaOuta) ss.deleteSheet(abaOuta);

  var aba = ss.getSheetByName(nomeFuncAba);
  if (!aba) {
    var msg = 'Aba "' + nomeFuncAba + '" não encontrada em: ' + nome;
    log('ERRO: ' + msg);
    throw new Error(msg);
  }

  _escreverHeader(aba, painel);
  _escreverNotas(aba, painel);
  aplicarCores(aba, painel.coordenacao);

  var url = ss.getUrl();
  log('Painel gravado: ' + painel.pessoa + ' → ' + url);
  return url;
}

// ─── atualizarIndice ──────────────────────────────────────────────────────────

/**
 * Escreve ou atualiza a linha do membro na aba de coordenação da planilha-índice.
 * Colunas escritas: B=Nome, C=E-mail, D=Função, E=Link da Planilha.
 * Busca linha existente por nome normalizado (L3+); se não encontrar, appenda.
 * @param {Object} painel  Contrato definido em Modelo.gs
 * @param {string} url     URL retornada por gravarPainel()
 */
function atualizarIndice(painel, url) {
  var indice    = SpreadsheetApp.openById(SPREADSHEET_INDICE_ID);
  var abaIndice = indice.getSheetByName(painel.coordenacao);
  if (!abaIndice) {
    log('AVISO: aba "' + painel.coordenacao + '" não encontrada na planilha-índice. Pulando: ' + painel.pessoa);
    return;
  }

  var nomeNorm  = normalizarNome(painel.pessoa);
  var dados     = abaIndice.getDataRange().getValues();
  var linhaAlvo = -1;

  // Dados começam na L3 (índice 2): L1=título, L2=cabeçalho
  for (var i = 2; i < dados.length; i++) {
    if (normalizarNome(String(dados[i][1])) === nomeNorm) {
      linhaAlvo = i + 1; // 1-indexed
      break;
    }
  }

  if (linhaAlvo === -1) {
    linhaAlvo = abaIndice.getLastRow() + 1;
    abaIndice.getRange(linhaAlvo, 1).setValue(linhaAlvo - 2); // coluna A: sequencial
  }

  abaIndice.getRange(linhaAlvo, 2, 1, 4).setValues([[
    painel.pessoa,
    painel.email || '',
    painel.funcao,
    url
  ]]);

  log('Índice atualizado: ' + painel.pessoa + ' (coord=' + painel.coordenacao + ', linha=' + linhaAlvo + ')');
}

// ─── aplicarCores ─────────────────────────────────────────────────────────────

/**
 * Aplica a paleta da coordenação na aba:
 * - Linha 1 (nome) e linhas de label de cada competência → cor primária + texto branco
 * Não pinta o fundo geral para não sobrescrever formatação existente do template.
 * @param {Sheet}  aba          Aba a formatar
 * @param {string} coordenacao  Ex: 'ACE'
 */
function aplicarCores(aba, coordenacao) {
  var cores     = corDaCoordenacao(coordenacao);
  var isGerente = aba.getName().indexOf('Gerente') !== -1;
  var celulas   = isGerente ? CELULAS_NOTAS_GERENTE  : CELULAS_NOTAS_CONSULTOR;
  var celSint   = isGerente ? CELULA_SINTESE_GERENTE : CELULA_SINTESE_CONSULTOR;
  var maxCol    = aba.getMaxColumns();

  // Linhas de label: 1 acima de cada célula de nota + 1 acima da síntese
  var labelRows = celulas.map(function(ref) {
    return _rowDeCelula(ref) - 1;
  });
  labelRows.push(_rowDeCelula(celSint) - 1);

  // Linha 1 sempre com cor primária (linha do nome)
  labelRows.unshift(1);

  labelRows.forEach(function(row) {
    aba.getRange(row, 1, 1, maxCol)
       .setBackground(cores.primaria)
       .setFontColor(cores.texto)
       .setFontWeight('bold');
  });
}

// ─── helpers privados ─────────────────────────────────────────────────────────

/**
 * Extrai o número de linha de uma referência de célula como 'D7' → 7.
 */
function _rowDeCelula(ref) {
  return parseInt(ref.replace(/[A-Za-z]/g, ''), 10);
}

/**
 * Retorna a subpasta da coordenação dentro da pasta-raiz de painéis,
 * criando-a automaticamente se não existir.
 * O ID da pasta-raiz é persistido via PropertiesService para idempotência.
 */
function _obterOuCriarSubpasta(coordenacao) {
  var props       = PropertiesService.getScriptProperties();
  var pastaRaizId = props.getProperty('PASTA_RAIZ_ID');
  var pastaRaiz;

  if (pastaRaizId) {
    try {
      pastaRaiz = DriveApp.getFolderById(pastaRaizId);
    } catch (e) {
      pastaRaizId = null; // pasta foi deletada ou ID inválido
    }
  }

  if (!pastaRaizId) {
    pastaRaiz = DriveApp.createFolder(PASTA_RAIZ_NOME);
    props.setProperty('PASTA_RAIZ_ID', pastaRaiz.getId());
    log('Pasta-raiz criada: ' + PASTA_RAIZ_NOME + ' (id=' + pastaRaiz.getId() + ')');
  }

  var subs = pastaRaiz.getFoldersByName(coordenacao);
  if (subs.hasNext()) return subs.next();

  var sub = pastaRaiz.createFolder(coordenacao);
  log('Subpasta criada: ' + coordenacao);
  return sub;
}

/**
 * Abre a planilha com o nome dado dentro da pasta, ou cria uma cópia
 * do template caso não exista.
 */
function _obterOuCopiarTemplate(pasta, nome) {
  var arquivos = pasta.getFilesByName(nome);
  if (arquivos.hasNext()) return SpreadsheetApp.open(arquivos.next());

  var copia = DriveApp.getFileById(TEMPLATE_ID).makeCopy(nome, pasta);
  log('Template copiado: ' + nome);
  return SpreadsheetApp.open(copia);
}

/**
 * Preenche as células de cabeçalho da aba (nome, função, ciclo, coordenação).
 * As referências diferem entre Consultor e Gerente conforme layout do template.
 */
function _escreverHeader(aba, painel) {
  if (painel.funcao === 'Gerente') {
    // A1=Nome, B2=Função, B3=Ciclo, B4=Coordenação
    aba.getRange('A1').setValue(painel.pessoa);
    aba.getRange('B2').setValue('Gerente de Projetos');
    aba.getRange('B3').setValue(CICLO_NOME);
    aba.getRange('B4').setValue(painel.coordenacao);
  } else {
    // B1=Nome, C2=Função, C3=Ciclo, C4=Coordenação
    aba.getRange('B1').setValue(painel.pessoa);
    aba.getRange('C2').setValue('Consultor de Projetos');
    aba.getRange('C3').setValue(CICLO_NOME);
    aba.getRange('C4').setValue(painel.coordenacao);
  }
}

/**
 * Escreve as médias por competência e a média geral nas células do template.
 * A ordem de CELULAS_NOTAS_* corresponde à ordem de COMPETENCIAS_* em Config.gs.
 */
function _escreverNotas(aba, painel) {
  var isGerente    = painel.funcao === 'Gerente';
  var celulas      = isGerente ? CELULAS_NOTAS_GERENTE  : CELULAS_NOTAS_CONSULTOR;
  var competencias = isGerente ? COMPETENCIAS_GERENTE   : COMPETENCIAS_CONSULTOR;
  var celSintese   = isGerente ? CELULA_SINTESE_GERENTE : CELULA_SINTESE_CONSULTOR;

  for (var i = 0; i < competencias.length; i++) {
    var media = painel.medias[competencias[i]];
    if (media !== undefined && media !== null) {
      aba.getRange(celulas[i]).setValue(media);
    }
  }

  if (painel.mediaGeral !== undefined && painel.mediaGeral !== null) {
    aba.getRange(celSintese).setValue(painel.mediaGeral);
  }
}
