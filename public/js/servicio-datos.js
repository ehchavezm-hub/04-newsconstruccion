/*
 * SERVICIO DE DATOS
 * Decide de dónde salen los resultados. Hay tres formas de abrir la aplicación:
 *
 *   'servidor'  Con "npm start" (http://localhost:3000). Pregunta a /api/buscar y /api/semana.
 *   'web'       Publicada en internet como página estática (GitHub Pages). Usa:
 *                 - datos/ultima-semana.json (novedades de 7 días) y el archivo histórico:
 *                   datos/noticias-, papers- y libros-anio.json (último año, siempre) y
 *                   -historico.json (solo si se elige un período mayor); los actualiza
 *                   GitHub Actions cada 4 horas,
 *                 - las normas vigentes del catálogo (y los clásicos, si el período los abarca),
 *                 - y, al buscar, consulta directamente desde el navegador: GDELT (noticias de
 *                   3 meses), OpenAlex (papers de todo el mundo, solo revistas indexadas o de
 *                   editoriales de prestigio, y de autores del Perú), Crossref y Open Library.
 *   'archivo'   Abriendo index.html con doble clic. Solo el catálogo local.
 *
 * Todo resultado debe estar dentro del PERÍODO elegido (por defecto el último año; 2 a 5 años
 * o todo el tiempo) y RELACIONADO, directa o indirectamente, con los temas de js/temas.js.
 * Cada resultado queda marcado como 'nacional' (Perú) o 'internacional'.
 * La persona usuaria nunca ve estos detalles técnicos.
 */
