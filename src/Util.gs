// =============================================================
// Util.gs — Logger, normalizarNome, slugNome
// =============================================================

function log(msg) {
  try {
    var ss  = SpreadsheetApp.openById(INDICE_ID);
    var aba = ss.getSheetByName(ABA_LOG);
    if (!aba) {
      aba = ss.insertSheet(ABA_LOG);
      aba.appendRow(['Data/hora', 'Mensagem']);
      aba.getRange('A1:B1').setFontWeight('bold');
    }
    aba.appendRow([new Date(), String(msg)]);
  } catch (e) {
    Logger.log('[LOG FAIL] ' + msg + ' | erro: ' + e);
  }
}

// Remove acentos, lowercase, trim.
function normalizarNome(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Versão slug para nome de arquivo no Drive (kebab, apenas ASCII).
function slugNome(s) {
  return normalizarNome(s)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
