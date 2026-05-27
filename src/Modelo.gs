// =============================================================
// Modelo.gs — Cálculos puros (sem nenhuma API do Google)
// =============================================================

/*
 * Calcula o painel completo de uma pessoa.
 *
 * @param {string} nome               — nome como no Form ou Cadastro (normalizado internamente)
 * @param {Object} dadosDoFormulario  — resultado de lerRespostasDoFormulario()
 * @param {Object} dados              — resultado de lerDadosDosMembros()
 * @returns {Object} painel completo
 */
function calcularPainelDaPessoa(nome, dadosDoFormulario, dados) {
  var nomeMembroNormalizado = normalizarNome(nome);
  var membro                = dados[nomeMembroNormalizado];

  if (!membro) {
    throw new Error(
      'Pessoa "' + nome + '" não encontrada no Cadastro. ' +
      'Use Validar Consistência para listar divergências de nome.'
    );
  }

  var funcao = dadosDoFormulario.indiceDeFuncao[nomeMembroNormalizado] || membro.funcao;

  var competencias = funcao === 'Gerente' ? COMPETENCIAS_GERENTE : COMPETENCIAS_CONSULTOR;

  // ── Acumular notas por competência ───────────────────────────────────────
  var acumulador = {}; // { nomeCompetenciaNormalizada: { soma, quantidade } }
  competencias.forEach(function(nomeCompetencia) {
    acumulador[normalizarNome(nomeCompetencia)] = { soma: 0, quantidade: 0 };
  });

  var indiceDeNotasDaPessoa = dadosDoFormulario.indiceDeNotas[nomeMembroNormalizado] || {};

  dadosDoFormulario.linhas.forEach(function(linha) {
    competencias.forEach(function(nomeCompetencia) {
      var nomeCompetenciaNormalizada = normalizarNome(nomeCompetencia);
      var colunasDestaCompetencia    = indiceDeNotasDaPessoa[nomeCompetenciaNormalizada] || [];
      colunasDestaCompetencia.forEach(function(indiceColuna) {
        var valorBruto = linha[indiceColuna];
        if (valorBruto === null || valorBruto === undefined || valorBruto === '') return;
        var nota = parseFloat(String(valorBruto).replace(',', '.'));
        if (!isNaN(nota) && nota >= 1 && nota <= 4) {
          acumulador[nomeCompetenciaNormalizada].soma      += nota;
          acumulador[nomeCompetenciaNormalizada].quantidade += 1;
        }
      });
    });
  });

  // ── Médias por competência ───────────────────────────────────────────────
  var medias = {};
  competencias.forEach(function(nomeCompetencia) {
    var acumuladorDaCompetencia = acumulador[normalizarNome(nomeCompetencia)];
    medias[nomeCompetencia] = acumuladorDaCompetencia.quantidade > 0
      ? Math.round((acumuladorDaCompetencia.soma / acumuladorDaCompetencia.quantidade) * 100) / 100
      : null;
  });

  // ── Média geral ──────────────────────────────────────────────────────────
  var valoresDasMedias = competencias
    .map(function(nomeCompetencia)    { return medias[nomeCompetencia]; })
    .filter(function(media)           { return media !== null; });

  var mediaGeral = valoresDasMedias.length > 0
    ? Math.round((valoresDasMedias.reduce(function(soma, media) { return soma + media; }, 0) / valoresDasMedias.length) * 100) / 100
    : null;

  // ── Feedbacks textuais ───────────────────────────────────────────────────
  var feedbacks         = [];
  var colunasDeFeedback = dadosDoFormulario.indiceDeFeedback[nomeMembroNormalizado] || [];
  dadosDoFormulario.linhas.forEach(function(linha) {
    colunasDeFeedback.forEach(function(indiceColuna) {
      var texto = String(linha[indiceColuna] || '').trim();
      if (texto) feedbacks.push(texto);
    });
  });

  // ── Top 3 pontos fortes / a desenvolver ─────────────────────────────────
  var competenciasComMedias = competencias
    .filter(function(nomeCompetencia) { return medias[nomeCompetencia] !== null; })
    .map(function(nomeCompetencia)    { return { competencia: nomeCompetencia, media: medias[nomeCompetencia] }; })
    .sort(function(a, b)              { return b.media - a.media; });

  var topPontosFortes      = competenciasComMedias.slice(0, 3).map(function(item) { return item.competencia; });
  var topPontosDesenvolver = competenciasComMedias.slice(-3).reverse().map(function(item) { return item.competencia; });

  return {
    pessoa:               membro.nome,
    coordenacao:          membro.coordenacao,
    funcao:               funcao,
    email:                membro.email,
    medias:               medias,
    mediaGeral:           mediaGeral,
    feedbacks:            feedbacks,
    topPontosFortes:      topPontosFortes,
    topPontosDesenvolver: topPontosDesenvolver
  };
}
