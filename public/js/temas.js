/*
 * TEMAS SUGERIDOS
 * ---------------
 * Botones de "¿No sabe por dónde empezar? Pulse un tema". Cinco grupos numerados.
 * Cada tema busca CUALQUIERA de sus términos (en español e inglés), no la frase exacta.
 *   - Un término busca el comienzo de una palabra: "andamio" encuentra "andamios".
 *   - Si termina en espacio, debe ser la palabra exacta: "ia " no encuentra "ingeniería",
 *     "BIM " no encuentra "bimestre".
 *   - Las siglas se escriben en MAYÚSCULAS (BIM, AWP, VDC): así el buscador de noticias
 *     (GDELT) sabe que son siglas y las acepta aunque tengan solo 3 letras.
 *   - Los primeros términos de cada lista son los que se usan en el buscador de noticias
 *     en internet (GDELT), así que conviene poner primero los más representativos.
 *   - En la etiqueta, lo que va entre paréntesis se muestra con letra normal (no negrita).
 *
 * El grupo 4 «Ciclo de Vida y Fases del Proyecto» se muestra en el orden de las etapas:
 * Ingeniería → Procura → Construcción → Puesta en marcha → Operación.
 *
 * Para cambiar un tema, edite su "etiqueta" (lo que se ve) o su lista de "terminos".
 * Se usa en el navegador (window.Temas) y en Node.js (require).
 */
