// =============================================================
// Main.gs, basicamente aqui vão ser comandadas as ações base que a gente vai fazer na planilha
// =============================================================


// colcocando as funções gerais em um menu em uma UI
function onOpen(){
  SpreadsheetApp.getUi()
  .createMenu('AD- Fluxo')
  .addItem('Atualizar painel de uma pessoa…', 'atualizarUmaPessoa')
  .addItem('Atualizar paineis de TODOS' , 'atualizarTodos')
  .addSeparator()
  .addItem('Validar consistência cadastro - Form', 'validarConsistencia')
  .addItem('Abrir pasta de painéis no drive', 'abrirPastaDePaineis')
  .addSeparator()
  .addItem('Limpar log de mensagens', 'limparLog')
  .addToUi()
}

// atualizar os dados de um membro

function atualizarUmaPessoa(){
  var ui = SpreadsheetApp.getUi()
  var resposta = ui.prompt(
    'AD Fluxo - Atualizar painel',
    'Digite o nome da pessoa:',
    ui.ButtonSet.OK_CANCEL
  )
  // ele não retorna nada se o usuário nao apertar no botao
  if(resposta.getSelectedButton() !== ui.Button.OK) return;

  var nome = resposta.getResponseText().trim();
  if(!nome) return;

  // vai pegar os dados e atualizar o painel de uma pessoa em específico
  try{
    log('=== atualizar uma pessoa "' + nome + '" ===')
    var dados = lerDadosDosMembros()
    var dadosDoFormulario = lerRespostasDoFormulario()
    var painel = calcularPainelDaPessoa(nome, dadosDoFormulario, dados)
    gravarPainel(painel)
    ui.alert('✅ Painel de "' + painel.pessoa + '" atualizado com sucesso!')
  }catch (e){
    log('ERRO em atualizarUmaPessoa: ' + e)
    ui.alert('Erro' + e.message)
  }
}

// Atualizar dados de todos os membros, clicar nisso aqui pra gerar novos painéis

function atualizarTodos(){
  var ui = SpreadsheetApp.getUi()
  var botaoSelecionado = ui.alert(
    'AD fluxo',
    'Isso vai gerar/atualizar painéis de TODOS os membros que estão cadastrados na planilha. \nCotinuar?',
    ui.ButtonSet.YES_NO
  )

  if(botaoSelecionado !== ui.Button.YES) return;

  log('===atualizarTodos')
  try{
    var dados = lerDadosDosMembros()
    var dadosDoFormulario = lerRespostasDoFormulario()

    // ai aqui ele vai limpar as linhas antes de inserir novamente os dados

    var planilhaIndice = SpreadsheetApp.openById(ID_INDICE)
    COORDENACOES.forEach(function(coordenacao){
      var aba = planilhaIndice.getSheetByName(coordenacao)
      if (!aba) return
      var ultimaLinha = aba.getLastRow()
      if(ultimaLinha>=3){
        aba.deleteRows(3, ultimaLinha -2)
      }
    })

    // ai agora que ele limpou, ele vai criar de novo os painéis, ou seja, vai atualizar de novo as planilhas

    var erros = []
    var sucesso = 0

    Object.keys(dados).forEach(function(nomeNormalizado){
      var membro = dados[nomeNormalizado]
      try{
        var painel = calcularPainelDaPessoa(membro.nome, dadosDoFormulario, dados)
        gravarPainel(painel)
        sucesso++;
      }catch(e){
        erros.push(membro.nome + ':' + e.message)
        log('Erro em' + membro.nome + ':' + e)
      }
    })

    var mensagem = sucesso + 'painéis gerados'
    if (erros.length) mensagem +=  + erros.length + ' erro(s):\n' + erros.join('\n');
    ui.alert(mensagem);

  }catch(e){
      log('Erro em atualizarTodos: ' + e);
      ui.alert('Erro: ' + e.message);
  }
}

// Validar consistência dos dados, ou seja, vai ver se os dados que tão na planilha e as respostas do formulário estão sincronzizadas

function validarConsistencia(){
  log('=== validar se as respostas batem ===')

  var dados = lerDadosDosMembros()
  var dadosDoFormulario = lerRespostasDoFormulario()

  var nomesDoCadastroNormalizados = Object.keys(dados)
  var nomesDoFormNormalizados = Object.keys(dadosDoFormulario.indiceDeNotas)

  var somenteNoForm = nomesDoFormNormalizados.filter(function(nome){
    return nomesDoCadastroNormalizados.indexOf(nome) === -1
  })

  var somenteNoCadastro = nomesDoCadastroNormalizados.filter(function(nome){
    return nomesDoFormNormalizados.indexOf(nome) === -1;
  })

  var linhasDoRelatorio = ['=== Validação de Consistência ===']
  // vai falar o que tem em um e não tem em outro

  if(somenteNoForm.length === 0 && somenteNoCadastro.length === 0){
    linhasDoRelatorio.push('Cadastro e forms em sincronia')
  }else{
    if (somenteNoForm.length) {
      linhasDoRelatorio.push('\n No Form mas NÃO no Cadastro (' + somenteNoForm.length + '):');
      somenteNoForm.forEach(function(nome) {
        linhasDoRelatorio.push('  • ' + (dadosDoFormulario.nomeOriginal[nome] || nome));
      });
    }
    if (somenteNoCadastro.length) {
      linhasDoRelatorio.push('\n No Cadastro mas NÃO no Form (' + somenteNoCadastro.length + '):');
      somenteNoCadastro.forEach(function(nome) {
        linhasDoRelatorio.push('  • ' + dados[nome].nome + ' (' + dados[nome].coordenacao + ')');
      });
    }
  }
   var relatorio = linhasDoRelatorio.join('\n')
   log(relatorio)

   var ui = SpreadsheetApp.getUi()
   if(relatorio.length < 1200){
    ui.alert(relatorio)
   }else{
    ui.alert("Relatório completo gravado na aba 'Log' da planilha índice")
   }
}

// utilitários de menu, basicamente são alguns caras que vão facilitar a sua vida

function abrirPastaDePaineis(){
  var propriedades = PropertiesService.getScriptProperties()
  var idDaPasta = propriedades.getProperty('PASTA_PAINEIS_ID')


  if(!idDaPasta){
    SpreadsheetApp.getUi().alert('Pasta ainda não criada, gere ao menos um painel primeiro');
    return
  }

  var linkDaPasta = 'https://drive.google.com/drive/folders/' + idDaPasta;

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(
      '<script>window.open("' + linkDaPasta + '","_blank");google.script.host.close();</script>'
    ),
    'Abrindo pasta...'
  )
}

function limparLog(){
  var spreadsheet = SpreadsheetApp.openById(ID_INDICE)
  var abaDeLog = spreadsheet.getSheetByName(ABA_LOG)

  if(!abaDeLog) return

  abaDeLog.clearContents()
  abaDeLog.appendRow(['Data/Hora', 'Mensagem'])
  abaDeLog.getRange('A1:B1').setFontWeight('bold')
}
