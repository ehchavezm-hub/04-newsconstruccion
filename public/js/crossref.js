/*
 * CROSSREF (papers académicos reales) — código común para navegador y servidor.
 * API pública y gratuita: https://api.crossref.org (no requiere clave y permite
 * consultas directas desde el navegador).
 * Solo se consultan las revistas de prestigio de fuentes-prestigio.js.
 * También reúne utilidades de texto que usa el resto de la aplicación.
 */
(function (raiz) {
  'use strict';

  var Fuentes = typeof module !== 'undefined' && module.exports
    ? require('./fuentes-prestigio.js')
    : raiz.FuentesPrestigio;

  /** Quita etiquetas HTML/XML y decodifica entidades básicas. */
  function limpiarTexto(texto) {
    return String(texto || '')
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      // Muchos feeds envían el HTML "escapado" (&lt;p&gt;): primero se recupera y luego se quita.
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
      .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); })
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Recorta un texto a un largo máximo sin cortar palabras. */
  function recortar(texto, max) {
    max = max || 280;
    if (texto.length <= max) return texto;
    return texto.slice(0, texto.lastIndexOf(' ', max)) + '…';
  }

  function idDesdeTexto(prefijo, texto) {
    var h = 0;
    var s = String(texto);
    for (var i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return prefijo + '-' + (h >>> 0).toString(36);
  }

  /** "AAAA-MM-DD" de hace `dias` días. */
  function haceDias(dias, ahora) {
    return new Date((ahora || new Date()).getTime() - dias * 86400000).toISOString().slice(0, 10);
  }

  /**
   * @param {{consulta?: string, desde?: string, filas?: number, correo?: string}} op
   *   desde: "AAAA-MM-DD" para traer solo lo publicado desde esa fecha.
   *   - Con consulta (un tema o lo que escribió la persona): busca en TODAS las revistas y
   *     congresos de las editoriales académicas de prestigio (por prefijo de DOI). Si no se
   *     indica `desde`, solo lo de los últimos 12 meses (lo vigente).
   *   - Sin consulta (novedades de la semana): las revistas núcleo, de lo más nuevo a lo más antiguo.
   */
  function construirUrl(op) {
    var filtros;
    if (op.consulta) {
      filtros = ['type:journal-article', 'type:proceedings-article'].concat(
        Fuentes.editorialesAcademicas.map(function (e) { return 'prefix:' + e.prefijo; })
      );
      filtros.push('from-pub-date:' + (op.desde || haceDias(365)));
    } else {
      filtros = ['type:journal-article'].concat(
        Fuentes.revistas.map(function (r) { return 'issn:' + r.issn; })
      );
      if (op.desde) filtros.push('from-pub-date:' + op.desde);
    }
    var params = new URLSearchParams({
      rows: String(op.filas || 10),
      filter: filtros.join(','),
      select: 'DOI,title,author,issued,container-title,abstract,link,license,URL'
    });
    if (op.consulta) params.set('query', op.consulta);
    if (op.desde && !op.consulta) { params.set('sort', 'published'); params.set('order', 'desc'); }
    if (op.correo) params.set('mailto', op.correo);
    return 'https://api.crossref.org/works?' + params.toString();
  }

  /** Convierte un registro de Crossref al formato común de la aplicación. */
  function convertir(item) {
    var autores = (item.author || [])
      .map(function (a) { return [a.given, a.family].filter(Boolean).join(' ') || a.name; })
      .filter(Boolean);
    var partes = (item.issued && item.issued['date-parts'] && item.issued['date-parts'][0]) || [];
    var fecha = partes.filter(function (n) { return n != null; })
      .map(function (n, i) { return i === 0 ? String(n) : String(n).padStart(2, '0'); }).join('-');

    // Solo se ofrece descarga si hay licencia abierta (Creative Commons) y un enlace PDF.
    var abierto = (item.license || []).some(function (l) { return /creativecommons\.org/i.test(l.URL || ''); });
    var pdf = (item.link || []).filter(function (l) { return /pdf/i.test(l['content-type'] || ''); })[0];
    var resumen = recortar(limpiarTexto(item.abstract || ''), 300);

    return {
      id: idDesdeTexto('crossref', item.DOI),
      tipo: 'paper',
      titulo: limpiarTexto((item.title || ['Sin título'])[0]),
      resumen: resumen || 'Artículo académico. Pulse «Visitar enlace» para leer el resumen en la página de la revista.',
      autor: autores.length > 3 ? autores.slice(0, 3).join(', ') + ' y otros' : (autores.join(', ') || 'Autor no indicado'),
      fuente: limpiarTexto((item['container-title'] || ['Revista académica'])[0]),
      tipoFuente: 'Revista académica',
      idioma: 'en',
      fecha: fecha,
      enlace: item.URL || 'https://doi.org/' + item.DOI,
      descarga: abierto && pdf
        ? { url: pdf.URL, formato: 'PDF', nombreArchivo: item.DOI.replace(/[^\w.-]+/g, '_') + '.pdf' }
        : null,
      etiquetas: [],
      origen: 'Crossref'
    };
  }

  /**
   * Lee una respuesta de Crossref. De las revistas amplias (por ejemplo, Journal of Cleaner
   * Production) solo se quedan los artículos que tratan de construcción.
   */
  function interpretar(json) {
    return ((json && json.message && json.message.items) || [])
      .map(convertir)
      .filter(Fuentes.esPaperRelevante);
  }

  var Crossref = {
    construirUrl: construirUrl,
    haceDias: haceDias,
    convertir: convertir,
    interpretar: interpretar,
    limpiarTexto: limpiarTexto,
    recortar: recortar,
    idDesdeTexto: idDesdeTexto
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Crossref;
  } else {
    raiz.Crossref = Crossref;
  }
})(typeof window !== 'undefined' ? window : globalThis);
