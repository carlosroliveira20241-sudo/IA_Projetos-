// =============================================================
// funções auxiliares: gravar coisas no log e normalizar os nomes, é uma parte mais técnica
// =============================================================


// escrever mensagens de log, pra documentar uso e possíveis erros da planilha
function log(msg) {
  try {
    var ss  = SpreadsheetApp.openById(ID_INDICE);
    var aba = ss.getSheetByName(ABA_LOG);
    if (!aba) {
      aba = ss.insertSheet(ABA_LOG);
      aba.appendRow(['Data/hora', 'Mensagem']);
      aba.getRange('A1:B1').setFontWeight('bold');
    }
    aba.appendRow([new Date(), String(msg)]);
  } catch (e) {
    Logger.log(msg + ' | erro: ' + e);
  }
}

// Deixa todos os nomes no mesmo formato, pra ajudar a tratar esses dados depois
function normalizarNome(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
