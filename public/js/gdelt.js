/*
 * BUSCADOR DE NOTICIAS (GDELT) — código común para navegador y servidor.
 * GDELT es un índice gratuito de noticias de todo el mundo, actualizado cada 15 minutos,
 * que permite buscar en los últimos 3 meses sin clave: https://www.gdeltproject.org
 * Solo se busca en los sitios de prestigio de fuentes-prestigio.js (nacionales e internacionales).
 */
(function (raiz) {
  'use strict';

  var enNode = typeof module !== 'undefined' && module.exports;
  var Fuentes = enNode ? require('./fuentes-prestigio.js') : raiz.FuentesPrestigio;
  var Crossref = enNode ? require('./crossref.js') : raiz.Crossref;

  var API = 'https://api.gdeltproject.org/api/v2/doc/doc';
  var MAX_TERMINOS_TEMA = 8;

  /** Palabras válidas para GDELT (rechaza términos de menos de 3 letras). */
  function terminos(consulta) {
    return String(consulta || '')
      .replace(/["()]/g, ' ')
      .split(/\s+/)
      .filter(function (p) { return p.length >= 3; });
  }

  /** ¿Es una sigla de 3 letras escrita en mayúsculas (BIM, EPC, APP)? */
  function esSigla(t) {
    return /^[A-Z0-9&]{3}$/.test(t);
  }

  /**
   * Términos de un tema que se envían a GDELT: los primeros 8 de 4 letras o más.
   * Las siglas de 3 letras (BIM, EPC, APP) se aceptan solo si van junto a otro término:
   * GDELT no admite una búsqueda formada únicamente por una palabra tan corta.
   */
  function terminosDeTema(lista) {
    var limpios = lista.map(function (t) { return t.trim().replace(/"/g, ''); });
    var elegidos = limpios.filter(function (t) { return t.length >= 4 || esSigla(t); })
      .slice(0, MAX_TERMINOS_TEMA);
    var largos = elegidos.filter(function (t) { return t.length >= 4; });
    return largos.length ? elegidos : [];
  }

  /**
   * @param {string} consulta  Lo que escribió la persona.
   * @param {{maximo?: number, terminos?: string[]}} op  terminos: lista de un tema sugerido.
   * @returns {string|null} Dirección de la consulta, o null si no hay palabras válidas.
   */
  function construirUrl(consulta, op) {
    op = op || {};
    var tema;
    if (op.terminos && op.terminos.length) {
      // Tema sugerido: cualquiera de sus primeros términos, entre paréntesis y con OR.
      var lista = terminosDeTema(op.terminos)
        .map(function (t) { return t.indexOf(' ') > -1 ? '"' + t + '"' : t; });
      if (!lista.length) return null;
      tema = '(' + lista.join(' OR ') + ')';
    } else {
      var palabras = terminos(consulta);
      if (!palabras.length) return null;
      // Varias palabras se buscan como frase exacta ("puerto de chancay"); una sola, tal cual.
      tema = palabras.length > 1 ? '"' + palabras.join(' ') + '"' : palabras[0];
    }
    var sitios = '(' + Fuentes.dominios.map(function (d) { return 'domainis:' + d.dominio; }).join(' OR ') + ')';
    var params = new URLSearchParams({
      query: tema + ' ' + sitios,
      mode: 'ArtList',
      format: 'json',
      sort: 'DateDesc',
      maxrecords: String(op.maximo || 75)
    });
    return API + '?' + params.toString();
  }

  /** "20260926T143000Z" -> "2026-09-26T14:30:00.000Z" */
  function fechaGdelt(texto) {
    var m = /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})/.exec(String(texto || ''));
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])).toISOString() : '';
  }

  /** Convierte un artículo de GDELT al formato común de la aplicación. */
  function convertir(articulo) {
    var sitio = Fuentes.sitioDe(articulo.url || articulo.domain || '') || {};
    var idioma = /spanish/i.test(articulo.language || '') ? 'es' : (/english/i.test(articulo.language || '') ? 'en' : '');
    return {
      id: Crossref.idDesdeTexto('gdelt', articulo.url),
      tipo: 'noticia',
      titulo: Crossref.limpiarTexto(articulo.title || ''),
      resumen: 'Noticia de ' + (sitio.nombre || articulo.domain) + '. Pulse «Visitar enlace» para leerla completa.',
      autor: sitio.nombre || articulo.domain || '',
      fuente: sitio.nombre || articulo.domain || '',
      tipoFuente: sitio.ambito === 'nacional' ? 'Medio de referencia nacional' : 'Medio de referencia',
      ambito: sitio.ambito || 'internacional',
      idioma: idioma,
      fecha: fechaGdelt(articulo.seendate),
      enlace: articulo.url,
      descarga: null,
      etiquetas: [],
      origen: 'GDELT'
    };
  }

  /** Lee la respuesta de GDELT (a veces responde texto en vez de JSON cuando no hay resultados). */
  function interpretar(texto) {
    var datos;
    try { datos = JSON.parse(texto); } catch (e) { return []; }
    var vistos = {};
    return ((datos && datos.articles) || [])
      .filter(function (a) { return a && a.url && a.title && Fuentes.sitioDe(a.url); })
      .map(convertir)
      .filter(function (d) {
        var clave = d.titulo.toLowerCase();
        if (vistos[clave]) return false;
        vistos[clave] = true;
        return true;
      });
  }

  var Gdelt = {
    construirUrl: construirUrl,
    convertir: convertir,
    interpretar: interpretar,
    fechaGdelt: fechaGdelt,
    terminosDeTema: terminosDeTema
  };

  if (enNode) {
    module.exports = Gdelt;
  } else {
    raiz.Gdelt = Gdelt;
  }
})(typeof window !== 'undefined' ? window : globalThis);
