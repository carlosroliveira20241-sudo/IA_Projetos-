// =============================================================
// Respostas do formulário e nome de todos os membros
// =============================================================

/*
 * Lê os nomes e dados no geral de todos os membros, gerentes e consultores (abas "Projetos e Equipes {COORD}") e retorna
 * um mapa: mapa → { nome, coordenacao, funcao, email }
 *
 * Regra de inferência de função:
 *   Apareceu como Gerente (col C) em qualquer projeto → funcao = 'Gerente'
 *   Apareceu somente como Consultor (cols D-I)        → funcao = 'Consultor'
 */

function lerDadosDosMembros() {
  var spreadsheet    = SpreadsheetApp.openById(ID_PLANILHA_PROJETOS_E_EQUIPES);
  var abasDaPlanilha = spreadsheet.getSheets();

  var dados    = {}; // nomeMembroNormalizado → { nome, coordenacao, funcao, email }
  var gerentes = {}; // nomeMembroNormalizado → true

  abasDaPlanilha.forEach(function(aba) {
    var nomeAba     = aba.getName();
    var coordenacao = null;
    for (var indice = 0; indice < COORDENACOES.length; indice++) {
      if (nomeAba === NOME_DAS_ABAS_DE_PROJETOS_E_EQUIPES.replace('[Coordenação]', COORDENACOES[indice])) {
        coordenacao = COORDENACOES[indice];
        break;
      }
    }
    if (!coordenacao) return;

    var dadosDoMembro = aba.getDataRange().getValues();
    // Linha 0 = cabeçalho (Projeto | Equipe | Gerente | Consultores...)
    // Linhas seguintes = projetos, enquanto há conteúdo nas cols C-I (índices 2-8)

    for (var indiceDaLinha = 1; indiceDaLinha < dadosDoMembro.length; indiceDaLinha++) {
      var linha = dadosDoMembro[indiceDaLinha];

      // checando se a linha tem conteúdo em pelo menos uma coluna de Gerente ou Consultor
      var temConteudo = false;
      for (var indiceLinha = 2; indiceLinha <= 8; indiceLinha++) {
        if (linha[indiceLinha] && String(linha[indiceLinha]).trim()) { temConteudo = true; break; }
      }
      if (!temConteudo) continue;

      // Coluna C (índice 2) => a dos gerentes
      var nomeGerente = String(linha[2] || '').trim();
      if (nomeGerente) {
        var nomeGerenteNormalizado = normalizarNome(nomeGerente);
        gerentes[nomeGerenteNormalizado] = true;
        if (!dados[nomeGerenteNormalizado]) {
          dados[nomeGerenteNormalizado] = { nome: nomeGerente, coordenacao: coordenacao, funcao: 'Gerente', email: '' };
        }
      }

      // Cols D-I (índices 3-8) = Consultores
      for (var indiceConsultor = 3; indiceConsultor <= 8; indiceConsultor++) {
        var nomeConsultor = String(linha[indiceConsultor] || '').trim();
        if (!nomeConsultor) continue;
        var nomeConsultorNormalizado = normalizarNome(nomeConsultor);
        if (!dados[nomeConsultorNormalizado]) {
          dados[nomeConsultorNormalizado] = { nome: nomeConsultor, coordenacao: coordenacao, funcao: 'Consultor', email: '' };
        }
      }
    }
  });

  // segunda passagem: se alguém apareceu como gerente em algum projeto mas foi registrado
  // como consultor antes, a gente corrige aqui
  Object.keys(dados).forEach(function(nomeNormalizado) {
    if (gerentes[nomeNormalizado]) dados[nomeNormalizado].funcao = 'Gerente';
  });

  return dados;
}

/*
 * Interpreta o cabeçalho de uma coluna de nota.
 * Formato esperado: "Projeto | Pessoa (Gerente|Consultor) [Competência]"
 * Retorna { projeto, pessoa, papel, competencia } ou null.
 */
function interpretarCabecalhoDeNota(titulo) {
  var correspondencia = String(titulo).match(
    /^(.+?)\s*\|\s*(.+?)\s*\((Gerente|Consultor)\)\s*\[(.+?)\]\s*$/
  );
  if (!correspondencia) return null;
  return {
    projeto:     correspondencia[1].trim(),
    pessoa:      correspondencia[2].trim(),
    papel:       correspondencia[3].trim(),
    competencia: correspondencia[4].trim()
  };
}

