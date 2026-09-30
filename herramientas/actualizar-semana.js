/*
 * ACTUALIZAR LOS DATOS DE LA WEB PUBLICADA
 * Consulta las fuentes y guarda en public/datos/:
 *   - ultima-semana.json                  novedades de los últimos 7 días
 *   - noticias-anio.json / -historico.json  noticias por tema (Perú y mundo) de todo internet,
 *                                         solo de fuentes selectas
 *   - papers-anio.json / -historico.json    papers de todo el mundo (OpenAlex), solo de revistas
 *                                         indexadas o editoriales de prestigio, y de autores peruanos
 *   - libros-anio.json / -historico.json    libros de editoriales de prestigio (Crossref, Open Library)
 * Todo se limita a lo relacionado, directa o indirectamente, con los temas de public/js/temas.js.
 *
 * Archivo histórico: cada actualización suma lo nuevo a lo ya publicado en la web. Se consulta
 * siempre el último año y, además, una ventana más antigua que rota (servidor/ventanas.js).
 * Para llenarlo todo de una vez:   VENTANAS=todas npm run actualizar
 *
 * Lo ejecuta GitHub Actions cada 4 horas (.github/workflows/publicar.yml).
 * Nunca termina con error: si una fuente falla, se omite y se informa.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Temas = require('../public/js/temas.js');
const { obtenerSemana } = require('../servidor/semana');
const { ventanasDeHoy } = require('../servidor/ventanas');
const noticiasGoogle = require('../servidor/fuentes/noticias-google');
const openalex = require('../servidor/fuentes/openalex');
const libros = require('../servidor/fuentes/libros-recientes');
const archivo = require('../servidor/archivo');

const CARPETA = path.join(__dirname, '..', 'public', 'datos');
const SEMANA = path.join(CARPETA, 'ultima-semana.json');
// Dirección de la web publicada, de donde se descarga el archivo anterior.
const PUBLICADO = process.env.DATOS_PUBLICADOS || 'https://ehchavezm-hub.github.io/04-newsconstruccion/datos/';
// Archivos de versiones anteriores de la aplicación (se leen una vez para no perder nada).
const ANTIGUOS = { noticias: 'noticias-archivo.json', papers: 'papers-recientes.json', libros: 'libros-recientes.json' };
const TIPO = { noticias: 'noticia', papers: 'paper', libros: 'libro' };
const ESPERA_MS = 20000;
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
// Temas y búsquedas adicionales (gestión contractual, reajustes, impactos, riesgos…).
const temas = Temas.consultas;

function informar(fuentes) {
  for (const f of fuentes) {
    console.log(`  ${f.ok ? '✔' : '✘'} ${f.fuente}: ${f.ok ? f.cantidad : 'no respondió'}`);
  }
}

/** No reemplaza datos buenos por una lista vacía (por ejemplo, si internet falló). */
function guardar(destino, datos, cantidad) {
  if (!cantidad && fs.existsSync(destino)) {
    try {
      const anterior = JSON.parse(fs.readFileSync(destino, 'utf8'));
      if ((anterior.resultados || []).length) {
        console.log('  Sin resultados nuevos: se conservan los datos anteriores de', path.basename(destino));
        return;
      }
    } catch { /* archivo dañado: se reemplaza */ }
  }
  fs.writeFileSync(destino, JSON.stringify(datos) + '\n');
  console.log(`  Guardado ${path.basename(destino)} (${cantidad})`);
}

async function leerJson(nombre) {
  const listas = [];
  try {
    const r = await fetch(PUBLICADO + nombre, { signal: AbortSignal.timeout(30000) });
    if (r.ok) listas.push(...((await r.json()).resultados || []));
  } catch { /* primera vez o sin conexión */ }
  try {
    listas.push(...(JSON.parse(fs.readFileSync(path.join(CARPETA, nombre), 'utf8')).resultados || []));
  } catch { /* sin archivo local */ }
  return listas;
}

/** Lo ya publicado de una colección (último año + histórico + archivos antiguos). */
async function anteriores(coleccion) {
  const partes = await Promise.all([
    leerJson(`${coleccion}-anio.json`), leerJson(`${coleccion}-historico.json`), leerJson(ANTIGUOS[coleccion])
  ]);
  return partes.flat();
}

/** Une lo anterior con lo nuevo y guarda las dos partes. */
async function guardarColeccion(coleccion, nuevas, fuentes) {
  const previas = await anteriores(coleccion);
  const todas = archivo.unir(previas, nuevas, new Date(), archivo.MAXIMOS[TIPO[coleccion]]);
  const { anio, historico } = archivo.dividir(todas);
  const nacionales = todas.filter((d) => d.ambito === 'nacional').length;
  console.log(`${coleccion}: ${previas.length} anteriores + ${nuevas.length} nuevas = ${todas.length} ` +
    `(${anio.length} del último año, ${historico.length} anteriores; ${nacionales} nacionales).`);
  const generado = new Date().toISOString();
  guardar(path.join(CARPETA, `${coleccion}-anio.json`), { generado, parte: 'anio', fuentes, resultados: anio }, anio.length);
  guardar(path.join(CARPETA, `${coleccion}-historico.json`), { generado, parte: 'historico', resultados: historico }, historico.length);
}

