/*
 * LIBROS RECIENTES — código común para navegador y servidor.
 * Fuentes gratuitas y sin clave:
 *   - Google Books (https://www.googleapis.com/books/v1): solo al generar los datos,
 *     porque sin clave suele responder "demasiadas consultas" (429).
 *   - Open Library (https://openlibrary.org): fuente efectiva y la que usa el navegador.
 * Solo se aceptan libros de las editoriales de prestigio de fuentes-prestigio.js.
 */
(function (raiz) {
  'use strict';

  var enNode = typeof module !== 'undefined' && module.exports;
  var Fuentes = enNode ? require('./fuentes-prestigio.js') : raiz.FuentesPrestigio;
  var Crossref = enNode ? require('./crossref.js') : raiz.Crossref;

  // Los temas de búsqueda de libros salen de public/js/temas.js (consulta académica de cada tema).

  /** @param {{q: string, idioma?: string, maximo?: number, recientes?: boolean}} op */
  function urlGoogle(op) {
    var params = new URLSearchParams({
      q: op.q,
      printType: 'books',
      maxResults: String(op.maximo || 40),
      orderBy: op.recientes === false ? 'relevance' : 'newest'
    });
    if (op.idioma) params.set('langRestrict', op.idioma);
    return 'https://www.googleapis.com/books/v1/volumes?' + params.toString();
  }

  function urlOpenLibrary(tema) {
    var params = new URLSearchParams({
      q: tema,
      sort: 'new',
      limit: '60',
      fields: 'key,title,subtitle,author_name,publisher,first_publish_year,language,subject,ebook_access,ia'
    });
    return 'https://openlibrary.org/search.json?' + params.toString();
  }

  function anio(fecha) { return parseInt(String(fecha || ''), 10) || 0; }

  /** Convierte un volumen de Google Books; devuelve null si no es de una editorial de prestigio. */
  function convertirGoogle(item) {
    var v = (item && item.volumeInfo) || {};
    if (!v.title || !Fuentes.esEditorialPrestigio(v.publisher)) return null;
    var acceso = (item.accessInfo) || {};
    var libre = acceso.accessViewStatus === 'FULL_PUBLIC_DOMAIN' && acceso.pdf && acceso.pdf.isAvailable && acceso.pdf.downloadLink;
    var doc = {
      id: Crossref.idDesdeTexto('gbooks', item.id || v.title),
      tipo: 'libro',
      titulo: v.title + (v.subtitle ? ': ' + v.subtitle : ''),
      resumen: v.description ? Crossref.recortar(Crossref.limpiarTexto(v.description), 280)
        : 'Libro publicado por ' + v.publisher + '. Pulse «Visitar enlace» para ver su descripción.',
      autor: (v.authors || []).slice(0, 3).join(', ') || 'Autor no indicado',
      fuente: v.publisher,
      tipoFuente: 'Editorial',
      idioma: v.language || '',
      fecha: v.publishedDate || '',
      enlace: v.canonicalVolumeLink || v.infoLink || ('https://books.google.com/books?id=' + item.id),
      descarga: libre ? { url: acceso.pdf.downloadLink, formato: 'PDF', nombreArchivo: v.title.replace(/[^\w.-]+/g, '_') + '.pdf' } : null,
      etiquetas: v.categories || [],
      origen: 'Google Books'
    };
    doc.ambito = Fuentes.ambitoDe(doc);
    return doc;
  }

  /** Convierte un libro de Open Library; null si ninguna de sus editoriales es de prestigio. */
  function convertirOpenLibrary(libro) {
    var editorial = (libro.publisher || []).filter(Fuentes.esEditorialPrestigio)[0];
    if (!libro.title || !editorial) return null;
    var doc = {
      id: Crossref.idDesdeTexto('olib', libro.key || libro.title),
      tipo: 'libro',
      titulo: libro.title + (libro.subtitle ? ': ' + libro.subtitle : ''),
      resumen: 'Libro publicado por ' + editorial + '. Pulse «Visitar enlace» para ver más detalles.',
      autor: (libro.author_name || []).slice(0, 3).join(', ') || 'Autor no indicado',
      fuente: editorial,
      tipoFuente: 'Editorial',
      idioma: (libro.language || []).indexOf('spa') > -1 ? 'es' : ((libro.language || []).indexOf('eng') > -1 ? 'en' : ''),
      fecha: libro.first_publish_year ? String(libro.first_publish_year) : '',
      enlace: 'https://openlibrary.org' + libro.key,
      // Libro de dominio público en Internet Archive: se puede descargar en PDF.
      descarga: libro.ebook_access === 'public' && (libro.ia || [])[0]
        ? { url: 'https://archive.org/download/' + libro.ia[0] + '/' + libro.ia[0] + '.pdf', formato: 'PDF', nombreArchivo: libro.ia[0] + '.pdf' }
        : null,
      // Las materias del libro ayudan a relacionarlo con los temas.
      etiquetas: (libro.subject || []).slice(0, 15),
      origen: 'Open Library'
    };
    doc.ambito = Fuentes.ambitoDe(doc);
    return doc;
  }

  /** Lee una respuesta de Google Books. */
  function interpretarGoogle(json, desdeAnio) {
    return ((json && json.items) || [])
      .map(convertirGoogle)
      .filter(function (d) { return d && (!desdeAnio || anio(d.fecha) >= desdeAnio); });
  }

  function interpretarOpenLibrary(json, desdeAnio) {
    return ((json && json.docs) || [])
      .map(convertirOpenLibrary)
      .filter(function (d) { return d && (!desdeAnio || anio(d.fecha) >= desdeAnio); });
  }

  /** Quita repetidos (mismo título) conservando el primero. */
  function sinRepetidos(libros) {
    var vistos = {};
    return libros.filter(function (l) {
      var clave = l.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (vistos[clave]) return false;
      vistos[clave] = true;
      return true;
    });
  }

  var Libros = {
    urlGoogle: urlGoogle,
    urlOpenLibrary: urlOpenLibrary,
    convertirGoogle: convertirGoogle,
    convertirOpenLibrary: convertirOpenLibrary,
    interpretarGoogle: interpretarGoogle,
    interpretarOpenLibrary: interpretarOpenLibrary,
    sinRepetidos: sinRepetidos
  };

  if (enNode) {
    module.exports = Libros;
  } else {
    raiz.Libros = Libros;
  }
})(typeof window !== 'undefined' ? window : globalThis);
