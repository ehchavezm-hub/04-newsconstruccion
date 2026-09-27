/*
 * MOTOR DE BÚSQUEDA
 * -----------------
 * Busca dentro de una lista de documentos.
 * - No distingue mayúsculas ni tildes ("licitacion" encuentra "Licitación").
 * - Entiende sinónimos del sector en español e inglés ("EPC" = "IPC" = "Ingeniería, Procura
 *   y Construcción"; "commissioning" = "puesta en marcha").
 * - Busca al comienzo de las palabras ("puente" encuentra "puentes"). Si una variante
 *   termina en espacio, debe ser la palabra exacta ("epc " no encuentra "epcm").
 * - Solo muestra lo que coincide con todos los conceptos buscados.
 * - Ordena de lo más reciente a lo más antiguo ("de hoy hacia atrás"); a igual
 *   fecha, primero lo más relevante (el título pesa más que el resumen).
 *
 * Se usa en el navegador (window.MotorBusqueda) y en el servidor (require).
 */
(function (raiz) {
  'use strict';

  var PALABRAS_VACIAS = [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a',
    'y', 'o', 'e', 'en', 'con', 'por', 'para', 'sobre', 'que', 'se', 'su', 'sus',
    'lo', 'como', 'es', 'mas', 'the', 'of', 'and', 'in', 'on', 'to', 'for'
  ];

  // Grupos de palabras que significan lo mismo. Todas se buscan juntas.
  // Ya están normalizadas (sin tildes ni signos: "O&M" se escribe "o m").
  // Un espacio final pide la palabra exacta (útil para siglas cortas).
  var SINONIMOS = [
    ['epc ', 'ipc ', 'ingenieria procura y construccion', 'engineering procurement and construction'],
    ['procura', 'procurement', 'adquisiciones', 'compras'],
    ['licitacion', 'licitaciones', 'tender', 'bidding', 'concurso'],
    ['puesta en marcha', 'commissioning', 'comisionamiento', 'arranque', 'start-up', 'startup'],
    ['operacion y mantenimiento', 'o m ', 'operation and maintenance'],
    ['bim ', 'building information modeling', 'building information modelling', 'modelado de informacion de la construccion'],
    ['app ', 'ppp ', 'asociacion publico-privada', 'asociacion publico privada', 'asociaciones publico privadas',
     'public-private partnership', 'public private partnership'],
    ['obra', 'construction site'],
    ['contrato', 'contract'],
    ['reclamo', 'claim'],
    ['arbitraje', 'arbitration'],
    ['cronograma', 'schedule'],
    ['ruta critica', 'critical path'],
    ['valor ganado', 'earned value'],
    ['seguridad y salud', 'hse ', 'ssoma'],
    ['mantenimiento', 'maintenance'],
    ['confiabilidad', 'reliability'],
    ['gemelo digital', 'digital twin'],
    ['carretera', 'road ', 'roads ', 'highway'],
    ['puente', 'bridge'],
    ['tunel', 'tunnel'],
    ['puerto', 'port ', 'ports '],
    ['mineria', 'minero', 'minera', 'mining'],
    ['energia', 'energy']
  ];

  var PESOS = { titulo: 4, etiquetas: 3, autor: 3, fuente: 1, resumen: 1 };

  /** Pasa a minúsculas, quita tildes y signos. "¿Licitación EPC?" -> "licitacion epc" */
  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9ñ\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Grupo de sinónimos al que pertenece una palabra o frase (o null). */
  function grupoDe(texto) {
    return SINONIMOS.filter(function (g) {
      return g.some(function (v) { return v.trim() === texto; });
    })[0] || null;
  }

  /**
   * Convierte la consulta en una lista de "conceptos". Cada concepto es una lista
   * de variantes equivalentes (por sinónimos). Un documento debe coincidir con
   * todos los conceptos para aparecer.
   */
  function interpretarConsulta(consulta) {
    var texto = ' ' + normalizar(consulta) + ' ';
    var conceptos = [];

    // 1) Primero, frases de varias palabras reconocidas como sinónimos ("puesta en marcha").
    SINONIMOS.forEach(function (grupo) {
      grupo.forEach(function (variante) {
        var v = variante.trim();
        if (v.indexOf(' ') > -1 && texto.indexOf(' ' + v + ' ') > -1) {
          conceptos.push(grupo.slice());
          texto = texto.split(' ' + v + ' ').join(' ');
        }
      });
    });

    // 2) Luego, palabras sueltas.
    texto.split(' ').forEach(function (palabra) {
      if (!palabra || palabra.length < 2 || PALABRAS_VACIAS.indexOf(palabra) > -1) return;
      var grupo = grupoDe(palabra);
      conceptos.push(grupo ? grupo.slice() : [palabra]);
    });

    return conceptos;
  }

  function contiene(textoNormalizado, variante) {
    // Coincide al inicio de una palabra: "licitacion" encuentra "licitaciones".
    // Si la variante termina en espacio, debe ser la palabra completa ("ia " no encuentra "ingenieria").
    return (' ' + textoNormalizado + ' ').indexOf(' ' + variante) > -1;
  }

  /** @param {boolean} cualquiera  true: basta con un concepto (temas); false: deben estar todos. */
  function puntuar(doc, conceptos, cualquiera) {
    var campos = {
      titulo: normalizar(doc.titulo),
      etiquetas: normalizar((doc.etiquetas || []).join(' ')),
      autor: normalizar(doc.autor),
      fuente: normalizar(doc.fuente),
      resumen: normalizar(doc.resumen)
    };
    var total = 0;
    for (var i = 0; i < conceptos.length; i++) {
      var mejor = 0;
      for (var campo in campos) {
        for (var j = 0; j < conceptos[i].length; j++) {
          if (contiene(campos[campo], conceptos[i][j])) mejor = Math.max(mejor, PESOS[campo]);
        }
      }
      if (mejor === 0 && !cualquiera) return 0; // Falta un concepto: no es relevante.
      total += mejor;
    }
    return total;
  }

  /** Convierte "1994", "1994-05" o "-0015" en un número para ordenar. */
  function valorFecha(fecha) {
    fecha = String(fecha || '');
    var t = Date.parse(/^\d{4}-\d{2}$/.test(fecha) ? fecha + '-01' : fecha);
    if (!isNaN(t) && /^\d{4}-\d{2}/.test(fecha)) return t;
    var anio = parseInt(fecha, 10);
    return isNaN(anio) ? -Infinity : Date.UTC(0, 0, 1) + (anio - 1900) * 31557600000;
  }

  /** Términos de un tema: cada uno es un concepto; el espacio final (palabra exacta) se conserva. */
  function conceptosDeTerminos(terminos) {
    return (terminos || []).map(function (t) {
      var exacto = /\s$/.test(t);
      return [normalizar(t) + (exacto ? ' ' : '')];
    }).filter(function (c) { return c[0].trim(); });
  }

  /**
   * ¿El documento es del tipo pedido? Las normas y guías se muestran junto a los papers
   * (son documentos de consulta, no noticias ni libros).
   */
  function coincideTipo(tipoDoc, tipo) {
    return !tipo || tipo === 'todos' || tipoDoc === tipo || (tipo === 'paper' && tipoDoc === 'norma');
  }

  /**
   * Busca documentos.
   * @param {Array} documentos Lista de documentos (ver datos/catalogo.js).
   * @param {Object} opciones { consulta: "texto", tipo: "todos"|"noticia"|"paper"|"libro",
   *                            terminos: [lista de un tema sugerido; basta con que aparezca uno] }
   * @returns {Array} Documentos ordenados de lo más reciente a lo más antiguo; a igual fecha, por relevancia.
   */
  function buscar(documentos, opciones) {
    opciones = opciones || {};
    var tipo = opciones.tipo || 'todos';
    // Un tema sugerido trae su lista de términos: basta con que aparezca cualquiera.
    var cualquiera = !!(opciones.terminos && opciones.terminos.length);
    var conceptos = cualquiera ? conceptosDeTerminos(opciones.terminos) : interpretarConsulta(opciones.consulta || '');

    return documentos
      .filter(function (d) { return coincideTipo(d.tipo, tipo); })
      .map(function (d) { return { doc: d, puntos: conceptos.length ? puntuar(d, conceptos, cualquiera) : 1 }; })
      .filter(function (r) { return r.puntos > 0; })
      .sort(function (a, b) {
        return (valorFecha(b.doc.fecha) - valorFecha(a.doc.fecha)) || (b.puntos - a.puntos);
      })
      .map(function (r) { return r.doc; });
  }

  /** Ordena cualquier lista de documentos de lo más reciente a lo más antiguo. */
  function ordenarPorFecha(documentos) {
    return documentos.slice().sort(function (a, b) { return valorFecha(b.fecha) - valorFecha(a.fecha); });
  }

  /* ------------------ Relación con los temas y vigencia ------------------ */

  var indiceTemas = null;

  /** Términos de todos los temas, ya normalizados (directos e indirectos). */
  function temasNormalizados() {
    if (indiceTemas) return indiceTemas;
    var Temas = typeof module !== 'undefined' && module.exports ? require('./temas.js') : raiz.Temas;
    var aVariantes = function (lista) {
      return (lista || []).map(function (t) {
        return normalizar(t) + (/\s$/.test(t) ? ' ' : '');
      }).filter(function (v) { return v.trim(); });
    };
    indiceTemas = [];
    Temas.grupos.forEach(function (g) {
      g.temas.forEach(function (t) {
        indiceTemas.push({ id: t.id, etiqueta: t.etiqueta, directos: aVariantes(t.terminos), indirectos: aVariantes(t.relacionados) });
      });
    });
    return indiceTemas;
  }

  /**
   * Temas con los que se relaciona un documento: primero los de relación directa (nombra el
   * tema) y después los de relación indirecta. Se mira el título, el resumen y las etiquetas
   * (no la fuente: «Construction Dive» no hace que todo trate de construcción).
   * @returns {Array<{id: string, etiqueta: string, directo: boolean}>}
   */
  // Resúmenes genéricos que escribe la aplicación («Publicado por CAPECO — Cámara Peruana de la
  // Construcción. Pulse…»): nombran la fuente, no el contenido, así que no cuentan.
  var RESUMEN_GENERICO = /(^|\. )(Publicado por|Noticia de|Libro publicado por) .*Pulse «Visitar enlace»|^Artículo académico\. Pulse/;

  function temasDe(doc) {
    var resumen = RESUMEN_GENERICO.test(doc.resumen || '') ? '' : doc.resumen;
    var texto = normalizar([doc.titulo, resumen, (doc.etiquetas || []).join(' '), doc.capitulo].join(' '));
    var coincide = function (v) { return contiene(texto, v); };
    var directos = [];
    var indirectos = [];
    temasNormalizados().forEach(function (t) {
      if (t.directos.some(coincide)) directos.push({ id: t.id, etiqueta: t.etiqueta, directo: true });
      else if (t.indirectos.some(coincide)) indirectos.push({ id: t.id, etiqueta: t.etiqueta, directo: false });
    });
    return directos.concat(indirectos);
  }

  /** ¿El documento se relaciona, directa o indirectamente, con alguno de los temas? */
  function esDeLosTemas(doc) {
    return temasDe(doc).length > 0;
  }

  /*
   * PERÍODO DE BÚSQUEDA
   * Por defecto, solo lo del ÚLTIMO AÑO (365 días) en las cuatro pestañas. La persona puede
   * elegir 2, 3, 4 o 5 años, o «Todo el tiempo» (0).
   */
  var PERIODOS = [
    { anios: 1, etiqueta: 'Último año' },
    { anios: 2, etiqueta: 'Últimos 2 años' },
    { anios: 3, etiqueta: 'Últimos 3 años' },
    { anios: 4, etiqueta: 'Últimos 4 años' },
    { anios: 5, etiqueta: 'Últimos 5 años' },
    { anios: 0, etiqueta: 'Todo el tiempo' }
  ];
  var PERIODO_POR_DEFECTO = 1;

  /** Días que abarca un período en años (0 = todo el tiempo = sin límite). */
  function diasDePeriodo(anios) {
    return anios ? anios * 365 : Infinity;
  }

  /** "AAAA-MM-DD" del comienzo del período (null si es todo el tiempo). */
  function inicioDePeriodo(anios, ahora) {
    if (!anios) return null;
    return new Date((ahora || new Date()).getTime() - diasDePeriodo(anios) * 86400000).toISOString().slice(0, 10);
  }

  /**
   * ¿El documento está dentro del período elegido (por defecto, el último año)?
   *   - Si solo se conoce el año, basta con que sea el año del límite o posterior.
   *   - Normas: solo las que están en vigor (vigente: true en el catálogo), sin importar su fecha.
   *   - El contenido de ejemplo nunca se muestra; nada con fecha futura.
   * @param {number} [anios]  1 a 5, o 0 = todo el tiempo. Por defecto, 1.
   */
  function vigente(doc, ahora, anios) {
    if (doc.ejemplo) return false;
    if (doc.tipo === 'norma') return doc.vigente === true;
    if (doc.fragmento) return true; // párrafos de la biblioteca personal
    if (anios === undefined || anios === null) anios = PERIODO_POR_DEFECTO;
    var hoy = (ahora || new Date()).getTime();
    var limite = hoy - diasDePeriodo(anios) * 86400000;
    var fecha = String(doc.fecha || '');
    if (/^-?\d{1,4}$/.test(fecha)) {
      var anio = Number(fecha);
      return anio <= new Date(hoy).getUTCFullYear() && (!isFinite(limite) || anio >= new Date(limite).getUTCFullYear());
    }
    var t = valorFecha(fecha);
    if (t === -Infinity) return false;
    return t <= hoy + 86400000 && (!isFinite(limite) || t >= limite);
  }

  /** Solo lo que está en el período, se relaciona con los temas y no es ruido (empleo, publicidad). */
  function aptos(documentos, ahora, anios) {
    var Fuentes = typeof module !== 'undefined' && module.exports ? require('./fuentes-prestigio.js') : raiz.FuentesPrestigio;
    return documentos.filter(function (d) {
      return vigente(d, ahora, anios) && esDeLosTemas(d) && !Fuentes.esDescartable(d);
    });
  }

  var MotorBusqueda = {
    normalizar: normalizar,
    ordenarPorFecha: ordenarPorFecha,
    interpretarConsulta: interpretarConsulta,
    coincideTipo: coincideTipo,
    buscar: buscar,
    valorFecha: valorFecha,
    temasDe: temasDe,
    esDeLosTemas: esDeLosTemas,
    vigente: vigente,
    aptos: aptos,
    PERIODOS: PERIODOS,
    PERIODO_POR_DEFECTO: PERIODO_POR_DEFECTO,
    diasDePeriodo: diasDePeriodo,
    inicioDePeriodo: inicioDePeriodo,
    SINONIMOS: SINONIMOS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MotorBusqueda;
  } else {
    raiz.MotorBusqueda = MotorBusqueda;
  }
})(typeof window !== 'undefined' ? window : globalThis);