/*
 * Interpreta o cabeçalho de uma coluna de feedback.
 * Formato esperado: "Projeto | Feedback | Pessoa"
 * Retorna { projeto, pessoa } ou null.
 */
function interpretarCabecalhoFeedback(titulo) {
  var correspondencia = String(titulo).match(
    /^(.+?)\s*\|\s*Feedback\s*\|\s*(.+?)\s*$/
  );
  if (!correspondencia) return null;
  return { projeto: correspondencia[1].trim(), pessoa: correspondencia[2].trim() };
}

/*
 * Lê o Form Responses e constrói índices de colunas por pessoa/competência.
 *
 * Retorna:
 *   linhas           — array de linhas de dados (sem cabeçalho)
 *   indiceDeNotas    — { nomePessoaNormalizado: { nomeCompetenciaNormalizada: [indiceColuna, ...] } }
 *   indiceDeFeedback — { nomePessoaNormalizado: [indiceColuna, ...] }
 *   indiceDeFuncao   — { nomePessoaNormalizado: 'Gerente'|'Consultor' }
 *   nomeOriginal     — { nomePessoaNormalizado: nome como aparece no Form }
 */
function lerRespostasDoFormulario() {
  var spreadsheet    = SpreadsheetApp.openById(ID_AVALIACAO_DE_PROJETOS);
  var abaDeRespostas = spreadsheet.getSheetByName(ABA_DE_RESPOSTAS_DO_FORMS);
  if (!abaDeRespostas) {
    throw new Error(
      'Aba "' + ABA_DE_RESPOSTAS_DO_FORMS + '" não encontrada na planilha de Avaliação de Projetos. ' +
      'Verifique ABA_DE_RESPOSTAS_DO_FORMS em Config.gs.'
    );
  }

  var dadosDoFormulario = abaDeRespostas.getDataRange().getValues();
  var cabecalho         = dadosDoFormulario[0];
  var linhas            = dadosDoFormulario.slice(1);

  var indiceDeNotas    = {}; // { nomePessoaNormalizado: { nomeCompetenciaNormalizada: [indiceColuna] } }
  var indiceDeFeedback = {}; // { nomePessoaNormalizado: [indiceColuna] }
  var indiceDeFuncao   = {}; // { nomePessoaNormalizado: 'Gerente'|'Consultor' }
  var nomeOriginal     = {}; // { nomePessoaNormalizado: nome como no Form }

  for (var indiceColuna = 0; indiceColuna < cabecalho.length; indiceColuna++) {
    var titulo = String(cabecalho[indiceColuna]).trim();

    var cabecalhoDaNota = interpretarCabecalhoDeNota(titulo);
    if (cabecalhoDaNota) {
      var nomePessoaNormalizado      = normalizarNome(cabecalhoDaNota.pessoa);
      var nomeCompetenciaNormalizada = normalizarNome(cabecalhoDaNota.competencia);
      if (!indiceDeNotas[nomePessoaNormalizado])                             indiceDeNotas[nomePessoaNormalizado] = {};
      if (!indiceDeNotas[nomePessoaNormalizado][nomeCompetenciaNormalizada]) indiceDeNotas[nomePessoaNormalizado][nomeCompetenciaNormalizada] = [];
      indiceDeNotas[nomePessoaNormalizado][nomeCompetenciaNormalizada].push(indiceColuna);
      indiceDeFuncao[nomePessoaNormalizado] = cabecalhoDaNota.papel;
      nomeOriginal[nomePessoaNormalizado]   = cabecalhoDaNota.pessoa;
      continue;
    }

    var cabecalhoDoFeedback = interpretarCabecalhoFeedback(titulo);
    if (cabecalhoDoFeedback) {
      var nomePessoaFeedbackNormalizado = normalizarNome(cabecalhoDoFeedback.pessoa);
      if (!indiceDeFeedback[nomePessoaFeedbackNormalizado]) indiceDeFeedback[nomePessoaFeedbackNormalizado] = [];
      indiceDeFeedback[nomePessoaFeedbackNormalizado].push(indiceColuna);
      if (!nomeOriginal[nomePessoaFeedbackNormalizado]) nomeOriginal[nomePessoaFeedbackNormalizado] = cabecalhoDoFeedback.pessoa;
    }
  }

  return {
    linhas:           linhas,
    indiceDeNotas:    indiceDeNotas,
    indiceDeFeedback: indiceDeFeedback,
    indiceDeFuncao:   indiceDeFuncao,
    nomeOriginal:     nomeOriginal
  };
}
