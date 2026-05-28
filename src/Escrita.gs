// =============================================================
// Escrita.gs — Criar/atualizar painéis individuais + e colocar tudo na planilha índice (vulgo essa aqui que os scripts tão)
// =============================================================

function obterOuCriarSubpasta(pastaBase, nomeSubpasta){
  // a primeira coisa que vou fazer é uma função que verifica se a subpasta existe ou não, pra criar ou não a pasta individual com a planilha individual do membro, se tiver pasta, vai nela, se não tiver cria uma

  var subPastasEncontradas = pastaBase.getFoldersByName(nomeSubpasta)
  return subPastasEncontradas.hasNext() ? subPastasEncontradas.next() : pastaBase.createFolder(nomeSubpasta)
}


function obterOuCriarArquivoDePainel(pastaDaCoordenacao, nomeArquivo, funcao){
  // ele verifica se o arquivo existe, e se não existir, cria ele
  var arquivosEncontrados = pastaDaCoordenacao.getFilesByName(nomeArquivo)
  if(arquivosEncontrados.hasNext()) return {file: arquivosEncontrados.next(), novo: false}

  // criar cópia do template e deletar aba que não corresponde ao que à função faz , ou seja, ele vai criar uma aba de gerente e de consultor, e vai deletar a que não se encaixa de acordo com a função do membro

  // vai achar o arquivo do painel do membro e vai abrir ele
  var arquivoCopiado = DriveApp.getFileById(ID_DO_TEMPLATE_DE_EXEMPLO).makeCopy(nomeArquivo, pastaDaCoordenacao)
  var spreadsheet = SpreadsheetApp.openById(arquivoCopiado.getId())

  // vai pegar a aba pelo nome e vai remover ela pelo nome
  var nomeAbaParaRemover = funcao === 'Gerente' ? ABA_TEMPLATE_CONSULTOR : ABA_TEMPLATE_GERENTE
  var abaParaRemover = spreadsheet.getSheetByName(nomeAbaParaRemover)

  // se a aba para remover for válida e tiver mais de 1 aba, ele deleta
  if(abaParaRemover && spreadsheet.getNumSheets() > 1) spreadsheet.deleteSheet(abaParaRemover);

  return {file: arquivoCopiado, novo: true};
}

/*
 * Aplica as cores da coordenação ao painel.
 * - Header (linhas 1-4): cor primária, texto branco
 * - Labels de competência (linha imediatamente acima de cada nota): cor secundária
 * - Label de síntese geral: cor primária
 * - Tabela: cor primária
 */

function aplicarCores(aba,cores,funcao){
  var ultimaColuna = aba.getLastColumn() || 6;

  // cabeçalho, basicamente nessa parte vou colocar o que vai aparecer em cima dos dados, rotulando eles

  aba.getRange(1,1,4,ultimaColuna)
  .setBackground(cores.primaria)
  .setFontColor(cores.texto)

  // A label padrão de competência e notas

  var celulasNotas = funcao === 'Gerente' ? CELULAS_NOTAS_GERENTE : CELULAS_NOTAS_CONSULTOR;
  celulasNotas.forEach(function(celulaDaNota) {
    // vai passar pelas células das notas e deixar elas devidamente rotuladas
    var linhaDaNota  = parseInt(celulaDaNota.replace(/[A-Z]/gi, ''));
    var linhaDaLabel = linhaDaNota - 1;
    // colocando cores e setando tudo
    aba.getRange(linhaDaLabel, 1, 1, ultimaColuna)
       .setBackground(cores.secundaria)
       .setFontColor(cores.primaria)
       .setFontWeight('bold');
  });

  // Label de síntese (linha acima da célula de síntese)

  // aqui ele basicamente pega a linha acima de aonde vai ficar a síntese do desempenho do membro e coloca uma etiqueta nela, igual ao que fizemos em cima

  var celulaDaSintese = funcao === 'Gerente' ? CELULA_MEDIA_GERENTE : CELULA_MEDIA_CONSULTOR

  var linhaDaSintese = parseInt(celulaDaSintese.replace(/[A-Z]/gi, ''))

  aba.getRange(linhaDaSintese -1 , 1, 1, ultimaColuna)
     .setBackground(cores.primaria)
     .setFontColor(cores.texto)
     .setFontWeight('bold');

  aba.setTabColor(cores.primaria)
}

