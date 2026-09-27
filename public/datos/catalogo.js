/*
 * CATÁLOGO LOCAL DE CONSTRUCCIÓN GLOBAL
 * -------------------------------------
 * Esta es la "base de datos" de consulta. Funciona sin internet y sin servidor.
 *
 * Cada elemento tiene esta forma:
 *   id            Identificador único (texto sin espacios).
 *   tipo          "noticia" | "paper" | "libro" | "norma" (normas, leyes y guías oficiales).
 *   titulo        Título que verá la persona.
 *   resumen       2 o 3 líneas en lenguaje sencillo (las siglas se explican).
 *   autor         Autor o institución.
 *   fuente        Editorial, revista, entidad o medio.
 *   fecha         "AAAA-MM-DD", "AAAA-MM" o "AAAA" (años antes de Cristo con signo menos: "-0015").
 *   enlace        Página original (se abre en una pestaña nueva).
 *   descarga      null, o { url, formato, nombreArchivo } si el documento es de acceso libre.
 *   etiquetas     Palabras clave (en español e inglés) que ayudan a encontrarlo.
 *   destacado     true si debe aparecer en la portada de su sección.
 *   ejemplo       true si es contenido de DEMOSTRACIÓN (no es una noticia real).
 *   vigente       (solo normas) true si la norma está en vigor. Solo se muestran las normas vigentes.
 *
 * Los libros y papers clásicos de este catálogo NO se muestran en las ventanas (solo se muestra lo
 * publicado en los últimos 12 meses); se conservan como referencia y para las pruebas.
 *
 * Todos los enlaces se comprobaron durante el desarrollo (herramientas/comprobar-fuentes.js).
 * Para agregar un documento nuevo, copie un bloque { ... }, cambie los datos y guarde.
 *
 * El archivo funciona tanto en el navegador (window.CATALOGO_CONSTRUCCION)
 * como en el servidor Node.js (require).
 */
