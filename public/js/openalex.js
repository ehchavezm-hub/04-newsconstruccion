/*
 * OPENALEX (índice académico mundial, abierto) — código común para navegador y servidor.
 * API gratuita, sin clave y con CORS abierto: https://api.openalex.org
 *
 * Abre la búsqueda a TODAS las revistas y congresos del mundo, pero con criterio de
 * selectividad (como las revistas indexadas). Solo se acepta un paper si:
 *   - su revista es «núcleo» (is_core: revistas científicas internacionales seleccionadas
 *     por CWTS, Universidad de Leiden), o
 *   - su revista está en el índice DOAJ (revistas de acceso abierto revisadas por pares), o
 *   - su DOI es de una editorial académica de prestigio (fuentes-prestigio.js).
 * Los papers con algún autor de una institución peruana se marcan como «nacional».
 */
(function (raiz) {
  'use strict';

  var enNode = typeof module !== 'undefined' && module.exports;
  var Fuentes = enNode ? require('./fuentes-prestigio.js') : raiz.FuentesPrestigio;
  var Crossref = enNode ? require('./crossref.js') : raiz.Crossref;

  var API = 'https://api.openalex.org/works';
  var CAMPOS = 'id,doi,title,publication_date,authorships,primary_location,best_oa_location,abstract_inverted_index,type,language';

  /**
   * @param {{consulta: string, desde?: string, hasta?: string, pais?: string, filas?: number, correo?: string}} op
   *   consulta: texto o frases con OR (se busca en el título y el resumen).
   *   desde / hasta: "AAAA-MM-DD" (sin `desde`: desde siempre).
   *   pais: "PE" para autores de instituciones peruanas.
   */
  function construirUrl(op) {
    // Las comas separan filtros en OpenAlex: se quitan de la consulta.
    var consulta = String(op.consulta || '').replace(/,/g, ' ').trim();
    if (!consulta) return null;
    var filtros = ['title_and_abstract.search:' + consulta, 'type:article|review|book-chapter'];
    if (op.desde) filtros.push('from_publication_date:' + op.desde);
    if (op.hasta) filtros.push('to_publication_date:' + op.hasta);
    if (op.pais) filtros.push('authorships.countries:' + op.pais);
    var params = new URLSearchParams({
      filter: filtros.join(','),
      sort: 'publication_date:desc',
      'per-page': String(op.filas || 50),
      select: CAMPOS
    });
    if (op.correo) params.set('mailto', op.correo);
    return API + '?' + params.toString();
  }

  /** Reconstruye el resumen a partir del «índice invertido» de OpenAlex. */
  function resumenDe(indice) {
    if (!indice) return '';
    var palabras = [];
    Object.keys(indice).forEach(function (palabra) {
      indice[palabra].forEach(function (pos) { palabras[pos] = palabra; });
    });
    return palabras.filter(Boolean).join(' ');
  }

  function prefijoDoi(doi) {
    var m = /10\.\d{4,9}/.exec(String(doi || ''));
    return m ? m[0] : '';
  }

  /** ¿La revista o editorial cumple el criterio de selectividad? */
  function esSelecto(work) {
    var fuente = (work.primary_location && work.primary_location.source) || {};
    var prefijo = prefijoDoi(work.doi);
    return !!(fuente.is_core || fuente.is_in_doaj ||
      Fuentes.editorialesAcademicas.some(function (e) { return e.prefijo === prefijo; }));
  }

  /** Convierte un trabajo de OpenAlex al formato común de la aplicación. */
  function convertir(work) {
    var fuente = (work.primary_location && work.primary_location.source) || {};
    var autores = (work.authorships || []).map(function (a) { return a.author && a.author.display_name; }).filter(Boolean);
    var paises = [];
    (work.authorships || []).forEach(function (a) { (a.countries || []).forEach(function (p) { paises.push(p); }); });
    var resumen = Crossref.recortar(Crossref.limpiarTexto(resumenDe(work.abstract_inverted_index)), 300);
    var oa = work.best_oa_location || {};
    var enlace = work.doi || (work.primary_location && work.primary_location.landing_page_url) || work.id;
    var doc = {
      id: Crossref.idDesdeTexto('oalex', work.doi || work.id),
      tipo: 'paper',
      titulo: Crossref.limpiarTexto(work.title || 'Sin título'),
      resumen: resumen || 'Artículo académico. Pulse «Visitar enlace» para leer el resumen en la página de la revista.',
      autor: autores.length > 3 ? autores.slice(0, 3).join(', ') + ' y otros' : (autores.join(', ') || 'Autor no indicado'),
      fuente: fuente.display_name || 'Revista académica',
      tipoFuente: (fuente.type === 'conference' ? 'Congreso académico' : 'Revista académica') + (fuente.is_core ? ' indexada' : ''),
      idioma: work.language === 'es' ? 'es' : (work.language === 'en' ? 'en' : ''),
      fecha: work.publication_date || '',
      enlace: enlace,
      descarga: oa.pdf_url ? { url: oa.pdf_url, formato: 'PDF', nombreArchivo: String(work.doi || work.id).replace(/^https?:\/\/(doi\.org\/)?/, '').replace(/[^\w.-]+/g, '_') + '.pdf' } : null,
      etiquetas: [],
      origen: 'OpenAlex'
    };
    // Con algún autor de una institución peruana, el paper es «nacional».
    if (paises.indexOf('PE') > -1) doc.ambito = 'nacional';
    return doc;
  }

  /** Lee una respuesta de OpenAlex: solo papers de fuentes selectas. */
  function interpretar(json) {
    return ((json && json.results) || [])
      .filter(function (w) { return w && w.title && esSelecto(w); })
      .map(convertir)
      .filter(Fuentes.esPaperRelevante);
  }

  var OpenAlex = { construirUrl: construirUrl, convertir: convertir, interpretar: interpretar, esSelecto: esSelecto, resumenDe: resumenDe };

  if (enNode) {
    module.exports = OpenAlex;
  } else {
    raiz.OpenAlex = OpenAlex;
  }
})(typeof window !== 'undefined' ? window : globalThis);