/**
 * Consulta una función para cada tema y ventana, de una en una, con dos protecciones:
 *   - un tiempo máximo (lo reunido hasta entonces se guarda igual), y
 *   - si la fuente falla varias veces seguidas (por ejemplo, porque limita las consultas),
 *     se deja de consultar para no perder el tiempo.
 */
async function porTemas(ventanas, pausaMs, consulta, { maximoMs = 8 * 60000, fallosSeguidos = 6 } = {}) {
  const docs = [];
  const inicio = Date.now();
  let ok = 0;
  let total = 0;
  let fallos = 0;
  for (const ventana of ventanas) {
    for (const tema of temas) {
      if (Date.now() - inicio > maximoMs || fallos >= fallosSeguidos) {
        return { docs, ok, total, cortado: fallos >= fallosSeguidos ? 'la fuente dejó de responder' : 'se agotó el tiempo' };
      }
      total++;
      try {
        docs.push(...await consulta(tema, ventana));
        ok++;
        fallos = 0;
      } catch {
        fallos++;
      }
      await esperar(pausaMs);
    }
  }
  return { docs, ok, total };
}

function textoConsultas(r) {
  return `${r.ok} de ${r.total} consultas${r.cortado ? `; se detuvo porque ${r.cortado}` : ''}`;
}

(async () => {
  const ventanas = ventanasDeHoy();
  console.log('Ventanas de esta actualización:', ventanas.map((v) => v.etiqueta).join(', '));

  // 1) Novedades de la semana (RSS de medios, instituciones y revistas núcleo).
  let semana = { resultados: [] };
  try {
    semana = await obtenerSemana({ esperaMs: ESPERA_MS });
    const nacionales = semana.resultados.filter((d) => d.ambito === 'nacional').length;
    console.log(`Novedades de los últimos ${semana.dias} días: ${semana.resultados.length} ` +
      `(${nacionales} nacionales, ${semana.resultados.length - nacionales} internacionales).`);
    informar(semana.fuentes);
    guardar(SEMANA, semana, semana.resultados.length);
  } catch (e) {
    console.error('No se pudieron actualizar las novedades:', e.message);
  }

  // 2) Papers de todo el mundo (OpenAlex, solo fuentes selectas) y de autores peruanos.
  try {
    const mundo = await porTemas(ventanas, 300, (t, v) => openalex.buscarTema(t, v, null, 15000), { maximoMs: 6 * 60000 });
    const peru = await porTemas(ventanas, 300, (t, v) => openalex.buscarTema(t, v, 'PE', 15000), { maximoMs: 5 * 60000 });
    const fuentes = [
      { fuente: `Papers — OpenAlex, mundo (${textoConsultas(mundo)})`, ok: mundo.ok > 0, cantidad: mundo.docs.length },
      { fuente: `Papers — OpenAlex, autores del Perú (${textoConsultas(peru)})`, ok: peru.ok > 0, cantidad: peru.docs.length }
    ];
    informar(fuentes);
    const deLaSemana = semana.resultados.filter((d) => d.tipo === 'paper');
    await guardarColeccion('papers', [...deLaSemana, ...mundo.docs, ...peru.docs], fuentes);
  } catch (e) {
    console.error('No se pudieron actualizar los papers:', e.message);
  }

  // 3) Libros de editoriales de prestigio.
  try {
    const r = await libros.obtenerPorVentanas(ventanas, { esperaMs: 15000, maximoMs: 5 * 60000 });
    informar(r.informe);
    await guardarColeccion('libros', r.libros, r.informe);
  } catch (e) {
    console.error('No se pudieron actualizar los libros:', e.message);
  }

  // 4) Noticias por tema en todo internet (fuentes selectas), del Perú y del mundo.
  //    Google Noticias limita las consultas seguidas: pausas largas, espera corta y corte si falla.
  try {
    const nac = await porTemas(ventanas, 2000, (t, v) => noticiasGoogle.buscarTema(t, 'nacional', v, 8000), { maximoMs: 6 * 60000, fallosSeguidos: 4 });
    const int = await porTemas(ventanas, 2000, (t, v) => noticiasGoogle.buscarTema(t, 'internacional', v, 8000), { maximoMs: 5 * 60000, fallosSeguidos: 4 });
    const fuentes = [
      { fuente: `Noticias por tema — Perú (${textoConsultas(nac)})`, ok: nac.ok > 0, cantidad: nac.docs.length },
      { fuente: `Noticias por tema — mundo (${textoConsultas(int)})`, ok: int.ok > 0, cantidad: int.docs.length }
    ];
    informar(fuentes);
    const deLaSemana = semana.resultados.filter((d) => d.tipo === 'noticia');
    await guardarColeccion('noticias', [...deLaSemana, ...nac.docs, ...int.docs], fuentes);
  } catch (e) {
    console.error('No se pudieron actualizar las noticias por tema:', e.message);
  }
})();
