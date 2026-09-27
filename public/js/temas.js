/*
 * TEMAS SUGERIDOS
 * ---------------
 * Botones de "¿No sabe por dónde empezar? Pulse un tema".
 * Cada tema busca CUALQUIERA de sus términos (en español e inglés), no la frase exacta.
 *   - Un término busca el comienzo de una palabra: "sensores" encuentra "sensores".
 *   - Si termina en espacio, debe ser la palabra exacta: "ia " no encuentra "ingeniería".
 *   - Las siglas se escriben en MAYÚSCULAS (BIM, EPC, APP): así el buscador de noticias
 *     (GDELT) sabe que son siglas y las acepta aunque tengan solo 3 letras.
 *   - Los primeros términos de cada lista son los que se usan en el buscador de noticias
 *     en internet (GDELT), así que conviene poner primero los más representativos.
 *
 * El grupo "Ciclo de Vida del Proyecto (IPC)" se muestra en el orden de las etapas:
 * Ingeniería → Procura → Construcción → Puesta en marcha → Operación.
 *
 * Para cambiar un tema, edite su "etiqueta" (lo que se ve) o su lista de "terminos".
 * Se usa en el navegador (window.Temas) y en Node.js (require).
 */
(function (raiz) {
  'use strict';

  var grupos = [
    {
      id: 'innovacion',
      titulo: 'Tendencias e Innovación',
      icono: '💡',
      // Significado de las siglas que aparecen en los temas de este grupo.
      siglas: 'BIM (Modelado de Información de la Construcción) · IA (Inteligencia Artificial) · APP (Asociación Público-Privada)',
      temas: [
        { id: 'bim-digital', etiqueta: 'BIM y Construcción Digital', terminos: [
          'BIM', 'building information modeling', 'gemelo digital', 'digital twin', 'construcción digital',
          'digital construction', 'modelado de información', 'ISO 19650', 'Plan BIM Perú', 'IFC ', 'modelo 4D',
          '5D ', 'nube de puntos', 'point cloud', 'escaneo láser', 'drones en obra', 'construction technology', 'contech'] },
        { id: 'ia-automatizacion', etiqueta: 'IA y Automatización', terminos: [
          'inteligencia artificial', 'artificial intelligence', 'ia ', 'automatización', 'automation',
          'robótica', 'construction robotics', 'impresión 3D', '3D printing', 'visión artificial',
          'computer vision', 'machine learning', 'analítica predictiva', 'predictive analytics',
          'internet de las cosas', 'IoT ', 'sensores'] },
        { id: 'sostenible', etiqueta: 'Construcción Sostenible', terminos: [
          'construcción sostenible', 'sustainable construction', 'edificación verde', 'green building',
          'carbono incorporado', 'embodied carbon', 'huella de carbono', 'LEED ', 'EDGE ',
          'eficiencia energética', 'energy efficiency', 'economía circular', 'circular economy', 'net zero',
          'cemento bajo en carbono', 'low-carbon concrete', 'resiliencia climática', 'climate resilience'] },
        { id: 'seguridad-obra', etiqueta: 'Seguridad y Salud en Obra', terminos: [
          'seguridad en obra', 'construction safety', 'seguridad y salud en el trabajo', 'occupational safety',
          'SSOMA', 'HSE ', 'accidente de trabajo', 'workplace accident', 'prevención de riesgos', 'Norma G.050',
          'ISO 45001', 'OSHA ', 'SUNAFIL', 'trabajos en altura', 'working at height',
          'equipos de protección personal', 'PPE '] },
        { id: 'infraestructura-app', etiqueta: 'Infraestructura y APP', terminos: [
          'infraestructura', 'infrastructure', 'asociación público-privada', 'public-private partnership',
          'APP ', 'PPP ', 'obras por impuestos', 'ProInversión', 'concesión', 'concession',
          'brecha de infraestructura', 'infrastructure gap', 'gobierno a gobierno', 'megaproyecto',
          'megaproject', 'project finance', 'financiamiento de proyectos', 'Plan Nacional de Infraestructura'] }
      ]
    },
    {
      id: 'ciclo',
      titulo: 'Ciclo de Vida del Proyecto (IPC)',
      icono: '🏗️',
      nota: 'Las etapas de un proyecto, de la idea a la operación.',
      siglas: 'IPC (Ingeniería, Procura y Construcción; en inglés, EPC) · O&M (Operación y Mantenimiento) · FEED (ingeniería básica extendida, antes de construir)',
      temas: [
        { id: 'ingenieria', etiqueta: 'Ingeniería y Diseño', terminos: [
          'ingeniería de detalle', 'detailed engineering', 'ingeniería básica', 'basic engineering', 'FEED ',
          'front-end engineering design', 'ingeniería conceptual', 'conceptual engineering',
          'estudio de factibilidad', 'feasibility study', 'expediente técnico', 'diseño estructural',
          'structural design', 'constructabilidad', 'constructability', 'ingeniería de valor',
          'value engineering', 'estudio de preinversión'] },
        { id: 'procura', etiqueta: 'Procura y Contratos', terminos: [
          'procura', 'procurement', 'contrato EPC', 'EPC contract', 'licitación', 'tender', 'bidding',
          'adquisiciones', 'cadena de suministro', 'supply chain', 'contrataciones públicas',
          'public procurement', 'OECE ', 'Ley 32069', 'FIDIC', 'NEC4', 'expediting',
          'inspección en fábrica', 'arbitraje de construcción', 'construction arbitration', 'reclamos', 'claims'] },
        { id: 'construccion', etiqueta: 'Construcción y Obra', terminos: [
          'ejecución de obra', 'construction project', 'gestión de proyectos', 'project management',
          'cronograma', 'schedule', 'ruta crítica', 'critical path', 'valor ganado', 'earned value',
          'control de costos', 'cost control', 'Lean Construction', 'Last Planner', 'productividad',
          'construction productivity', 'supervisión de obra', 'control de calidad', 'quality control',
          'sobrecostos', 'cost overrun'] },
        { id: 'puesta-marcha', etiqueta: 'Puesta en Marcha', terminos: [
          'puesta en marcha', 'commissioning', 'comisionamiento', 'precomisionamiento', 'pre-commissioning',
          'arranque', 'start-up', 'completamiento mecánico', 'mechanical completion', 'pruebas de desempeño',
          'performance test', 'entrega de sistemas', 'handover', 'turnover', 'pruebas FAT', 'pruebas SAT',
          'recepción de obra', 'liquidación de obra'] },
        { id: 'operacion', etiqueta: 'Operación y Mantenimiento', terminos: [
          'operación y mantenimiento', 'operation and maintenance', 'O&M ', 'mantenimiento predictivo',
          'predictive maintenance', 'confiabilidad', 'reliability', 'RCM ', 'gestión de activos',
          'asset management', 'ISO 55000', 'disponibilidad', 'availability', 'facility management',
          'parada de planta', 'shutdown', 'turnaround', 'vida útil', 'life cycle cost'] }
      ]
    }
  ];

  // Cada tema recuerda a qué grupo pertenece.
  grupos.forEach(function (g) {
    g.temas.forEach(function (t) { t.grupo = g.id; });
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
