// =============================================================
// Main.gs — Menu, orquestração
// =============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🤖 AD Fluxo')
    .addItem('Atualizar painel de uma pessoa…', 'atualizarUmaPessoa')
    .addItem('Atualizar painéis de TODOS',      'atualizarTodos')
    .addSeparator()
    .addItem('Validar consistência cadastro × Form', 'validarConsistencia')
    .addItem('Abrir pasta de painéis no Drive',      'abrirPastaDePaineis')
    .addSeparator()
    .addItem('Limpar log', 'limparLog')
    .addToUi();
}

// ── Atualizar uma pessoa ─────────────────────────────────────────────────────

function atualizarUmaPessoa() {
  var ui      = SpreadsheetApp.getUi();
  var resposta = ui.prompt(
    '🤖 AD Fluxo — Atualizar painel',
    'Digite o nome da pessoa (ou parte do nome):',
    ui.ButtonSet.OK_CANCEL
  );
  if (resposta.getSelectedButton() !== ui.Button.OK) return;

  var nome = resposta.getResponseText().trim();
  if (!nome) return;

  try {
    log('=== atualizarUmaPessoa: "' + nome + '" ===');
    var dados             = lerDadosDosMembros();
    var dadosDoFormulario = lerRespostasDoFormulario();
    var painel            = calcularPainelDaPessoa(nome, dadosDoFormulario, dados);
    gravarPainel(painel);
    ui.alert('✅ Painel de "' + painel.pessoa + '" atualizado com sucesso!');
  } catch (e) {
    log('ERRO em atualizarUmaPessoa: ' + e);
    ui.alert('❌ Erro: ' + e.message);
  }
}

// ── Atualizar todos ──────────────────────────────────────────────────────────

function atualizarTodos() {
  var ui               = SpreadsheetApp.getUi();
  var botaoSelecionado = ui.alert(
    '🤖 AD Fluxo',
    'Isso vai gerar/atualizar painéis de TODOS os membros do Cadastro.\nContinuar?',
    ui.ButtonSet.YES_NO
  );
  if (botaoSelecionado !== ui.Button.YES) return;

  log('=== atualizarTodos ===');
  try {
    var dados             = lerDadosDosMembros();
    var dadosDoFormulario = lerRespostasDoFormulario();

    // Limpar linhas de dados do índice (L3+) antes de reinserir tudo
    var planilhaIndice = SpreadsheetApp.openById(ID_INDICE);
    COORDENACOES.forEach(function(coordenacao) {
      var aba         = planilhaIndice.getSheetByName(coordenacao);
      if (!aba) return;
      var ultimaLinha = aba.getLastRow();
      if (ultimaLinha >= 3) aba.deleteRows(3, ultimaLinha - 2);
    });

    var erros   = [];
    var sucesso = 0;

    Object.keys(dados).forEach(function(nomeNormalizado) {
      var membro = dados[nomeNormalizado];
      try {
        var painel = calcularPainelDaPessoa(membro.nome, dadosDoFormulario, dados);
        gravarPainel(painel);
        sucesso++;
      } catch (e) {
        erros.push(membro.nome + ': ' + e.message);
        log('ERRO em ' + membro.nome + ': ' + e);
      }
    });

    var mensagem = '✅ ' + sucesso + ' painel(is) gerado(s).';
    if (erros.length) mensagem += '\n\n⚠️ ' + erros.length + ' erro(s):\n' + erros.join('\n');
    ui.alert(mensagem);

  } catch (e) {
    log('ERRO FATAL em atualizarTodos: ' + e);
    ui.alert('❌ Erro fatal: ' + e.message);
  }
}

// ── Validar consistência ────────────────────────────────────────────────────

function validarConsistencia() {
  log('=== validarConsistencia ===');

  var dados             = lerDadosDosMembros();
  var dadosDoFormulario = lerRespostasDoFormulario();

  var nomesDoCadastroNormalizados = Object.keys(dados);
  var nomesDoFormNormalizados     = Object.keys(dadosDoFormulario.indiceDeNotas);

  var somenteNoForm     = nomesDoFormNormalizados.filter(function(nome) { return nomesDoCadastroNormalizados.indexOf(nome) === -1; });
  var somenteNoCadastro = nomesDoCadastroNormalizados.filter(function(nome) { return nomesDoFormNormalizados.indexOf(nome) === -1; });

  var linhasDoRelatorio = ['=== Validação de Consistência ==='];

  if (somenteNoForm.length === 0 && somenteNoCadastro.length === 0) {
    linhasDoRelatorio.push('✅ Cadastro e Form Responses estão em sincronia!');
  } else {
    if (somenteNoForm.length) {
      linhasDoRelatorio.push('\n⚠️ No Form mas NÃO no Cadastro (' + somenteNoForm.length + '):');
      somenteNoForm.forEach(function(nome) {
        linhasDoRelatorio.push('  • ' + (dadosDoFormulario.nomeOriginal[nome] || nome));
      });
    }
    if (somenteNoCadastro.length) {
      linhasDoRelatorio.push('\n⚠️ No Cadastro mas NÃO no Form (' + somenteNoCadastro.length + '):');
      somenteNoCadastro.forEach(function(nome) {
        linhasDoRelatorio.push('  • ' + dados[nome].nome + ' (' + dados[nome].coordenacao + ')');
      });
    }
  }

  var relatorio = linhasDoRelatorio.join('\n');
  log(relatorio);

  var ui = SpreadsheetApp.getUi();
  if (relatorio.length < 1200) {
    ui.alert(relatorio);
  } else {
    ui.alert('Relatório completo gravado na aba "Log" da planilha-índice.');
  }
}

// ── Utilitários de menu ──────────────────────────────────────────────────────

function abrirPastaDePaineis() {
  var propriedades = PropertiesService.getScriptProperties();
  var idDaPasta    = propriedades.getProperty('PASTA_PAINEIS_ID');

  if (!idDaPasta) {
    SpreadsheetApp.getUi().alert('Pasta ainda não criada. Gere ao menos um painel primeiro.');
    return;
  }

  var linkDaPasta = 'https://drive.google.com/drive/folders/' + idDaPasta;
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(
      '<script>window.open("' + linkDaPasta + '","_blank");google.script.host.close();</script>'
    ),
    'Abrindo pasta…'
  );
}

function limparLog() {
  var spreadsheet = SpreadsheetApp.openById(ID_INDICE);
  var abaDeLog    = spreadsheet.getSheetByName(ABA_LOG);
  if (!abaDeLog) return;
  abaDeLog.clearContents();
  abaDeLog.appendRow(['Data/hora', 'Mensagem']);
  abaDeLog.getRange('A1:B1').setFontWeight('bold');
}