/*
 * Essa parte grava (cria ou atualiza) o painel de um membro.
 * Idempotente: se eu rodar essa função N vezes, resultado é o mesmo, então eu posso sempre criar e alterar o painel de um membro sem precisar que ele preencha os dados novamente.
 */

function gravarPainel(painel){
  log('Iniciando painel: ' + painel.pessoa + ' (' + painel.coordenacao + ')')

  // Pasta raíz, ou seja, a que vai conter todos os paineis, tudo, vai ser nossa pasta geralzona

  var propriedades = PropertiesService.getScriptProperties()
  var idDaPastaDePaineis = propriedades.getProperty('PASTA_PAINEIS_ID')
  var pastaDePaineis;


  // pegando a pasta geralzona
  if(idDaPastaDePaineis){
    try{
      pastaDePaineis = DriveApp.getFolderById(idDaPastaDePaineis)
    }catch (e){
      pastaDePaineis = null
    }
  }

  // se ela não existir, vai criar ela
  if(!pastaDePaineis){
    pastaDePaineis = DriveApp.createFolder('Painéis de Membros - AD' + CICLO_ATUAL)
    propriedades.setProperty('PASTA_PAINEIS_ID', pastaDePaineis.getId())
  }

  // subpasta das coordenações

  var pastaDaCoordenacao = obterOuCriarSubpasta(pastaDePaineis, painel.coordenacao)

  // arquivos de painel (o painel de todos os membros)

  var nomeArquivo = 'Painel - ' + painel.pessoa
  // vai storar o arquivo de cada um dos membros na var resultado
  var resultado = obterOuCriarArquivoDePainel(pastaDaCoordenacao, nomeArquivo, painel.funcao)
  var arquivoDoPainel = resultado.file

  // abrir a planilha sempre na aba correta onde estiver o painel do membro

  var spreadsheetDoPainel = SpreadsheetApp.openById(arquivoDoPainel.getId())
  var nomeAba = painel.funcao === 'Gerente' ? ABA_TEMPLATE_GERENTE : ABA_TEMPLATE_CONSULTOR
  var abaDoPainel = spreadsheetDoPainel.getSheetByName(nomeAba)
  // peguei a planilha, e peguei a aba específica dentro da planilha
  if(!abaDoPainel){
    throw new Error('Aba "' + nomeAba + '" não encontrada no painel de '+ painel.pessoa)
  }

  // Limpar a área de dados pra manter a estrutura do template intacta

  abaDoPainel.clearContents();

  // escrevendo o cabeçalho da planilha

  var ehGerente = painel.funcao === 'Gerente';

  // aqui ele vai escrever um cabeçalho com os dados, e esse vai mudar dependendo ser for gerente ou consultor

  if(ehGerente){
      abaDoPainel.getRange(CELULA_NOME_GERENTE  ).setValue(painel.pessoa);
      abaDoPainel.getRange(CELULA_FUNCAO_GERENTE).setValue('Gerente de Projetos');
      abaDoPainel.getRange(CELULA_CICLO_GERENTE ).setValue(CICLO_ATUAL);
      abaDoPainel.getRange(CELULA_COORD_GERENTE ).setValue(painel.coordenacao)
  }else{
    abaDoPainel.getRange(CELULA_NOME_CONSULTOR  ).setValue(painel.pessoa);
      abaDoPainel.getRange(CELULA_FUNCAO_CONSULTOR).setValue('Consultor de Projetos');
      abaDoPainel.getRange(CELULA_CICLO_CONSULTOR ).setValue(CICLO_ATUAL);
      abaDoPainel.getRange(CELULA_COORD_CONSULTOR ).setValue(painel.coordenacao);
  }

  // notas por competência

  var competencias = ehGerente? COMPETENCIAS_GERENTE : COMPETENCIAS_CONSULTOR
  var celulasNotas  = ehGerente ? CELULAS_NOTAS_GERENTE: CELULAS_NOTAS_CONSULTOR;
  var celulaSintese = ehGerente ? CELULA_MEDIA_GERENTE : CELULA_MEDIA_CONSULTOR;

  // pegar as notas, as competências e calcular a média do membro em cada uma das competências

  competencias.forEach(function(nomeCompetencia, indice){
    var celulaDaCompetencia = celulasNotas[indice]
    if(!celulaDaCompetencia) return
    var media = painel.medias[nomeCompetencia]
    // mudando o valor da célula
    abaDoPainel.getRange(celulaDaCompetencia).setValue(media !== null ? media: '-')
  })

  // síntese geral, ou seja, a média geral do membro, levando em consideração todas as competências

  // basicamente, a lógica aqui e no de cima também é assim, se a nota não for nula, ele mostra na tela, se for, ele mostra esse traço
  abaDoPainel.getRange(celulaSintese).setValue(painel.mediaGeral !== null ? painel.mediaGeral : "-")

  // cores de cada coordenação (LEMBRAR QUE O CORES.GS TA COM AS CORES ERRADAS)

  aplicarCores(abaDoPainel, CorDaCoordenacao(painel.coordenacao), painel.funcao)

  SpreadsheetApp.flush();

  // atualizando a própria planilha índice (essa em que os scripts estão)

  atualizarIndice(painel, arquivoDoPainel.getUrl())

  log('Painel de ' + painel.pessoa + ' gravado. ' + arquivoDoPainel.getUrl())
}

