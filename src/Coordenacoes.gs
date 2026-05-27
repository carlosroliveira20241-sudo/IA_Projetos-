// =============================================================
// Coordenacoes.gs — Paleta de cores fechada por coordenação
// =============================================================

var PALETA = {
  'ACE':     { primaria: '#6A1B9A', secundaria: '#F3E5F5', texto: '#FFFFFF' },
  'CCE':     { primaria: '#00695C', secundaria: '#E0F2F1', texto: '#FFFFFF' },
  'MNP':     { primaria: '#AD1457', secundaria: '#FCE4EC', texto: '#FFFFFF' },
  'PRO':     { primaria: '#1565C0', secundaria: '#E3F2FD', texto: '#FFFFFF' },
  'QAB':     { primaria: '#E65100', secundaria: '#FFF3E0', texto: '#FFFFFF' },
  'DEFAULT': { primaria: '#424242', secundaria: '#F5F5F5', texto: '#FFFFFF' }
};

function corDaCoordenacao(coord) {
  return PALETA[coord] || PALETA['DEFAULT'];
}