(function (raiz) {
  'use strict';

  var grupos = [
    {
      id: 'planificacion',
      numero: 1,
      titulo: 'Planificación',
      siglas: 'AWP (Empaquetamiento Avanzado del Trabajo) · LPS (Sistema del Último Planificador) · PPM (Gestión de la Producción de Proyectos)',
      temas: [
        { id: 'awp', etiqueta: 'AWP (Advanced Work Packaging)', terminos: [
          'advanced work packaging', 'AWP ', 'work packaging', 'paquetes de trabajo', 'workface planning',
          'construction work package', 'installation work package', 'path of construction', 'CWP ', 'IWP ', 'EWP ',
          'planificación del frente de trabajo', 'Construction Industry Institute', 'construction work area',
          'áreas de construcción', 'paquete de trabajo de ingeniería', 'engineering work package'] },
        { id: 'last-planner', etiqueta: 'Last Planner System (LPS)', terminos: [
          'last planner', 'último planificador', 'lean construction', 'pull planning', 'weekly work plan',
          'percent plan complete', 'lookahead', 'plan semanal', 'LPS ', 'PPC ', 'plan maestro', 'master schedule',
          'phase scheduling', 'programación por fases', 'plan intermedio', 'porcentaje de plan cumplido',
          'análisis de restricciones', 'constraint analysis', 'planificación pull'] },
        { id: 'ppm', etiqueta: 'PPM (Project Production Management)', terminos: [
          'project production management', 'gestión de la producción de proyectos', 'Project Production Institute',
          'operations science', 'production system', 'sistema de producción', 'factory physics', 'production flow',
          'PPM ', 'flujo de producción', 'work in process', 'trabajo en proceso', 'variabilidad', 'variability',
          'throughput', 'tiempo de ciclo', 'cycle time', 'amortiguadores de producción'] },
        { id: 'constructabilidad', etiqueta: 'Constructabilidad e Ingeniería de Valor', terminos: [
          'constructabilidad', 'constructability', 'ingeniería de valor', 'value engineering', 'buildability',
          'constructibilidad', 'análisis de valor', 'value analysis', 'revisión de constructabilidad',
          'constructability review', 'optimización del diseño', 'design optimization', 'reducción de costos',
          'cost reduction', 'alternativas de diseño', 'design alternatives'] },
        { id: 'lineas-balance', etiqueta: 'Programación Rítmica y Líneas de Balance', terminos: [
          'línea de balance', 'líneas de balance', 'line of balance', 'programación rítmica', 'takt time',
          'takt planning', 'location-based scheduling', 'rhythmic scheduling', 'LOB ', 'planificación takt',
          'programación por ubicación', 'tren de actividades', 'trenes de trabajo', 'flowline',
          'repetitive scheduling', 'proyectos repetitivos', 'repetitive projects', 'ritmo de producción'] }
      ]
    },
    {
      id: 'metodos',
      numero: 2,
      titulo: 'Métodos Constructivos y Sistemas de Soporte',
      temas: [
        { id: 'metodos-constructivos', etiqueta: 'Métodos Constructivos', terminos: [
          'métodos constructivos', 'método constructivo', 'construction methods', 'construction method',
          'técnicas constructivas', 'construction techniques', 'construcción modular', 'modular construction',
          'prefabricado', 'prefabrication', 'precast', 'concreto prefabricado', 'post-tensado',
          'post-tensioning', 'movimiento de tierras', 'earthworks', 'tilt-up'] },
        { id: 'encofrados', etiqueta: 'Sistemas de Encofrados', terminos: [
          'encofrado', 'formwork', 'encofrados', 'falsework', 'encofrado deslizante', 'slipform',
          'encofrado trepante', 'climbing formwork', 'cimbra', 'encofrado de aluminio', 'aluminium formwork',
          'aluminum formwork', 'desencofrado', 'apuntalamiento', 'shoring', 'PERI ', 'Doka', 'ULMA '] },
        { id: 'andamios', etiqueta: 'Andamios', terminos: [
          'andamio', 'scaffolding', 'andamios', 'scaffold', 'andamio multidireccional', 'andamio colgante',
          'suspended scaffold', 'plataforma de trabajo', 'work platform', 'trabajos en altura',
          'working at height', 'Norma G.050', 'protección contra caídas', 'fall protection',
          'plataformas elevadoras', 'aerial work platform'] },
        { id: 'procesos-constructivos', etiqueta: 'Procesos Constructivos', terminos: [
          'procesos constructivos', 'proceso constructivo', 'construction process', 'secuencia constructiva',
          'construction sequence', 'procedimiento constructivo', 'method statement', 'procedimiento de trabajo',
          'work procedure', 'productividad en obra', 'construction productivity', 'mejora de procesos',
          'process improvement', 'estandarización', 'standardization', 'control de calidad', 'quality control'] }
      ]
    },
    {
      id: 'tecnologias',
      numero: 3,
      titulo: 'Tecnologías y Metodologías Integradas',
      siglas: 'VDC (Diseño y Construcción Virtual) · BIM (Modelado de Información de la Construcción) · IA (Inteligencia Artificial)',
      temas: [
        { id: 'vdc', etiqueta: 'VDC (Virtual Design and Construction)', terminos: [
          'virtual design and construction', 'VDC ', 'diseño y construcción virtual', 'integrated concurrent engineering',
          'ingeniería concurrente', 'integrated project delivery', 'entrega integrada de proyectos',
          'construction simulation', 'Stanford CIFE', 'IPD ', 'modelo 4D', 'simulación de construcción',
          'big room', 'métricas de producción', 'production metrics'] },
        { id: 'bim', etiqueta: 'BIM', terminos: [
          'BIM ', 'building information modeling', 'building information modelling', 'modelado de información',
          'ISO 19650', 'Plan BIM Perú', 'clash detection', 'openBIM', 'IFC ', 'Revit', 'Navisworks',
          'detección de interferencias', 'modelo federado', 'federated model', 'nivel de desarrollo',
          'level of development', 'coordinación BIM', 'BIM coordination'] },
        { id: 'gestion-informacion', etiqueta: 'Gestión de la Información para la construcción', terminos: [
          'gestión de la información', 'information management', 'entorno de datos común', 'common data environment',
          'ISO 19650', 'gestión documental', 'document management', 'document control', 'CDE ',
          'control documentario', 'datos de construcción', 'construction data', 'interoperabilidad',
          'interoperability', 'COBie', 'trazabilidad', 'traceability', 'Aconex', 'Procore'] },
        { id: 'ia-automatizacion', etiqueta: 'IA y Automatización de Procesos', terminos: [
          'inteligencia artificial', 'artificial intelligence', 'automatización', 'automation',
          'machine learning', 'construction robotics', 'computer vision', 'robótica', 'ia ',
          'automatización de procesos', 'process automation', 'RPA ', 'visión artificial',
          'analítica predictiva', 'predictive analytics', 'internet de las cosas', 'IoT ', 'sensores'] },
        { id: 'industrializacion', etiqueta: 'Construcción e Industrialización Digital', terminos: [
          'industrialized construction', 'construcción industrializada', 'industrialización de la construcción',
          'construcción digital', 'digital construction', 'offsite construction', 'modular construction',
          'construcción modular', 'DfMA', 'design for manufacture and assembly', 'prefabricación',
          'prefabrication', 'construcción fuera de sitio', 'gemelo digital', 'digital twin', 'impresión 3D',
          '3D printing', 'contech', 'construction technology', 'Construcción 4.0', 'Construction 4.0'] }
      ]
    },
    {
      id: 'ciclo',
      numero: 4,
      titulo: 'Ciclo de Vida y Fases del Proyecto',
      nota: 'Las etapas de un proyecto, de la idea a la operación.',
      siglas: 'FEED (ingeniería básica extendida, antes de construir) · O&M (Operación y Mantenimiento) · IPC o EPC (Ingeniería, Procura y Construcción)',
      temas: [
        { id: 'ingenieria', etiqueta: 'Ingeniería y Diseño (FEED)', terminos: [
          'ingeniería de detalle', 'detailed engineering', 'ingeniería básica', 'basic engineering', 'FEED ',
          'front-end engineering design', 'ingeniería conceptual', 'conceptual engineering',
          'estudio de factibilidad', 'feasibility study', 'expediente técnico', 'diseño estructural',
          'structural design', 'ingeniería de valor', 'value engineering', 'estudio de preinversión'] },
        { id: 'procura', etiqueta: 'Procura y Contratos', terminos: [
          'procura', 'procurement', 'contrato EPC', 'EPC contract', 'licitación', 'tender ', 'bidding',
          'adquisiciones', 'cadena de suministro', 'supply chain', 'contrataciones públicas',
          'public procurement', 'OECE ', 'Ley 32069', 'FIDIC', 'NEC4', 'expediting',
          'inspección en fábrica', 'arbitraje de construcción', 'construction arbitration', 'reclamos', 'claims'] },
        { id: 'construccion', etiqueta: 'Construcción y Montaje', terminos: [
          'ejecución de obra', 'montaje electromecánico', 'construction project', 'montaje de estructuras',
          'steel erection', 'mechanical erection', 'construction management', 'gestión de obra', 'montaje',
          'supervisión de obra', 'control de calidad', 'quality control', 'control de costos', 'cost control',
          'valor ganado', 'earned value', 'sobrecostos', 'cost overrun', 'productividad',
          'construction productivity'] },
        { id: 'puesta-marcha', etiqueta: 'Puesta en Marcha (Commissioning)', terminos: [
          'puesta en marcha', 'commissioning', 'comisionamiento', 'precomisionamiento', 'pre-commissioning',
          'arranque', 'start-up', 'completamiento mecánico', 'mechanical completion', 'pruebas de desempeño',
          'performance test', 'entrega de sistemas', 'handover', 'turnover', 'pruebas FAT', 'pruebas SAT',
          'recepción de obra', 'liquidación de obra'] },
        { id: 'operacion', etiqueta: 'Operación y Mantenimiento (O&M)', terminos: [
          'operación y mantenimiento', 'operation and maintenance', 'O&M ', 'mantenimiento predictivo',
          'predictive maintenance', 'confiabilidad', 'reliability', 'RCM ', 'gestión de activos',
          'asset management', 'ISO 55000', 'disponibilidad', 'availability', 'facility management',
          'parada de planta', 'shutdown', 'turnaround', 'vida útil', 'life cycle cost'] }
      ]
    },
    {
      id: 'marcos',
      numero: 5,
      titulo: 'Marcos de Gestión de Proyectos y Gobernanza',
      siglas: 'PMI (Project Management Institute) · PRINCE2 (Proyectos en Entornos Controlados) · IPMA (Asociación Internacional de Dirección de Proyectos) · ICB4 (Línea Base de Competencias, 4.ª versión)',
      temas: [
        { id: 'pmbok', etiqueta: 'PMBOK y Estándares del PMI', terminos: [
          'PMBOK', 'Project Management Institute', 'guía del PMBOK', 'standard for project management',
          'Project Management Professional', 'dirección de proyectos', 'gestión de proyectos', 'project management',
          'PMI ', 'PMP ', 'estándar para la dirección de proyectos', 'gestión de portafolios',
          'portfolio management', 'gestión de programas', 'program management',
          'extensión para la construcción', 'construction extension', 'metodologías ágiles', 'agile project management'] },
        { id: 'prince2', etiqueta: 'PRINCE2 (Gobernanza y Control)', terminos: [
          'PRINCE2', 'PeopleCert', 'AXELOS', 'gobernanza de proyectos', 'project governance', 'project board',
          'business case', 'management by exception', 'junta del proyecto', 'caso de negocio',
          'gestión por excepción', 'gestión por fases', 'management by stages', 'control de proyectos',
          'project control', 'tolerancias', 'tolerances'] },
        { id: 'ipma', etiqueta: 'IPMA (Modelo de Competencias ICB4)', terminos: [
          'IPMA', 'International Project Management Association', 'ICB4', 'Individual Competence Baseline',
          'project management competence', 'competencias en dirección de proyectos', 'AEIPRO', 'IPMA Perú',
          'ICB 4', 'línea base de competencias', 'competencias del director de proyecto',
          'project manager competences', 'certificación IPMA', 'IPMA certification', 'liderazgo de proyectos',
          'project leadership', 'competencias individuales', 'individual competences'] }
      ]
    }
  ];

  /*
   * Relación INDIRECTA: palabras que no nombran el tema pero indican que un resultado
   * trata de él (por ejemplo, una obra que «entra en operación» se relaciona con la
   * puesta en marcha). Solo sirven para decidir si un resultado se muestra; no se envían
   * al buscador de noticias. Mismas reglas: comienzo de palabra; espacio final = palabra exacta.
   */
  var RELACIONADOS = {
    'awp': ['planificación de obra', 'construction planning', 'workface', 'frente de trabajo'],
    'last-planner': ['lean ', 'planificación semanal', 'compromisos de obra'],
    'ppm': ['producción en obra', 'production control', 'control de producción', 'lean production'],
    'constructabilidad': ['diseño para la construcción', 'design for construction', 'revisión del diseño'],
    'lineas-balance': ['programación de obra', 'construction scheduling', 'cronograma de obra', 'scheduling'],
    'metodos-constructivos': ['concreto', 'hormigón', 'concrete', 'estructura metálica', 'steel structure',
      'cimentación', 'foundation', 'pilotes', 'tunnel boring', 'TBM '],
    'encofrados': ['vaciado de concreto', 'losa ', 'losas ', 'slab '],
    'andamios': ['seguridad en obra', 'construction safety', 'accidente en obra', 'caída de altura'],
    'procesos-constructivos': ['proceso de construcción', 'building process', 'mano de obra', 'workforce'],
    'vdc': ['modelo digital', 'digital model', 'coordinación digital', 'realidad virtual', 'virtual reality'],
    'bim': ['modelado 3D', '3D model', 'modelo 3D'],
    'gestion-informacion': ['software de construcción', 'construction software', 'plataforma digital', 'digital platform'],
    'ia-automatizacion': ['robot', 'dron', 'drone', 'algoritmo', 'algorithm', 'deep learning'],
    'industrializacion': ['modular', 'prefabric', 'industrializ', 'transformación digital', 'digital transformation',
      'tecnología de construcción'],
    'ingenieria': ['ingeniería', 'engineering', 'estudio definitivo', 'estudios de ingeniería', 'diseño de la obra'],
    'procura': ['contrato', 'contract', 'adjudica', 'awarded', 'award ', 'concesión', 'concession', 'licita',
      'compras públicas', 'proveedor', 'supplier'],
    'construccion': ['obra ', 'obras ', 'construcción', 'construction', 'constructora', 'contratista', 'contractor',
      'infraestructura', 'infrastructure', 'megaproyecto', 'megaproject', 'proyecto de inversión'],
    'puesta-marcha': ['inaugura', 'entra en operación', 'entrará en operación', 'comienza a operar',
      'begins operation', 'entrega de obra', 'entrega de la obra'],
    'operacion': ['mantenimiento', 'maintenance', 'operación comercial', 'commercial operation', 'operación de la planta'],
    'pmbok': ['director de proyecto', 'directora de proyecto', 'project manager', 'gerencia de proyectos',
      'gerente de proyecto'],
    'prince2': ['gobernanza', 'governance', 'oficina de proyectos', 'PMO '],
    'ipma': ['competencias profesionales', 'professional competence', 'certificación profesional']
  };

  /*
   * Consulta académica de cada tema (en inglés, el idioma de casi todas las revistas).
   * La usan Crossref y Open Library para traer los papers y libros recientes de cada tema.
   */
  var ACADEMICA = {
    'awp': 'advanced work packaging construction',
    'last-planner': 'last planner system construction',
    'ppm': 'project production management construction',
    'constructabilidad': 'constructability value engineering construction',
    'lineas-balance': 'line of balance takt planning construction',
    'metodos-constructivos': 'construction methods',
    'encofrados': 'formwork construction',
    'andamios': 'scaffolding construction safety',
    'procesos-constructivos': 'construction process productivity',
    'vdc': 'virtual design and construction',
    'bim': 'building information modeling',
    'gestion-informacion': 'construction information management common data environment',
    'ia-automatizacion': 'artificial intelligence construction automation',
    'industrializacion': 'industrialized construction modular prefabrication',
    'ingenieria': 'front-end engineering design construction projects',
    'procura': 'construction procurement contracts',
    'construccion': 'construction project management site',
    'puesta-marcha': 'commissioning construction projects',
    'operacion': 'operation and maintenance asset management facilities',
    'pmbok': 'PMBOK project management standard',
    'prince2': 'PRINCE2 project governance',
    'ipma': 'IPMA individual competence baseline project management'
  };

  /*
   * Consultas de noticias de cada tema (Google Noticias): `es` para el Perú (se le añade
   * «Perú») y `en` para el mundo. Frases entre comillas unidas con OR.
   */
  var NOTICIAS = {
    'awp': { es: '"advanced work packaging" OR "paquetes de trabajo" OR AWP', en: '"advanced work packaging" OR "workface planning"' },
    'last-planner': { es: '"last planner" OR "último planificador" OR "lean construction"', en: '"last planner" OR "lean construction" OR "pull planning"' },
    'ppm': { es: '"project production management" OR "gestión de la producción" obra', en: '"project production management" OR "Project Production Institute"' },
    'constructabilidad': { es: 'constructabilidad OR "ingeniería de valor"', en: 'constructability OR "value engineering" construction' },
    'lineas-balance': { es: '"línea de balance" OR "takt" OR "programación de obra"', en: '"line of balance" OR "takt planning" OR "location-based scheduling"' },
    'metodos-constructivos': { es: '"método constructivo" OR "construcción modular" OR prefabricado', en: '"construction methods" OR "modular construction" OR precast' },
    'encofrados': { es: 'encofrado OR encofrados', en: 'formwork OR falsework OR shoring construction' },
    'andamios': { es: 'andamios OR "trabajos en altura" obra', en: 'scaffolding OR "working at height" construction' },
    'procesos-constructivos': { es: '"proceso constructivo" OR "procesos constructivos" OR "productividad en obra"', en: '"construction process" OR "construction productivity"' },
    'vdc': { es: '"virtual design and construction" OR VDC construcción', en: '"virtual design and construction" OR "integrated project delivery"' },
    'bim': { es: 'BIM OR "modelado de información"', en: '"building information modeling" OR BIM construction' },
    'gestion-informacion': { es: '"entorno de datos común" OR "gestión de la información" construcción', en: '"common data environment" OR "construction data" OR "ISO 19650"' },
    'ia-automatizacion': { es: '"inteligencia artificial" construcción OR obra', en: '"artificial intelligence" construction OR "construction robotics"' },
    'industrializacion': { es: '"construcción industrializada" OR "construcción modular" OR "construcción digital"', en: '"industrialized construction" OR "offsite construction" OR "construction technology"' },
    'ingenieria': { es: '"ingeniería de detalle" OR "expediente técnico" OR "estudio de factibilidad"', en: '"front-end engineering design" OR FEED contract OR "detailed engineering"' },
    'procura': { es: 'licitación obra OR "contratación pública" OR "contrato EPC"', en: '"EPC contract" OR "construction procurement" OR "tender" construction' },
    'construccion': { es: '"ejecución de obra" OR "montaje electromecánico" OR "construcción de"', en: '"construction project" OR "construction management" OR "steel erection"' },
    'puesta-marcha': { es: '"puesta en marcha" OR comisionamiento OR "entra en operación"', en: 'commissioning plant OR "mechanical completion" OR "begins operation"' },
    'operacion': { es: '"operación y mantenimiento" OR "mantenimiento predictivo" OR "gestión de activos"', en: '"operation and maintenance" OR "predictive maintenance" OR "asset management" infrastructure' },
    'pmbok': { es: 'PMBOK OR "Project Management Institute" OR "dirección de proyectos"', en: 'PMBOK OR "Project Management Institute"' },
    'prince2': { es: 'PRINCE2 OR "gobernanza de proyectos"', en: 'PRINCE2 OR "project governance"' },
    'ipma': { es: 'IPMA OR "competencias en dirección de proyectos"', en: 'IPMA OR "International Project Management Association"' }
  };

  /*
   * Consulta de OpenAlex (índice académico mundial) para cada tema: frases exactas unidas con
   * OR, en inglés y español, que se buscan en el título y el resumen de los papers.
   */
  var OPENALEX = {
    'awp': '"advanced work packaging" OR "workface planning" OR "work packaging"',
    'last-planner': '"last planner" OR "pull planning" OR "último planificador"',
    'ppm': '"project production management" OR "production system design" OR "operations science" construction',
    'constructabilidad': 'constructability OR buildability OR "value engineering" OR constructabilidad OR "ingeniería de valor"',
    'lineas-balance': '"line of balance" OR "takt planning" OR "takt time" OR "location-based scheduling" OR "línea de balance"',
    'metodos-constructivos': '"construction method" OR "construction methods" OR "construction technique" OR "método constructivo"',
    'encofrados': 'formwork OR falsework OR encofrado',
    'andamios': 'scaffold OR scaffolding OR andamio OR andamios',
    'procesos-constructivos': '"construction process" OR "construction productivity" OR "proceso constructivo"',
    'vdc': '"virtual design and construction" OR "integrated concurrent engineering" OR "integrated project delivery"',
    'bim': '"building information modeling" OR "building information modelling" OR "modelado de información"',
    'gestion-informacion': '"common data environment" OR "construction information management" OR "ISO 19650"',
    'ia-automatizacion': '"construction automation" OR "construction robotics" OR "artificial intelligence in construction" OR "machine learning in construction"',
    'industrializacion': '"industrialized construction" OR "offsite construction" OR "modular construction" OR "prefabricated construction" OR "construction 4.0"',
    'ingenieria': '"front-end engineering" OR "front end loading" OR "front-end planning" OR "detailed engineering design"',
    'procura': '"construction procurement" OR "EPC contract" OR "EPC project" OR "contratación pública" obras',
    'construccion': '"construction project management" OR "construction site management" OR "gestión de obras"',
    'puesta-marcha': '"building commissioning" OR "plant commissioning" OR "project commissioning" OR "mechanical completion"',
    'operacion': '"operation and maintenance" OR "predictive maintenance" OR "facility management" OR "infrastructure asset management"',
    'pmbok': 'PMBOK OR "Project Management Body of Knowledge" OR "Project Management Institute"',
    'prince2': 'PRINCE2 OR "project governance"',
    'ipma': 'IPMA OR "Individual Competence Baseline" OR "project management competence"'
  };

  // Cada tema recuerda a qué grupo pertenece, sus palabras de relación indirecta y sus consultas.
  grupos.forEach(function (g) {
    g.temas.forEach(function (t) {
      t.grupo = g.id;
      t.relacionados = RELACIONADOS[t.id] || [];
      t.academica = ACADEMICA[t.id] || t.etiqueta;
      t.noticias = NOTICIAS[t.id] || { es: t.etiqueta, en: t.academica };
      t.openalex = OPENALEX[t.id] || t.academica;
    });
  });

  /** Busca un tema por su id. */
  function porId(id) {
    for (var g = 0; g < grupos.length; g++) {
      for (var t = 0; t < grupos[g].temas.length; t++) {
        if (grupos[g].temas[t].id === id) return grupos[g].temas[t];
      }
    }
    return null;
  }

  var Temas = { grupos: grupos, porId: porId };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Temas;
  } else {
    raiz.Temas = Temas;
  }
})(typeof window !== 'undefined' ? window : globalThis);
