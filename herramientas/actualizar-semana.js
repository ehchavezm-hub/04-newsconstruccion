/*
 * ACTUALIZAR LOS DATOS DE LA WEB PUBLICADA
 * Consulta las fuentes de prestigio y guarda:
 *   - public/datos/ultima-semana.json     novedades de los últimos 7 días (nacional e internacional)
 *   - public/datos/papers-recientes.json  papers de los últimos 12 meses de cada tema, en todas las
 *                                        revistas y congresos de las editoriales académicas de prestigio
 *   - public/datos/libros-recientes.json  libros de los últimos 12 meses de cada tema, de editoriales de prestigio
 * Todo se limita a lo relacionado, directa o indirectamente, con los temas de public/js/temas.js.
 *   - public/datos/noticias-archivo.json  todas las noticias de los últimos 90 días (para el buscador).
 *     Se construye sumando las noticias nuevas al archivo ya publicado en la web.
 *
 * Lo ejecuta GitHub Actions automáticamente varias veces al día
 * (.github/workflows/publicar.yml). También puede ejecutarse a mano:
 *     npm run actualizar
 *
 * Nunca termina con error: si una fuente falla, se omite y se informa.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { obtenerSemana } = require('../servidor/semana');
const { obtenerRecientes } = require('../servidor/fuentes/libros-recientes');
const crossref = require('../servidor/fuentes/crossref');
const archivo = require('../servidor/archivo');

const CARPETA = path.join(__dirname, '..', 'public', 'datos');
const SEMANA = path.join(CARPETA, 'ultima-semana.json');
const LIBROS = path.join(CARPETA, 'libros-recientes.json');
const PAPERS = path.join(CARPETA, 'papers-recientes.json');
const ARCHIVO = path.join(CARPETA, 'noticias-archivo.json');
// Archivo ya publicado, al que se suman las noticias nuevas.
const ARCHIVO_PUBLICADO = process.env.ARCHIVO_PUBLICADO ||
  'https://ehchavezm-hub.github.io/04-newsconstruccion/datos/noticias-archivo.json';

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
        console.log('  Sin resultados nuevos: se conservan los datos anteriores.');
        return;
      }
    } catch { /* archivo dañado: se reemplaza */ }
  }
  fs.writeFileSync(destino, JSON.stringify(datos, null, 1) + '\n');
  console.log('  Guardado en', path.relative(process.cwd(), destino));
}

async function archivoAnterior() {
  const listas = [];
  try {
    const r = await fetch(ARCHIVO_PUBLICADO, { signal: AbortSignal.timeout(20000) });
    if (r.ok) listas.push(...((await r.json()).resultados || []));
  } catch { /* primera vez o sin conexión */ }
  try {
    listas.push(...(JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')).resultados || []));
  } catch { /* sin archivo local */ }
  return listas;
}

(async () => {
  let papers = [];
  try {
    const r = await crossref.obtenerRecientes({ esperaMs: 20000 });
    papers = r.papers;
    console.log(`Papers de los últimos 12 meses sobre los temas: ${papers.length}.`);
    informar(r.informe);
    guardar(PAPERS, { generado: new Date().toISOString(), meses: 12, fuentes: r.informe, resultados: papers }, papers.length);
  } catch (e) {
    console.error('No se pudieron actualizar los papers recientes:', e.message);
  }

  try {
    const semana = await obtenerSemana({ esperaMs: 20000, papersExtra: papers });
    const anteriores = await archivoAnterior();
    const unidas = archivo.unir(anteriores, semana.resultados.filter((d) => d.tipo === 'noticia'));
    console.log(`Archivo de noticias (${archivo.DIAS_ARCHIVO} días): ${anteriores.length} anteriores + nuevas = ${unidas.length}.`);
    guardar(ARCHIVO, { generado: new Date().toISOString(), dias: archivo.DIAS_ARCHIVO, resultados: unidas }, unidas.length);

    const nacionales = semana.resultados.filter((d) => d.ambito === 'nacional').length;
    console.log(`Novedades de los últimos ${semana.dias} días: ${semana.resultados.length} publicaciones ` +
      `(${nacionales} nacionales, ${semana.resultados.length - nacionales} internacionales).`);
    informar(semana.fuentes);
    guardar(SEMANA, semana, semana.resultados.length);
  } catch (e) {
    console.error('No se pudieron actualizar las novedades:', e.message);
  }

  try {
    const { libros, informe } = await obtenerRecientes({ esperaMs: 20000 });
    console.log(`Libros de los últimos 12 meses sobre los temas, de editoriales de prestigio: ${libros.length}.`);
    informar(informe);
    guardar(LIBROS, { generado: new Date().toISOString(), meses: 12, fuentes: informe, resultados: libros }, libros.length);
  } catch (e) {
    console.error('No se pudieron actualizar los libros recientes:', e.message);
  }
})();
