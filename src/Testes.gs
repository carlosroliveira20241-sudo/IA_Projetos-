// =============================================================
// Testes.gs — Funções de teste manuais (apagar após validação)
// Rodar via menu "Executar" no editor do Apps Script.
// =============================================================

function testeNormalizarNome() {
  Logger.log(normalizarNome('Pedro de Souza Ângelo')); // pedro de souza angelo
  Logger.log(normalizarNome('ANNA CLARA Moura'));      // anna clara moura
  Logger.log(normalizarNome('Lívia Alves da Costa'));  // livia alves da costa
}

function testeLerCadastro() {
  var dados  = lerDadosDosMembros();
  var nomes  = Object.keys(dados);
  Logger.log('Total de membros no Cadastro: ' + nomes.length);
  nomes.slice(0, 5).forEach(function(nomeNormalizado) {
    Logger.log(JSON.stringify(dados[nomeNormalizado]));
  });
}

function testeLerFormResponses() {
  var dadosDoFormulario = lerRespostasDoFormulario();
  Logger.log('Pessoas com notas no Form: '    + Object.keys(dadosDoFormulario.indiceDeNotas).length);
  Logger.log('Pessoas com feedback no Form: ' + Object.keys(dadosDoFormulario.indiceDeFeedback).length);
  var amostra = Object.keys(dadosDoFormulario.indiceDeNotas).slice(0, 2);
  amostra.forEach(function(nomeNormalizado) {
    Logger.log(
      (dadosDoFormulario.nomeOriginal[nomeNormalizado] || nomeNormalizado) +
      ' (' + dadosDoFormulario.indiceDeFuncao[nomeNormalizado] + '): ' +
      Object.keys(dadosDoFormulario.indiceDeNotas[nomeNormalizado]).join(', ')
    );
  });
}

function testeValidarConsistencia() {
  validarConsistencia(); // usa o menu diretamente
}

// Substitua o nome abaixo por um membro real antes de rodar.
var NOME_TESTE = 'Pedro de Souza Angelo';

function testeCalcularPainel() {
  var dados             = lerDadosDosMembros();
  var dadosDoFormulario = lerRespostasDoFormulario();
  var painel            = calcularPainelDaPessoa(NOME_TESTE, dadosDoFormulario, dados);
  Logger.log(JSON.stringify(painel, null, 2));
}

function testeGravarUmPainel() {
  var dados             = lerDadosDosMembros();
  var dadosDoFormulario = lerRespostasDoFormulario();
  var painel            = calcularPainelDaPessoa(NOME_TESTE, dadosDoFormulario, dados);
  gravarPainel(painel);
  Logger.log('OK — painel de ' + painel.pessoa + ' gravado.');
}