(function (CG) {
  'use strict';

  // Versión de la web publicada: evita que el navegador use datos guardados de una versión anterior.
  var VERSION = window.CG_VERSION || '';
  function conVersion(url) { return VERSION ? url + '?v=' + encodeURIComponent(VERSION) : url; }

  var modoPromesa = null;
  var semanaPromesa = null;
  var colecciones = {}; // 'noticias-anio' -> Promise<Array>
  // Período elegido, en años (1 a 5; 0 = todo el tiempo). Por defecto, el último año.
  var periodo = window.MotorBusqueda.PERIODO_POR_DEFECTO;

  /** Conexión con tiempo máximo de espera. Devuelve el texto de la respuesta. */
  function traerTexto(url, ms) {
    var control = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (control) control.abort(); }, ms || 8000);
    return fetch(url, control ? { signal: control.signal } : {})
      .then(function (r) {
        clearTimeout(t);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }, function (e) { clearTimeout(t); throw e; });
  }

  function traer(url, ms) {
    return traerTexto(url, ms).then(function (t) { return JSON.parse(t); });
  }

  function modo() {
    if (!modoPromesa) {
      modoPromesa = !/^https?:$/.test(window.location.protocol)
        ? Promise.resolve('archivo')
        // En GitHub Pages no hay servidor: no hace falta preguntar.
        : /\.github\.io$/.test(window.location.hostname) ? Promise.resolve('web')
        : traer('api/estado', 3000)
          .then(function (d) { return d && d.ok ? 'servidor' : 'web'; })
          .catch(function () { return 'web'; });
    }
    return modoPromesa;
  }

  /** Marca cada documento como nacional o internacional. */
  function conAmbito(docs) {
    docs.forEach(function (d) { d.ambito = window.FuentesPrestigio.ambitoDe(d); });
    return docs;
  }

  /** Solo lo del período elegido, relacionado con los temas y que no es ruido. */
  function aptos(docs) {
    return window.MotorBusqueda.aptos(docs, new Date(), periodo);
  }

  /* ----------------------- Datos guardados ----------------------- */

  /** @returns {Promise<{generado: string|null, dias: number, fuentes: Array, resultados: Array}>} */
  function datosSemana() {
    if (!semanaPromesa) {
      semanaPromesa = modo().then(function (m) {
        if (m === 'archivo') return null;
        return traer(m === 'servidor' ? 'api/semana' : conVersion('datos/ultima-semana.json'), 20000);
      }).catch(function () { return null; }).then(function (d) {
        d = d || { generado: null, dias: 7, fuentes: [], resultados: [] };
        // Solo lo relacionado con los temas definidos (también si el archivo es de antes).
        d.resultados = conAmbito(d.resultados.filter(window.MotorBusqueda.esDeLosTemas));
        return d;
      });
    }
    return semanaPromesa;
  }

  /** Un archivo de public/datos/ (se descarga una sola vez). */
  function archivoGuardado(nombre) {
    if (!colecciones[nombre]) {
      colecciones[nombre] = modo().then(function (m) {
        return m === 'archivo' ? null : traer(conVersion('datos/' + nombre + '.json'), 30000);
      }).catch(function () { return null; }).then(function (d) {
        return conAmbito((d && d.resultados) || []);
      });
    }
    return colecciones[nombre];
  }

  /**
   * Noticias, papers o libros guardados: siempre lo del último año y, si se eligió un
   * período mayor, también el histórico (se descarga solo en ese caso).
   * @param {'noticias'|'papers'|'libros'} coleccion
   */
  function guardados(coleccion) {
    return Promise.all([
      archivoGuardado(coleccion + '-anio'),
      periodo === 1 ? [] : archivoGuardado(coleccion + '-historico')
    ]).then(function (r) { return r[0].concat(r[1]); });
  }

  /** Noticias del período elegido (pestaña «Últimas Noticias»), de la más reciente a la más antigua. */
  function noticias() {
    return Promise.all([datosSemana(), guardados('noticias')]).then(function (r) {
      var lista = r[0].resultados.filter(function (d) { return d.tipo === 'noticia'; }).concat(r[1]);
      return { generado: r[0].generado, resultados: unirResultados([aptos(lista)]) };
    });
  }

  /**
   * Novedades de los últimos 7 días, opcionalmente filtradas por tema e idioma.
   * @param {{consulta?: string, idioma?: 'todos'|'es', ahora?: Date}} op
   */
  function semana(op) {
    op = op || {};
    return datosSemana().then(function (d) {
      var ahora = op.ahora || new Date();
      var limite = ahora.getTime() - (d.dias || 7) * 86400000;
      var lista = d.resultados.filter(function (x) {
        var t = Date.parse(x.fecha);
        return !isNaN(t) && t >= limite;
      });
      if (op.idioma === 'es') lista = lista.filter(function (x) { return x.idioma === 'es'; });
      if (op.consulta || op.terminos) lista = window.MotorBusqueda.buscar(lista, { consulta: op.consulta, terminos: op.terminos });
      return { generado: d.generado, dias: d.dias || 7, fuentes: d.fuentes, resultados: window.MotorBusqueda.ordenarPorFecha(lista) };
    });
  }

  /* ------------------------------ Búsqueda ------------------------------ */

  function temaDe(terminos) {
    var tema = null;
    window.Temas.grupos.forEach(function (g) {
      g.temas.forEach(function (t) { if (t.terminos === terminos) tema = t; });
    });
    return tema;
  }

  /** Para Crossref y Open Library: la consulta académica del tema, o lo que escribió la persona. */
  function consultaAcademica(consulta, terminos) {
    var tema = terminos && temaDe(terminos);
    return tema ? tema.academica : consulta;
  }

  /** Para OpenAlex: las frases del tema, o lo que escribió la persona. */
  function consultaOpenAlex(consulta, terminos) {
    var tema = terminos && temaDe(terminos);
    return tema ? tema.openalex : consulta;
  }

  function buscarNoticias(consulta, terminos) {
    var url = window.Gdelt.construirUrl(consulta, { terminos: terminos });
    if (!url) return Promise.resolve([]);
    // GDELT puede tardar 10-20 segundos en responder.
    return traerTexto(url, 30000).then(window.Gdelt.interpretar).catch(function () { return []; });
  }

  function buscarPapers(consulta, consultaOpenAlex) {
    var desde = window.MotorBusqueda.inicioDePeriodo(periodo);
    var abrir = function (url) {
      return url ? traer(url, 20000).then(window.OpenAlex.interpretar).catch(function () { return []; }) : [];
    };
    return Promise.all([
      // OpenAlex: todo el mundo (solo revistas indexadas o editoriales de prestigio) y autores del Perú.
      abrir(window.OpenAlex.construirUrl({ consulta: consultaOpenAlex, desde: desde })),
      abrir(window.OpenAlex.construirUrl({ consulta: consultaOpenAlex, desde: desde, pais: 'PE' })),
      // Crossref: todas las revistas y congresos de las editoriales de prestigio.
      traer(window.Crossref.construirUrl({ consulta: consulta, desde: desde, filas: 40 }), 15000)
        .then(window.Crossref.interpretar).catch(function () { return []; })
    ]).then(function (r) { return r[0].concat(r[1], r[2]); });
  }

  function buscarLibros(consulta) {
    // Crossref (libros de editoriales académicas) y Open Library. Google Books no se usa en el
    // navegador: rechaza consultas sin clave por límite de uso.
    var desde = window.MotorBusqueda.inicioDePeriodo(periodo);
    return Promise.all([
      traer(window.Crossref.construirUrl({ consulta: consulta, libros: true, desde: desde, filas: 30 }), 15000)
        .then(window.Crossref.interpretar).catch(function () { return []; }),
      traer(window.Libros.urlOpenLibrary(consulta), 12000)
        .then(function (j) { return window.Libros.interpretarOpenLibrary(j); }).catch(function () { return []; })
    ]).then(function (r) { return r[0].concat(r[1]); });
  }

  /** Quita títulos repetidos y ordena de lo más reciente a lo más antiguo. */
  function unirResultados(listas) {
    var vistos = {};
    var todos = [].concat.apply([], listas).filter(function (d) {
      var clave = window.MotorBusqueda.normalizar(d.titulo);
      if (vistos[clave]) return false;
      vistos[clave] = true;
      return true;
    });
    return window.MotorBusqueda.ordenarPorFecha(conAmbito(todos));
  }

  /**
   * Búsqueda en dos pasos, para no hacer esperar:
   *   1) Enseguida: lo guardado del período elegido (semana, archivo de noticias, papers y
   *      libros, y normas vigentes del catálogo).
   *   2) Después: lo que llega de internet (GDELT, OpenAlex, Crossref, Open Library), en `masResultados`.
   * Todo pasa por el mismo filtro: del período elegido y relacionado con los temas definidos.
   */
  function buscarSinServidor(opciones, m) {
    var tipo = opciones.tipo || 'todos';
    var consulta = opciones.consulta || '';
    var terminos = opciones.terminos || null;
    var enVivo = consulta && m === 'web';
    var quiere = function (t) { return tipo === 'todos' || tipo === t || (t === 'paper' && tipo === 'norma'); };
    var Motor = window.MotorBusqueda;

    return Promise.all([
      datosSemana(),
      quiere('noticia') ? guardados('noticias') : [],
      quiere('paper') ? guardados('papers') : [],
      quiere('libro') ? guardados('libros') : []
    ]).then(function (r) {
      // Del catálogo local quedan las normas vigentes y, si el período lo abarca, los clásicos.
      var todo = r[0].resultados.concat(r[1], r[2], r[3], window.CATALOGO_CONSTRUCCION);
      var listos = unirResultados([Motor.buscar(aptos(todo), opciones)]);

      var masResultados = null;
      if (enVivo) {
        masResultados = Promise.resolve().then(function () { return Promise.all([
          quiere('noticia') ? buscarNoticias(consulta, terminos) : [],
          quiere('paper') ? buscarPapers(consultaAcademica(consulta, terminos), consultaOpenAlex(consulta, terminos)) : [],
          quiere('libro') ? buscarLibros(consultaAcademica(consulta, terminos)) : []
        ]); }).then(function (v) {
          var enLinea = aptos(v[0].concat(v[1], v[2])).filter(function (d) { return Motor.coincideTipo(d.tipo, tipo); });
          // Lo que llega por un texto libre también debe coincidir con lo que se escribió.
          if (!terminos) enLinea = Motor.buscar(enLinea, { consulta: consulta });
          return unirResultados([listos, enLinea]);
        }).catch(function () { return listos; });
      }
      return { resultados: listos, avisos: [], modo: m, masResultados: masResultados };
    });
  }

  /**
   * @param {{consulta: string, tipo: string, terminos?: string[]}} opciones
   * @returns {Promise<{resultados: Array, avisos: string[], modo: string}>}
   */
  function buscar(opciones) {
    return modo().then(function (m) {
      if (m !== 'servidor') return buscarSinServidor(opciones, m);
      var url = 'api/buscar?q=' + encodeURIComponent(opciones.consulta || '') +
                '&tipo=' + encodeURIComponent(opciones.tipo || 'todos') + '&p=' + periodo +
                (opciones.terminos ? '&t=' + encodeURIComponent(opciones.terminos.join('|')) : '');
      return traer(url, 40000)
        .then(function (d) { return { resultados: conAmbito(d.resultados), avisos: d.avisos || [], modo: m }; })
        .catch(function () { return buscarSinServidor(opciones, 'web'); });
    });
  }

  var modoActual = null;
  modo().then(function (m) { modoActual = m; });

  /** Dirección para descargar un documento con un clic. */
  function urlDescarga(doc) {
    if (!doc.descarga) return null;
    return modoActual === 'servidor' ? 'api/descargar/' + encodeURIComponent(doc.id) : doc.descarga.url;
  }

  CG.Datos = {
    modo: modo,
    buscar: buscar,
    semana: semana,
    noticias: noticias,
    periodo: function () { return periodo; },
    fijarPeriodo: function (anios) { periodo = anios; },
    urlDescarga: urlDescarga,
    hayServidor: function () { return modoActual === 'servidor'; }
  };
})(window.CG = window.CG || {});