/*
 * Insere ou atualiza a linha do membro na aba de coordenação da planilha-índice.
 * Estrutura da aba: L1=título, L2=cabeçalho, L3 pra frente=dados.
 * Colunas: A=#  B=Nome  C=E-mail  D=Função  E=Link  F=Reunião Agendada  G=Reunião Realizada  H=Observações
 */


function atualizarIndice(painel,urlDoPainel){
  var spreadsheet = SpreadsheetApp.openById(ID_INDICE)
  var abaDaCoordenacao = spreadsheet.getSheetByName(painel.coordenacao)
  if(!abaDaCoordenacao){
    log('AVISO: aba "' + painel.coordenacao + '" não encontrada na planilha-índice. Pulando.');
    return;
  }

  // essas variáveis aqui vão pegar os dados da pessoa e em qual linha
  var dadosDaAba = abaDaCoordenacao.getDataRange().getValues()
  var nomePessoaNormalizado = normalizarNome(painel.pessoa)
  var linhaEncontrada = -1

  // Procurar linha existente pelo nome (col B = índice 1)
  // Linhas de dados começam em dadosDaAba[2] (L3)

  // ele basicamente vai procurar linhas entre as colunas B-E pra ver se vai ser necessário criar essa linha e adicionar o valor ou só editar o valor que já está ali

  for (var indiceDaLinha = 2; indiceDaLinha < dadosDaAba.length; indiceDaLinha++) {
    if (normalizarNome(String(dadosDaAba[indiceDaLinha][1])) === nomePessoaNormalizado) {
      linhaEncontrada = indiceDaLinha + 1; // +1 porque getValues() é 0-based e Sheet é 1-based
      break;
    }
  }

  var labelDaFuncao = painel.funcao === 'Gerente' ? 'Gerente de Projetos' : 'Consultor de Projetos'

  // se ele encontrar a linha, atualiza, se ele não encontrar, cria
  if(linhaEncontrada !== -1){
     // Atualizar linha existente: cols B-E (colunas 2 a 5, 1-based)
    abaDaCoordenacao.getRange(linhaEncontrada, 2, 1, 4).setValues([[painel.pessoa, painel.email, labelDaFuncao, urlDoPainel]]);
  }else{
    var numeroDaLinha = abaDaCoordenacao.getLastRow() - 1; // linhas de dados anteriores = lastRow - título - cabeçalho + 1
    abaDaCoordenacao.appendRow([numeroDaLinha, painel.pessoa, painel.email, labelDaFuncao, urlDoPainel, false, false, '']);
  }
}
