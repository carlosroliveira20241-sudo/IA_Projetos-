// =============================================================
// Constantes globais, basicamente todos os nomes que a gente vai usar ao longo do código vão ficar definidos nesse arquivo
// Atualizar os IDs das planilhas e confirmar ?? antes de rodar.
// =============================================================

// IDs das 4 planilhas do Drive
var ID_DO_TEMPLATE_DE_EXEMPLO  = '1uM6Wr6gp6N8pW_gb8lYuuY3JTFYmuZ45tKesjisEFWQ';
var ID_PLANILHA_PROJETOS_E_EQUIPES = '1KSnCTmL5F8aecSiNYBGDAcOoYHQM7gTyFGpgxNsCsaE';
var ID_AVALIACAO_DE_PROJETOS = '1bUWKFtNYIYLiuC_z7Qu-c2XiAmnCHCvIb2wyrOdjgKU';
var ID_INDICE = '1wpJBrxEG_UEfr3uP_7fO6ie6hj-lNSxjQl7YW3VYZZI';

// Nome exato da aba onde o Google Form grava respostas (confirmar isso)

var ABA_DE_RESPOSTAS_DO_FORMS = 'Respostas ao formulário 1'

// Aba de log na planilha-índice

var ABA_LOG = 'Log'

// Exibir o ciclo atual no painel

var CICLO_ATUAL = 'Maio de 2026'

// Nomes da coordenações

var COORDENACOES = ['ACE', 'CCE', 'MNP', 'QAB', 'PRO']

// Prefixo das abas de projetos e equipes

var NOME_DAS_ABAS_DE_PROJETOS_E_EQUIPES = 'Projetos e Equipes [Coordenação]'

// Nome das abas de template

var ABA_TEMPLATE_CONSULTOR = 'Exemplo — Consultor';
var ABA_TEMPLATE_GERENTE   = 'Exemplo — Gerente';

// Todas as competências, separadas por função (consultor e gerente)

var COMPETENCIAS_CONSULTOR = [
  'Disciplina',
  'Organização',
  'Adaptabilidade',
  'Trabalho em Equipe',
  'Influência e Mobilização',
  'Comunicação Assertiva',
  'Excelência Técnica',
  'Gestão de Riscos'
];

var COMPETENCIAS_GERENTE = [
  'Disciplina',
  'Organização',
  'Adaptabilidade',
  'Trabalho em Equipe',
  'Influência e Mobilização',
  'Comunicação Assertiva',
  'Excelência Técnica',
  'Gestão de Riscos',
  'Delegar Tarefas',
  'Gestão de Pessoas',
  'Pensamento Estratégico e Holístico'
];

// ── Mapeamento de células: Consultor (notas col D, feedback IA col B) ──────
var CELULAS_NOTAS_CONSULTOR      = ['D7','D11','D15','D19','D23','D27','D31','D35'];
var CELULA_SINTESE_CONSULTOR     = 'D39';
var CELULA_FEEDBACK_IA_CONSULTOR = 'B39'; // Parte 2

var CELULA_NOME_CONSULTOR   = 'B1';
var CELULA_FUNCAO_CONSULTOR = 'C2';
var CELULA_CICLO_CONSULTOR  = 'C3';
var CELULA_COORD_CONSULTOR  = 'C4';

// ── Mapeamento de células: Gerente (notas col C, feedback IA col A) ────────
var CELULAS_NOTAS_GERENTE      = ['C7','C11','C15','C19','C23','C27','C31','C35','C39','C43','C47'];
var CELULA_SINTESE_GERENTE     = 'C51';
var CELULA_FEEDBACK_IA_GERENTE = 'A51'; // Parte 2

var CELULA_NOME_GERENTE   = 'A1';
var CELULA_FUNCAO_GERENTE = 'B2';
var CELULA_CICLO_GERENTE  = 'B3';
var CELULA_COORD_GERENTE  = 'B4';