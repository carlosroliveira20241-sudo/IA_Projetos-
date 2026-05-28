// =============================================================
// Cálculos puros (sem nenhuma API do Google)
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

  // vou pegar o nome do membro e pegar os dados associados a esse membro
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

  // ── Acumular notas por competência, basicamente vou contar quantas vezes aquela pessoa foi dada uma nota em uma competência e somar tbm, pra dps calcular médias
  var acumulador = {}; // { nomeCompetenciaNormalizada: { soma, quantidade } }
  competencias.forEach(function(nomeCompetencia) {
    acumulador[normalizarNome(nomeCompetencia)] = { soma: 0, quantidade: 0 };
  });

  // puxando o índice na planilha da nota X daquela pessoa
  var indiceDeNotasDaPessoa = dadosDoFormulario.indiceDeNotas[nomeMembroNormalizado] || {};

  // agora que eu já peguei os índices e os nomes dos membros e das notas eu vou pegar todas as somas e quantidades de vez
  dadosDoFormulario.linhas.forEach(function(linha) {
    competencias.forEach(function(nomeCompetencia) {
      var nomeCompetenciaNormalizada = normalizarNome(nomeCompetencia);
      var colunasDestaCompetencia    = indiceDeNotasDaPessoa[nomeCompetenciaNormalizada] || [];
      // peguei o nome das competências e dos membros. agora vou correr pelas linhas das colunas pra pegar os valores que eu quero
      colunasDestaCompetencia.forEach(function(indiceColuna) {
        var valorBruto = linha[indiceColuna];
        if (valorBruto === null || valorBruto === undefined || valorBruto === '') return;
        var nota = parseFloat(String(valorBruto).replace(',', '.'));
        // mudando a formatacao pra nao dar problema
        if (!isNaN(nota) && nota >= 1 && nota <= 4) {
          acumulador[nomeCompetenciaNormalizada].soma      += nota;
          acumulador[nomeCompetenciaNormalizada].quantidade += 1;
        }
      });
    });
  });

  // médias por competência
  var medias = {};

  // vou pegar cada uma das competências e fazer a média dela
  competencias.forEach(function(nomeCompetencia){
    var acumuladorDaCompetencia = acumulador[normalizarNome(nomeCompetencia)];
    medias[nomeCompetencia] = acumuladorDaCompetencia.quantidade > 0 ? Math.round((acumuladorDaCompetencia.soma / acumuladorDaCompetencia.quantidade)*100)/100 : null
  });

  // média geral

  var valoresDasMedias = competencias

  // vai mapear todas as competencias e vai filtrar só que as não tem nota null, pro cálculo dar certo
  .map(function(nomeCompetencia){return medias[nomeCompetencia];})
  .filter(function(media) {return media!==null});


  // vou fazer a conta da média geral apenas se tiver algum valor não nulo pra trabalhar com
  var mediaGeral = valoresDasMedias.length> 0
  ? Math.round((valoresDasMedias.reduce(function(soma,media) {return soma + media;}, 0) /valoresDasMedias.length)*100)/100 : null

  // feedbacks textuais passados pelo membros que respondem a AD

  var feedbacksDosMembros = []
  var colunasDeFeedback = dadosDoFormulario.indiceDeFeedback[nomeMembroNormalizado] || []

  // ele vai pegar linhas dos dados do formulário, e nesses dados ele vai pegar as linhas das colunas de feedback e vai colocar tudo em uma array de feedbacks que ele vai retornar no final, pra que todos os feedbacks fiquem juntos e o computador separe no final de acordo com o membro

  dadosDoFormulario.linhas.forEach(function(linha){
    colunasDeFeedback.forEach(function(indiceColuna){
      var textoDeFeedback = String(linha[indiceColuna] || '').trim();
      if(textoDeFeedback) feedbacksDosMembros.push(textoDeFeedback)
    })
  })

  // elencando o top 3 pontos fortes e top 3 pontos a se desenvolver do membro

  var competenciasComMedias = competencias
  // fazendo filtrando pra tirar medias com tipo null, depois mapeando todas as medias do membro, e depois usando a função sort pra conseguir elencar o top 3 melhores e top 3 piores
  .filter(function(nomeCompetencia){return medias[nomeCompetencia] !== null})
  .map(function(nomeCompetencia){return {competencia: nomeCompetencia, media:medias[nomeCompetencia]};})
  .sort(function(a,b){return b.media - a.media});

  var topPontosFortes = competenciasComMedias.slice(0,3).map(function(item){return item.competencia})
  var topPontosDesenvolver = competenciasComMedias.slice(-3).reverse().map(function(item) {return item.competencia;
  })

  // agora, com isso tudo listado e elencado, eu vou finalmente retornar algo na minha função, que vão ser todos os dados sobre ela e que eu coletei ao longo do código

  return {
    pessoa:               membro.nome,
    coordenacao:          membro.coordenacao,
    funcao:               funcao,
    email:                membro.email,
    medias:               medias,
    mediaGeral:           mediaGeral,
    feedbacks:            feedbacksDosMembros,
    topPontosFortes:      topPontosFortes,
    topPontosDesenvolver: topPontosDesenvolver
  }
}
