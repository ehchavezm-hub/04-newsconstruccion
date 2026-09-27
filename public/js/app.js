/*
 * APLICACIÓN PRINCIPAL
 * Une todas las piezas: menú, buscador, novedades de la semana, filtros, voz,
 * tamaño de letra y ayuda.
 */
(function (CG) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var SECCIONES = ['buscar', 'noticias', 'papers', 'libros'];
  var TIPO_DE_SECCION = { papers: 'paper', libros: 'libro' };
  var NOMBRE_TIPO = { todos: '', noticia: ' en Noticias', paper: ' en Papers', libro: ' en Libros' };
  var cargadas = {};
  var vista = 'busqueda'; // 'busqueda' o 'semana': qué se muestra en la zona de resultados
  var turnoBusqueda = 0;  // evita que una respuesta lenta reemplace a una búsqueda más nueva
  var temaActivo = null;  // tema sugerido elegido (busca cualquiera de sus términos)

  /** Términos del tema activo, solo si la caja sigue mostrando su nombre. */
  function terminosActivos() {
    return temaActivo && $('caja-busqueda').value.trim() === temaActivo.etiqueta ? temaActivo.terminos : null;
  }

  /** Dibuja los botones de temas sugeridos, agrupados (desde js/temas.js). */
  function dibujarTemas() {
    var contenedor = $('sugerencias');
    window.Temas.grupos.forEach(function (g) {
      var grupo = document.createElement('div');
      grupo.className = 'grupo-temas';
      grupo.setAttribute('data-grupo', g.id);
      grupo.setAttribute('role', 'group');
      var titulo = document.createElement('h3');
      titulo.className = 'titular t-h2';
      var icono = document.createElement('span');
      icono.setAttribute('aria-hidden', 'true');
      icono.textContent = g.icono;
      titulo.appendChild(icono);
      titulo.appendChild(document.createTextNode(g.titulo));
      titulo.id = 'grupo-' + g.id;
      grupo.setAttribute('aria-labelledby', titulo.id);
      grupo.appendChild(titulo);
      if (g.nota) {
        // Nota breve bajo el título (por ejemplo, que las etapas siguen el orden del proyecto).
        var nota = document.createElement('p');
        nota.className = 't-nota nota-grupo';
        nota.id = 'nota-' + g.id;
        nota.textContent = g.nota;
        grupo.setAttribute('aria-describedby', nota.id);
        grupo.appendChild(nota);
      }
      var botones = document.createElement('div');
      botones.className = 'lista-temas';
      g.temas.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sugerencia';
        b.setAttribute('data-tema', t.id);
        b.setAttribute('aria-pressed', 'false');
        b.textContent = t.etiqueta;
        botones.appendChild(b);
      });
      grupo.appendChild(botones);
      if (g.siglas) {
        // Significado de las siglas que aparecen en los temas del grupo.
        var siglas = document.createElement('p');
        siglas.className = 't-nota siglas-grupo';
        siglas.textContent = 'Siglas: ' + g.siglas + '.';
        grupo.appendChild(siglas);
      }
      contenedor.appendChild(grupo);
    });
  }

  function marcarTema() {
    var activo = terminosActivos() ? temaActivo.id : null;
    document.querySelectorAll('.sugerencia').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-tema') === activo));
    });
  }

  var acciones = {
    alDescargar: function () {
      CG.Interfaz.avisar(CG.Datos.hayServidor()
        ? '¡Descarga iniciada con éxito! Encontrará el archivo en su carpeta «Descargas».'
        : '¡Descarga iniciada con éxito! Si el documento se abre en una pestaña nueva, pulse el botón de descarga del navegador para guardarlo.');
    },
    alCompartir: function () {
      CG.Interfaz.avisar('Abriendo WhatsApp… elija a quién enviarlo.');
    }
  };

  /* ------------------------------ Utilidades ------------------------------ */
  function tipoElegido() {
    var marcado = document.querySelector('input[name="tipo"]:checked');
    return marcado ? marcado.value : 'todos';
  }

  function idiomaElegido() {
    var marcado = document.querySelector('input[name="idioma"]:checked');
    return marcado ? marcado.value : 'todos';
  }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function fechaCorta(d) {
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
                 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return d.getDate() + ' de ' + meses[d.getMonth()];
  }

  function mostrarAvisoServidor(respuesta) {
    var aviso = $('aviso-modo');
    if (respuesta.avisos && respuesta.avisos.length) {
      aviso.textContent = 'Algunas fuentes no respondieron en este momento. Le mostramos lo que tenemos guardado; puede intentarlo de nuevo más tarde.';
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }
  }

  /* ------------------------------ Búsqueda ------------------------------ */
  function buscar() {
    vista = 'busqueda';
    $('filtro-idioma').hidden = true;
    var consulta = $('caja-busqueda').value.trim();
    var tipo = tipoElegido();
    var zona = $('zona-buscar');
    var estado = $('estado-buscar');
    var turno = ++turnoBusqueda;
    CG.Interfaz.mostrarCargandoZona(zona, estado);
    if (consulta) estado.textContent = 'Buscando «' + consulta + '» en las fuentes de prestigio… un momento, por favor.';

    function mostrar(resultados, buscandoMas) {
      var n = resultados.length;
      var mensaje;
      if (!n && buscandoMas) {
        mensaje = 'Buscando «' + consulta + '» en medios especializados y agencias de prestigio… puede tardar unos segundos.';
      } else if (!n) {
        mensaje = 'No encontramos resultados para «' + consulta + '»' + NOMBRE_TIPO[tipo] +
                  '. Pruebe con otras palabras, elija «Todos» o pulse uno de los temas sugeridos.';
      } else if (consulta) {
        mensaje = 'Encontramos ' + plural(n, 'resultado', 'resultados') + ' para «' + consulta + '»' + NOMBRE_TIPO[tipo] + '.';
      } else {
        mensaje = plural(n, 'publicación', 'publicaciones') + NOMBRE_TIPO[tipo] +
                  '. Escriba un tema para buscar algo concreto.';
      }
      var sobre = consulta ? ' sobre «' + consulta + '»' : '';
      CG.Interfaz.mostrarPorAmbito(zona, estado, resultados, mensaje, acciones, {
        vacioNacional: 'No encontramos publicaciones nacionales' + sobre + '.',
        vacioInternacional: 'No encontramos publicaciones internacionales' + sobre + '.'
      });
      if (buscandoMas) {
        if (n) estado.textContent += ' Seguimos buscando más en medios especializados y agencias de prestigio…';
        estado.classList.add('cargando');
      }
      if (consulta && !buscandoMas && (tipo === 'todos' || tipo === 'noticia')) {
        var t = terminosActivos();
        // Para un tema, se buscan en Google Noticias sus tres términos principales.
        zona.appendChild(enlaceGoogleNoticias(consulta, t ? t.slice(0, 3).map(function (x) { return '"' + x.trim() + '"'; }).join(' OR ') : null));
      }
    }

    marcarTema();
    CG.Datos.buscar({ consulta: consulta, tipo: tipo, terminos: terminosActivos() }).then(function (r) {
      if (turno !== turnoBusqueda) return; // llegó una búsqueda más nueva
      mostrarAvisoServidor(r);
      // Paso 1: lo guardado, enseguida (ya viene de lo más reciente a lo más antiguo).
      mostrar(r.resultados, !!r.masResultados);
      // Paso 2: lo que llega de internet unos segundos después.
      if (r.masResultados) {
        r.masResultados.then(function (todos) {
          if (turno === turnoBusqueda) mostrar(todos, false);
        }, function () {
          if (turno === turnoBusqueda) mostrar(r.resultados, false);
        });
      }
    }).catch(function () {
      // Si algo inesperado falla, nunca dejar a la persona esperando.
      if (turno !== turnoBusqueda) return;
      estado.classList.remove('cargando');
      estado.textContent = 'No pudimos completar la búsqueda en este momento. Por favor, inténtelo de nuevo.';
    });
  }

  // Sitios de prestigio para la búsqueda de respaldo en Google Noticias (máximo ~10 por el límite de Google).
  var SITIOS_RESPALDO = ['elcomercio.pe', 'gestion.pe', 'andina.pe', 'rpp.pe', 'larepublica.pe', 'enr.com',
                         'constructiondive.com', 'globalconstructionreview.com', 'reuters.com', 'bnamericas.com'];

  /** Enlace para seguir buscando el tema en Google Noticias, solo en medios de prestigio. */
  function enlaceGoogleNoticias(consulta, consultaGoogle) {
    var sitios = SITIOS_RESPALDO.map(function (s) { return 'site:' + s; }).join(' OR ');
    var url = 'https://news.google.com/search?' + new URLSearchParams({
      q: '(' + (consultaGoogle || consulta) + ') (' + sitios + ')', hl: 'es-419', gl: 'PE', ceid: 'PE:es-419'
    }).toString();
    var caja = document.createElement('p');
    caja.className = 'busqueda-respaldo';
    caja.appendChild(document.createTextNode('¿No encuentra lo que busca? '));
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Buscar «' + consulta + '» en Google Noticias (solo medios de prestigio)';
    caja.appendChild(a);
    return caja;
  }

  /* ---------------------- Novedades de la última semana ---------------------- */
  function verSemana() {
    vista = 'semana';
    $('filtro-idioma').hidden = false;
    $('aviso-modo').hidden = true;
    var consulta = $('caja-busqueda').value.trim();
    var tipo = tipoElegido();
    var zona = $('zona-buscar');
    var estado = $('estado-buscar');
    var turno = ++turnoBusqueda;
    CG.Interfaz.mostrarCargandoZona(zona, estado);
    estado.textContent = 'Buscando las novedades de la última semana… un momento, por favor.';

    marcarTema();
    CG.Datos.semana({ consulta: consulta, terminos: terminosActivos(), idioma: idiomaElegido() }).then(function (r) {
      if (turno !== turnoBusqueda) return;
      var resultados = r.resultados.filter(function (d) { return tipo === 'todos' || d.tipo === tipo; });
      var sobre = consulta ? ' sobre «' + consulta + '»' : '';
      var hasta = new Date();
      var desde = new Date(hasta.getTime() - r.dias * 86400000);
      var periodo = ' (del ' + fechaCorta(desde) + ' al ' + fechaCorta(hasta) + ')';
      var mensaje;

      if (!r.generado) {
        mensaje = 'En este momento no podemos consultar las novedades. Por favor, inténtelo de nuevo en unos minutos.';
      } else if (!resultados.length) {
        mensaje = 'No encontramos novedades' + sobre + NOMBRE_TIPO[tipo] + ' en los últimos ' + r.dias + ' días. ' +
                  (consulta ? 'Pruebe con otro tema, o borre la caja de búsqueda para ver todas las novedades.' : 'Elija «Todos» para ver más.');
      } else {
        var fuentes = {};
        resultados.forEach(function (d) { fuentes[d.fuente] = true; });
        mensaje = 'Novedades de los últimos ' + r.dias + ' días' + periodo + sobre + NOMBRE_TIPO[tipo] + ': ' +
                  plural(resultados.length, 'publicación', 'publicaciones') + ' de ' +
                  plural(Object.keys(fuentes).length, 'fuente de prestigio', 'fuentes de prestigio') + '.';
      }
      CG.Interfaz.mostrarPorAmbito(zona, estado, resultados, mensaje, acciones, {
        vacioNacional: 'No hay novedades nacionales' + sobre + ' en estos días.',
        vacioInternacional: 'No hay novedades internacionales' + sobre + ' en estos días.'
      });
    });
  }

  function mostrarActualizacion() {
    CG.Datos.semana().then(function (r) {
      if (!r.generado) return;
      var d = new Date(r.generado);
      var hora = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      var dia = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      $('pie-actualizado').textContent = 'Novedades actualizadas por última vez el ' +
        CG.Interfaz.formatearFecha(dia) + ' a las ' + hora + '.';
    });
  }

  /* ------------------------------ Secciones ------------------------------ */
  function cargarNoticias() {
    var zona = $('zona-noticias');
    var estado = $('estado-noticias');
    CG.Interfaz.mostrarCargandoZona(zona, estado);
    CG.Datos.semana().then(function (r) {
      var noticias = r.resultados.filter(function (d) { return d.tipo === 'noticia'; });
      if (noticias.length) {
        CG.Interfaz.mostrarPorAmbito(zona, estado, noticias,
          plural(noticias.length, 'noticia', 'noticias') + ' de los últimos ' + r.dias + ' días.', acciones);
        return;
      }
      // Sin conexión con las fuentes: se muestran textos explicativos de ejemplo.
      var ejemplos = window.CATALOGO_CONSTRUCCION.filter(function (d) { return d.tipo === 'noticia'; });
      CG.Interfaz.mostrarPorAmbito(zona, estado, ejemplos,
        'En este momento no podemos traer las noticias del día. Mientras tanto, le dejamos estos textos que explican temas del sector.', acciones);
    });
  }

  function cargarSeccion(seccion) {
    if (cargadas[seccion]) return;
    cargadas[seccion] = true;
    if (seccion === 'noticias') { cargarNoticias(); return; }

    var lista = $('lista-' + seccion);
    var estado = $('estado-' + seccion);
    CG.Interfaz.mostrarCargando(lista, estado);
    CG.Datos.buscar({ consulta: '', tipo: TIPO_DE_SECCION[seccion] }).then(function (r) {
      var resultados = r.resultados; // de lo más reciente a lo más antiguo
      CG.Interfaz.mostrarResultados(lista, estado, resultados,
        plural(resultados.length, 'documento', 'documentos') + ', del más reciente al más antiguo.', acciones);
    });
  }

  /* --------------------------- Navegación --------------------------- */
  function seccionActual() {
    var s = window.location.hash.replace('#', '');
    return SECCIONES.indexOf(s) > -1 ? s : 'buscar';
  }

  function mostrarSeccion(moverFoco) {
    var actual = seccionActual();
    document.querySelectorAll('main section[data-seccion]').forEach(function (s) {
      s.hidden = s.getAttribute('data-seccion') !== actual;
    });
    document.querySelectorAll('.pestana').forEach(function (p) {
      if (p.getAttribute('data-seccion') === actual) p.setAttribute('aria-current', 'page');
      else p.removeAttribute('aria-current');
    });
    if (actual !== 'buscar') cargarSeccion(actual);
    if (moverFoco) $('titulo-' + actual).focus();
  }

  /* ------------------------- Tamaño de letra ------------------------- */
  var ESCALAS = [0.9, 1, 1.15, 1.3, 1.5];
  var nivel = 1;

  function aplicarEscala() {
    document.documentElement.style.setProperty('--escala', ESCALAS[nivel]);
    $('btn-letra-menos').disabled = nivel === 0;
    $('btn-letra-mas').disabled = nivel === ESCALAS.length - 1;
    try { localStorage.setItem('cg-escala', String(nivel)); } catch (e) { /* sin almacenamiento */ }
  }

  function cambiarEscala(paso) {
    nivel = Math.max(0, Math.min(ESCALAS.length - 1, nivel + paso));
    aplicarEscala();
    CG.Interfaz.avisar(paso > 0 ? 'Letra más grande' : 'Letra más pequeña');
  }

  /* ----------------------------- Inicio ----------------------------- */
  function iniciar() {
    try {
      var guardado = parseInt(localStorage.getItem('cg-escala'), 10);
      if (!isNaN(guardado) && ESCALAS[guardado]) nivel = guardado;
    } catch (e) { /* sin almacenamiento */ }
    aplicarEscala();

    $('formulario-busqueda').addEventListener('submit', function (e) {
      e.preventDefault();
      buscar();
    });

    $('btn-semana').addEventListener('click', function () {
      verSemana();
      $('estado-buscar').scrollIntoView({ block: 'start' });
    });

    // Al cambiar un filtro se repite lo que se estaba viendo.
    document.querySelectorAll('input[name="tipo"]').forEach(function (radio) {
      radio.addEventListener('change', function () { (vista === 'semana' ? verSemana : buscar)(); });
    });
    document.querySelectorAll('input[name="idioma"]').forEach(function (radio) {
      radio.addEventListener('change', verSemana);
    });

    dibujarTemas();
    $('sugerencias').addEventListener('click', function (e) {
      var boton = e.target.closest('.sugerencia');
      if (!boton) return;
      temaActivo = window.Temas.porId(boton.getAttribute('data-tema'));
      $('caja-busqueda').value = temaActivo.etiqueta;
      buscar();
      $('estado-buscar').scrollIntoView({ block: 'start' });
    });

    CG.Voz.iniciar({
      boton: $('btn-voz'),
      textoBoton: $('texto-btn-voz'),
      estado: $('estado-voz'),
      alReconocer: function (texto) {
        $('caja-busqueda').value = texto;
        buscar();
      }
    });

    $('btn-letra-mas').addEventListener('click', function () { cambiarEscala(1); });
    $('btn-letra-menos').addEventListener('click', function () { cambiarEscala(-1); });
    $('btn-ayuda').addEventListener('click', function () { $('dialogo-ayuda').showModal(); });

    window.addEventListener('hashchange', function () { mostrarSeccion(true); });
    mostrarSeccion(false);
    mostrarActualizacion();

    // Al abrir la página se muestra todo, de lo más reciente a lo más antiguo.
    buscar();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})(window.CG = window.CG || {});