(function (raiz) {
  'use strict';

  var CATALOGO = [
    /* ============================== LIBROS ============================== */
    {
      id: 'libro-pmbok-7',
      tipo: 'libro',
      titulo: 'Guía de los Fundamentos para la Dirección de Proyectos (Guía del PMBOK), 7.ª edición',
      resumen: 'La guía de referencia mundial para dirigir proyectos. Explica los principios y las áreas de trabajo de un director de proyecto: alcance, plazos, costos, riesgos, calidad y comunicación con los interesados.',
      autor: 'Project Management Institute (PMI)',
      fuente: 'Project Management Institute',
      tipoFuente: 'Editorial',
      fecha: '2021',
      enlace: 'https://openlibrary.org/search?q=PMBOK+Guide+Project+Management+Institute',
      descarga: null,
      etiquetas: ['pmbok', 'gestion de proyectos', 'project management', 'direccion de proyectos', 'pmi', 'riesgos', 'cronograma', 'alcance', 'estandar'],
      destacado: true
    },
    {
      id: 'libro-peurifoy-metodos',
      tipo: 'libro',
      titulo: 'Construction Planning, Equipment, and Methods',
      resumen: 'Manual clásico sobre cómo planificar una obra y elegir la maquinaria: movimiento de tierras, grúas, concreto y costos de los equipos. Muy usado en las universidades de ingeniería civil.',
      autor: 'Robert L. Peurifoy, Clifford J. Schexnayder y otros',
      fuente: 'McGraw-Hill',
      tipoFuente: 'Editorial',
      fecha: '2018',
      enlace: 'https://openlibrary.org/search?q=Construction+Planning+Equipment+and+Methods+Peurifoy',
      descarga: null,
      etiquetas: ['equipos', 'maquinaria', 'metodos constructivos', 'movimiento de tierras', 'planificacion de obra', 'construction equipment', 'earthmoving', 'productividad'],
      destacado: true
    },
    {
      id: 'libro-halpin-construction-management',
      tipo: 'libro',
      titulo: 'Construction Management (4.ª edición)',
      resumen: 'Explica cómo se organiza y controla una obra de principio a fin: contratos, licitación, cronograma, control de costos, seguridad y calidad. Un texto básico para quien dirige proyectos de construcción.',
      autor: 'Daniel W. Halpin y Bolivar A. Senior',
      fuente: 'Wiley',
      tipoFuente: 'Editorial',
      fecha: '2010',
      enlace: 'https://openlibrary.org/search?q=Construction+Management+Halpin+Senior',
      descarga: null,
      etiquetas: ['gestion de obra', 'construction management', 'contratos', 'licitacion', 'cronograma', 'control de costos', 'calidad', 'seguridad'],
      destacado: true
    },
    {
      id: 'libro-bim-handbook',
      tipo: 'libro',
      titulo: 'BIM Handbook (3.ª edición)',
      resumen: 'La obra de referencia sobre BIM (Modelado de Información de la Construcción): cómo un modelo digital compartido ayuda a diseñar, construir y operar mejor los edificios. Incluye casos reales.',
      autor: 'Rafael Sacks, Charles Eastman, Ghang Lee y Paul Teicholz',
      fuente: 'Wiley',
      tipoFuente: 'Editorial',
      fecha: '2018',
      enlace: 'https://openlibrary.org/search?q=BIM+Handbook+Sacks+Eastman',
      descarga: null,
      etiquetas: ['bim', 'building information modeling', 'modelado de informacion', 'construccion digital', 'digital construction', 'gemelo digital', 'diseño', 'ifc', 'green building', 'eficiencia energetica'],
      destacado: true
    },
    {
      id: 'libro-merrow-megaprojects',
      tipo: 'libro',
      titulo: 'Industrial Megaprojects: Concepts, Strategies, and Practices for Success',
      resumen: 'Estudia cientos de grandes proyectos industriales (minería, petróleo, química) y explica por qué muchos fracasan. Destaca la importancia de una buena ingeniería inicial (FEED) antes de construir.',
      autor: 'Edward W. Merrow',
      fuente: 'Wiley',
      tipoFuente: 'Editorial',
      fecha: '2011',
      enlace: 'https://openlibrary.org/search?q=Industrial+Megaprojects+Merrow',
      descarga: null,
      etiquetas: ['megaproyectos', 'megaprojects', 'proyectos industriales', 'mineria', 'petroleo', 'feed', 'ingenieria basica', 'sobrecostos', 'cost overrun', 'arranque', 'start-up', 'puesta en marcha'],
      destacado: true
    },
    {
      id: 'libro-flyvbjerg-megaprojects-risk',
      tipo: 'libro',
      titulo: 'Megaprojects and Risk: An Anatomy of Ambition',
      resumen: 'Analiza grandes obras de transporte, como túneles y puentes, y muestra que sus costos casi siempre se subestiman. Propone más transparencia y mejores reglas para decidir y controlar los megaproyectos.',
      autor: 'Bent Flyvbjerg, Nils Bruzelius y Werner Rothengatter',
      fuente: 'Cambridge University Press',
      tipoFuente: 'Editorial',
      fecha: '2003',
      enlace: 'https://openlibrary.org/search?q=Megaprojects+and+Risk+Flyvbjerg',
      descarga: null,
      etiquetas: ['megaproyectos', 'megaprojects', 'riesgo', 'risk', 'sobrecostos', 'transporte', 'tunel', 'puente', 'infraestructura'],
      destacado: false
    },
    {
      id: 'libro-flyvbjerg-big-things',
      tipo: 'libro',
      titulo: 'How Big Things Get Done',
      resumen: 'Libro de divulgación sobre por qué los grandes proyectos se retrasan y cuestan más de lo previsto, y qué hacen distinto los que salen bien: planificar despacio y ejecutar rápido.',
      autor: 'Bent Flyvbjerg y Dan Gardner',
      fuente: 'Currency',
      tipoFuente: 'Editorial',
      fecha: '2023',
      enlace: 'https://openlibrary.org/search?q=How+Big+Things+Get+Done+Flyvbjerg',
      descarga: null,
      etiquetas: ['megaproyectos', 'planificacion', 'gestion de proyectos', 'project management', 'sobrecostos', 'riesgo', 'energia renovable', 'net zero'],
      destacado: true
    },
    {
      id: 'libro-liker-toyota-way',
      tipo: 'libro',
      titulo: 'The Toyota Way: 14 Management Principles from the World\'s Greatest Manufacturer',
      resumen: 'Explica la filosofía de producción de Toyota: eliminar desperdicios y mejorar cada día. Estas ideas son la base del Lean Construction, que aplica el mismo enfoque a las obras.',
      autor: 'Jeffrey K. Liker',
      fuente: 'McGraw-Hill',
      tipoFuente: 'Editorial',
      fecha: '2004',
      enlace: 'https://openlibrary.org/search?q=The+Toyota+Way+Liker',
      descarga: null,
      etiquetas: ['lean', 'lean construction', 'toyota', 'productividad', 'mejora continua', 'desperdicios'],
      destacado: false
    },
    {
      id: 'libro-moubray-rcm',
      tipo: 'libro',
      titulo: 'Reliability-Centered Maintenance (2.ª edición)',
      resumen: 'La obra clásica sobre el Mantenimiento Centrado en la Confiabilidad (RCM): cómo decidir qué mantenimiento necesita cada equipo para que una planta funcione de forma segura y sin paradas.',
      autor: 'John Moubray',
      fuente: 'Industrial Press',
      tipoFuente: 'Editorial',
      fecha: '1997',
      enlace: 'https://openlibrary.org/search?q=Reliability-Centered+Maintenance+Moubray',
      descarga: null,
      etiquetas: ['mantenimiento', 'maintenance', 'rcm', 'confiabilidad', 'reliability', 'operacion y mantenimiento', 'gestion de activos', 'planta'],
      destacado: true
    },
    {
      id: 'libro-kerzner-project-management',
      tipo: 'libro',
      titulo: 'Project Management: A Systems Approach to Planning, Scheduling, and Controlling (13.ª edición)',
      resumen: 'Uno de los manuales más usados para aprender a planificar, programar y controlar proyectos. Trata el valor ganado, los riesgos, los contratos y la organización del equipo.',
      autor: 'Harold Kerzner',
      fuente: 'Wiley',
      tipoFuente: 'Editorial',
      fecha: '2022',
      enlace: 'https://openlibrary.org/search?q=Kerzner+Project+Management+A+Systems+Approach',
      descarga: null,
      etiquetas: ['gestion de proyectos', 'project management', 'cronograma', 'schedule', 'valor ganado', 'earned value', 'control de costos', 'riesgos'],
      destacado: false
    },
    {
      id: 'libro-fidic-red-book',
      tipo: 'libro',
      titulo: 'FIDIC Conditions of Contract for Construction («Red Book», 2.ª edición)',
      resumen: 'El modelo de contrato de construcción más usado en el mundo, publicado por la Federación Internacional de Ingenieros Consultores (FIDIC). Regula obligaciones, plazos, pagos, reclamos y solución de controversias.',
      autor: 'FIDIC',
      fuente: 'FIDIC',
      tipoFuente: 'Editorial',
      fecha: '2017',
      enlace: 'https://fidic.org/books/construction-contract-2nd-ed-2017-red-book',
      descarga: null,
      etiquetas: ['fidic', 'contrato', 'contract', 'red book', 'libro rojo', 'reclamos', 'claims', 'arbitraje', 'procura', 'contratos de construccion', 'recepcion de obra', 'handover', 'pruebas de desempeño'],
      destacado: true
    },
    {
      id: 'libro-vitruvio-arquitectura',
      tipo: 'libro',
      titulo: 'Los diez libros de arquitectura (The Ten Books on Architecture)',
      resumen: 'El tratado de construcción más antiguo que se conserva. El arquitecto romano Vitruvio explica materiales, técnicas, máquinas y obras públicas. Traducción al inglés de Morgan (1914), de dominio público.',
      autor: 'Vitruvio (traducción de Morris Hicky Morgan)',
      fuente: 'Proyecto Gutenberg',
      tipoFuente: 'Biblioteca digital de dominio público',
      idioma: 'en',
      fecha: '-0015',
      enlace: 'https://www.gutenberg.org/ebooks/20239',
      descarga: { url: 'https://www.gutenberg.org/ebooks/20239.txt.utf-8', formato: 'Texto', nombreArchivo: 'Vitruvio-Diez-libros-de-arquitectura.txt' },
      etiquetas: ['arquitectura', 'architecture', 'historia', 'materiales', 'roma', 'obras publicas', 'clasico'],
      destacado: false
    },
    {
      id: 'libro-taylor-scientific-management',
      tipo: 'libro',
      titulo: 'The Principles of Scientific Management',
      resumen: 'El libro que inició la gestión moderna del trabajo: medir las tareas para hacerlas más productivas. Sus ideas influyeron en la planificación de obras y en la productividad de la construcción. De dominio público.',
      autor: 'Frederick W. Taylor',
      fuente: 'Proyecto Gutenberg',
      tipoFuente: 'Biblioteca digital de dominio público',
      idioma: 'en',
      fecha: '1911',
      enlace: 'https://www.gutenberg.org/ebooks/6435',
      descarga: { url: 'https://www.gutenberg.org/ebooks/6435.txt.utf-8', formato: 'Texto', nombreArchivo: 'Taylor-Principles-of-Scientific-Management.txt' },
      etiquetas: ['productividad', 'productivity', 'gestion', 'management', 'historia', 'clasico', 'organizacion del trabajo'],
      destacado: false
    },

    /* ============================== PAPERS ============================== */
    {
      id: 'paper-koskela-1992',
      tipo: 'paper',
      titulo: 'Application of the New Production Philosophy to Construction',
      resumen: 'Informe técnico que dio origen al Lean Construction: propone ver la obra como un flujo de producción y eliminar las esperas y los desperdicios, como en la industria.',
      autor: 'Lauri Koskela',
      fuente: 'CIFE, Stanford University (Technical Report 72)',
      tipoFuente: 'Informe técnico universitario',
      idioma: 'en',
      fecha: '1992',
      enlace: 'https://purl.stanford.edu/kh328xt3298',
      descarga: { url: 'https://stacks.stanford.edu/file/druid:kh328xt3298/TR072.pdf', formato: 'PDF', nombreArchivo: 'Koskela-1992-New-Production-Philosophy.pdf' },
      etiquetas: ['lean construction', 'lean', 'produccion', 'productividad', 'flujo', 'desperdicios'],
      destacado: true
    },
    {
      id: 'paper-ballard-2000',
      tipo: 'paper',
      titulo: 'The Last Planner System of Production Control',
      resumen: 'Tesis doctoral que presenta el sistema del Último Planificador (Last Planner): quienes hacen el trabajo planifican cada semana lo que realmente se puede hacer, y así se cumplen más los compromisos.',
      autor: 'Herman Glenn Ballard',
      fuente: 'University of Birmingham (tesis doctoral)',
      tipoFuente: 'Tesis doctoral',
      idioma: 'en',
      fecha: '2000',
      enlace: 'https://etheses.bham.ac.uk/4789/',
      descarga: { url: 'https://etheses.bham.ac.uk/4789/1/Ballard00PhD.pdf', formato: 'PDF', nombreArchivo: 'Ballard-2000-Last-Planner-System.pdf' },
      etiquetas: ['last planner', 'ultimo planificador', 'lean construction', 'planificacion', 'cronograma', 'control de produccion'],
      destacado: true
    },
    {
      id: 'paper-atkinson-1999',
      tipo: 'paper',
      titulo: 'Project management: cost, time and quality, two best guesses and a phenomenon, its time to accept other success criteria',
      resumen: 'Artículo muy citado que critica medir el éxito de un proyecto solo por costo, plazo y calidad (el «triángulo de hierro») y propone considerar también los beneficios para los usuarios y la organización.',
      autor: 'Roger Atkinson',
      fuente: 'International Journal of Project Management',
      tipoFuente: 'Revista académica',
      idioma: 'en',
      fecha: '1999-12',
      enlace: 'https://doi.org/10.1016/S0263-7863(98)00069-6',
      descarga: null,
      etiquetas: ['gestion de proyectos', 'project management', 'exito del proyecto', 'success criteria', 'costo', 'plazo', 'calidad'],
      destacado: false
    },
    {
      id: 'paper-flyvbjerg-2002',
      tipo: 'paper',
      titulo: 'Underestimating Costs in Public Works Projects: Error or Lie?',
      resumen: 'Estudio de 258 obras públicas de transporte en 20 países: nueve de cada diez costaron más de lo anunciado. Concluye que la subestimación de costos no es un simple error.',
      autor: 'Bent Flyvbjerg, Mette Skamris Holm y Søren Buhl',
      fuente: 'Journal of the American Planning Association',
      tipoFuente: 'Revista académica',
      idioma: 'en',
      fecha: '2002',
      // La revista (DOI 10.1080/01944360208976273) es de pago; se enlaza la versión del autor en arXiv.
      enlace: 'https://arxiv.org/abs/1303.6604',
      descarga: { url: 'https://arxiv.org/pdf/1303.6604', formato: 'PDF', nombreArchivo: 'Flyvbjerg-2002-Underestimating-Costs.pdf' },
      etiquetas: ['sobrecostos', 'cost overrun', 'obras publicas', 'public works', 'infraestructura', 'transporte', 'megaproyectos'],
      destacado: true
    },
    {
      id: 'paper-flyvbjerg-2014',
      tipo: 'paper',
      titulo: 'What You Should Know About Megaprojects and Why: An Overview',
      resumen: 'Resumen claro de lo que se sabe sobre los megaproyectos (obras de más de mil millones de dólares): por qué casi siempre se pasan de costo y plazo, y cómo mejorar su gestión.',
      autor: 'Bent Flyvbjerg',
      fuente: 'Project Management Journal',
      tipoFuente: 'Revista académica',
      idioma: 'en',
      fecha: '2014-04',
      // La revista (DOI 10.1002/pmj.21409) es de pago; se enlaza la versión del autor en arXiv.
      enlace: 'https://arxiv.org/abs/1409.0003',
      descarga: { url: 'https://arxiv.org/pdf/1409.0003', formato: 'PDF', nombreArchivo: 'Flyvbjerg-2014-Megaprojects-Overview.pdf' },
      etiquetas: ['megaproyectos', 'megaprojects', 'sobrecostos', 'gestion de proyectos', 'riesgo'],
      destacado: false
    },
    {
      id: 'paper-succar-2009',
      tipo: 'paper',
      titulo: 'Building information modelling framework: A research and delivery foundation for industry stakeholders',
      resumen: 'Propone un marco para entender el BIM (Modelado de Información de la Construcción) por etapas de madurez, y ayuda a las empresas a saber en qué nivel están y cómo avanzar.',
      autor: 'Bilal Succar',
      fuente: 'Automation in Construction',
      tipoFuente: 'Revista académica',
      idioma: 'en',
      fecha: '2009-05',
      enlace: 'https://doi.org/10.1016/j.autcon.2008.10.003',
      descarga: null,
      etiquetas: ['bim', 'building information modeling', 'madurez bim', 'construccion digital', 'marco conceptual'],
      destacado: false
    },
    {
      id: 'paper-williams-1999',
      tipo: 'paper',
      titulo: 'The need for new paradigms for complex projects',
      resumen: 'Explica por qué los proyectos complejos, con muchas partes que se influyen entre sí, no se pueden gestionar solo con las herramientas tradicionales, y pide nuevos enfoques.',
      autor: 'Terry M. Williams',
      fuente: 'International Journal of Project Management',
      tipoFuente: 'Revista académica',
      idioma: 'en',
      fecha: '1999-10',
      enlace: 'https://doi.org/10.1016/S0263-7863(98)00047-7',
      descarga: null,
      etiquetas: ['complejidad', 'proyectos complejos', 'complex projects', 'gestion de proyectos', 'project management'],
      destacado: false
    },

    /* ======================= NORMAS Y GUÍAS OFICIALES ======================= */
    {
      id: 'norma-ley-32069',
      tipo: 'norma',
      titulo: 'Ley N.º 32069, Ley General de Contrataciones Públicas',
      resumen: 'La ley peruana que regula cómo el Estado compra bienes y servicios y contrata obras. Creó el OECE (Organismo Especializado para las Contrataciones Públicas Eficientes), que reemplazó al OSCE.',
      autor: 'Congreso de la República del Perú',
      fuente: 'OECE y Congreso de la República (texto oficial)',
      tipoFuente: 'Norma legal',
      idioma: 'es',
      fecha: '2024-06-24',
      enlace: 'https://www.gob.pe/institucion/oece/colecciones/45029-ley-n-32069-ley-general-de-contrataciones-publicas-y-su-reglamento',
      descarga: { url: 'https://leyes.congreso.gob.pe/Documentos/2021_2026/ADLP/Texto_Consolidado/32069-TXM.pdf', formato: 'PDF', nombreArchivo: 'Ley-32069-Contrataciones-Publicas.pdf' },
      etiquetas: ['ley 32069', 'contrataciones publicas', 'public procurement', 'oece', 'osce', 'licitacion', 'contrato', 'peru', 'procura'],
      destacado: true,
      vigente: true
    },
    {
      id: 'norma-g050',
      tipo: 'norma',
      titulo: 'Norma G.050 «Seguridad durante la construcción» (Reglamento Nacional de Edificaciones)',
      resumen: 'Norma peruana obligatoria que fija las medidas mínimas de seguridad en toda obra: plan de seguridad y salud, equipos de protección, trabajos en altura, andamios y excavaciones.',
      autor: 'Ministerio de Vivienda, Construcción y Saneamiento',
      fuente: 'Ministerio de Vivienda, Construcción y Saneamiento del Perú',
      tipoFuente: 'Norma técnica',
      idioma: 'es',
      fecha: '2009-05-08',
      enlace: 'https://www.gob.pe/institucion/sencico/informes-publicaciones/887225-normas-del-reglamento-nacional-de-edificaciones-rne',
      descarga: { url: 'https://www.onpsctr.gob.pe/DocumentosComunes/G.050%20Seg.%20durante%20la%20Construcci%C3%B3n.pdf', formato: 'PDF', nombreArchivo: 'Norma-G050-Seguridad-durante-la-construccion.pdf' },
      etiquetas: ['g 050', 'g050', 'seguridad en obra', 'construction safety', 'seguridad y salud', 'ssoma', 'reglamento nacional de edificaciones', 'rne', 'peru', 'trabajos en altura'],
      destacado: true,
      vigente: true
    },
    {
      id: 'norma-guia-app-banco-mundial',
      tipo: 'norma',
      titulo: 'Guía de referencia de Asociaciones Público-Privadas (APP), versión 3',
      resumen: 'Guía del Banco Mundial y otros bancos de desarrollo que explica, paso a paso, cómo preparar, licitar y supervisar una APP (Asociación Público-Privada), en la que una empresa construye y opera una obra pública.',
      autor: 'Banco Mundial y otros organismos multilaterales',
      fuente: 'Banco Mundial — PPP Knowledge Lab',
      tipoFuente: 'Guía de organismo multilateral',
      idioma: 'en',
      fecha: '2017',
      enlace: 'https://ppp.worldbank.org/ppp-knowledge-lab',
      descarga: { url: 'https://ppp.worldbank.org/sites/default/files/2024-08/PPP%20Reference%20Guide%20Version%203.pdf', formato: 'PDF', nombreArchivo: 'Guia-APP-Banco-Mundial-v3.pdf' },
      etiquetas: ['app', 'ppp', 'asociacion publico privada', 'public private partnership', 'concesion', 'infraestructura', 'project finance', 'banco mundial'],
      destacado: true
    },

    /* ================ NOTICIAS DE EJEMPLO (solo si no hay noticias reales) ================ */
    {
      id: 'noticia-ejemplo-obras-por-impuestos',
      tipo: 'noticia',
      titulo: 'Obras por Impuestos: cuando una empresa construye una obra pública',
      resumen: 'Con este mecanismo peruano, una empresa financia y construye una obra (un colegio, una pista) y luego descuenta ese dinero de su impuesto a la renta. Gestión publica con frecuencia sus avances.',
      autor: 'Equipo Construcción Global',
      fuente: 'Gestión — Economía (portada)',
      tipoFuente: 'Diario de referencia nacional',
      ambito: 'nacional',
      fecha: '2026-09-20',
      enlace: 'https://gestion.pe/economia/',
      descarga: null,
      etiquetas: ['obras por impuestos', 'inversion publica', 'infraestructura', 'peru'],
      destacado: false,
      ejemplo: true
    },
    {
      id: 'noticia-ejemplo-proinversion',
      tipo: 'noticia',
      titulo: 'Qué hace ProInversión y cómo se adjudican los grandes proyectos',
      resumen: 'ProInversión es la agencia del Estado peruano que promueve las APP (Asociaciones Público-Privadas): prepara los concursos de carreteras, puertos o plantas de agua y elige a la empresa ganadora.',
      autor: 'Equipo Construcción Global',
      fuente: 'ProInversión (página oficial)',
      tipoFuente: 'Entidad pública',
      ambito: 'nacional',
      fecha: '2026-09-15',
      enlace: 'https://www.gob.pe/proinversion',
      descarga: null,
      etiquetas: ['proinversion', 'app', 'concesion', 'licitacion', 'infraestructura', 'peru'],
      destacado: false,
      ejemplo: true
    },
    {
      id: 'noticia-ejemplo-capeco',
      tipo: 'noticia',
      titulo: 'Cómo se mide la actividad de la construcción en el Perú',
      resumen: 'CAPECO (Cámara Peruana de la Construcción) publica informes sobre ventas de viviendas, consumo de cemento y expectativas del sector, que ayudan a saber si la construcción crece o se frena.',
      autor: 'Equipo Construcción Global',
      fuente: 'CAPECO (portada)',
      tipoFuente: 'Gremio del sector',
      ambito: 'nacional',
      fecha: '2026-09-10',
      enlace: 'https://www.capeco.org/',
      descarga: null,
      etiquetas: ['capeco', 'cemento', 'vivienda', 'construccion', 'peru'],
      destacado: false,
      ejemplo: true
    },
    {
      id: 'noticia-ejemplo-enr',
      tipo: 'noticia',
      titulo: 'Las mayores constructoras del mundo: el ranking que publica ENR',
      resumen: 'Engineering News-Record (ENR) publica cada año la lista de las empresas de construcción y diseño que más facturan en el mundo, una referencia para conocer a los grandes contratistas EPC.',
      autor: 'Equipo Construcción Global',
      fuente: 'Engineering News-Record (portada)',
      tipoFuente: 'Medio especializado',
      ambito: 'internacional',
      fecha: '2026-09-05',
      enlace: 'https://www.enr.com/',
      descarga: null,
      etiquetas: ['enr', 'ranking', 'contratistas', 'epc', 'constructoras'],
      destacado: false,
      ejemplo: true
    },
    {
      id: 'noticia-ejemplo-construction-dive',
      tipo: 'noticia',
      titulo: 'La tecnología llega a la obra: drones, sensores y BIM',
      resumen: 'Medios especializados como Construction Dive siguen cómo las constructoras usan drones, sensores y BIM (Modelado de Información de la Construcción) para ahorrar tiempo y evitar errores.',
      autor: 'Equipo Construcción Global',
      fuente: 'Construction Dive (portada)',
      tipoFuente: 'Medio especializado',
      ambito: 'internacional',
      fecha: '2026-08-28',
      enlace: 'https://www.constructiondive.com/',
      descarga: null,
      etiquetas: ['tecnologia', 'drones', 'sensores', 'bim', 'construccion digital', 'contech'],
      destacado: false,
      ejemplo: true
    },
    {
      id: 'noticia-ejemplo-banco-mundial',
      tipo: 'noticia',
      titulo: 'La brecha de infraestructura en América Latina',
      resumen: 'El Banco Mundial estudia cuánto les falta invertir a los países en carreteras, agua, energía y transporte, y cómo las APP (Asociaciones Público-Privadas) pueden ayudar a cerrar esa brecha.',
      autor: 'Equipo Construcción Global',
      fuente: 'Banco Mundial — Infraestructura (portada)',
      tipoFuente: 'Organismo multilateral',
      ambito: 'internacional',
      fecha: '2026-08-20',
      enlace: 'https://www.worldbank.org/en/topic/infrastructure',
      descarga: null,
      etiquetas: ['brecha de infraestructura', 'infrastructure gap', 'app', 'ppp', 'banco mundial', 'america latina'],
      destacado: false,
      ejemplo: true
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CATALOGO;
  } else {
    raiz.CATALOGO_CONSTRUCCION = CATALOGO;
  }
})(typeof window !== 'undefined' ? window : globalThis);
