/*
 * COMPROBAR LAS FUENTES
 * Revisa, una por una, que respondan:
 *   - los canales RSS y las búsquedas de Google Noticias de public/js/fuentes-prestigio.js,
 *   - otros canales RSS candidatos (para decidir si reemplazan a Google Noticias),
 *   - el ISSN de cada revista académica en Crossref,
 *   - los enlaces y descargas del catálogo local (public/datos/catalogo.js).
 *
 * Uso:  node herramientas/comprobar-fuentes.js
 * Lo ejecuta también el flujo de GitHub Actions "Comprobar fuentes" (pestaña Actions).
 * Solo informa: nunca termina con error.
 */
'use strict';

const Fuentes = require('../public/js/fuentes-prestigio.js');
const catalogo = require('../public/datos/catalogo.js');
const rss = require('../servidor/fuentes/noticias-rss');

const ESPERA_MS = 20000;
const NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Canales RSS propios que se prueban antes de decidir usar Google Noticias.
const CANDIDATOS = [
  { id: 'andina', url: 'https://andina.pe/agencia/rss/3.aspx' },
  { id: 'power-eng', url: 'https://www.power-eng.com/feed/' },
  { id: 'semana-economica', url: 'https://semanaeconomica.com/feed' },
  { id: 'gihub', url: 'https://www.gihub.org/feed/' },
  { id: 'proinversion', url: 'https://news.google.com/rss/search?q=site%3Aproinversion.gob.pe+when%3A7d&hl=es-419&gl=PE&ceid=PE%3Aes-419' }
];

async function traer(url, opciones = {}) {
  const r = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(ESPERA_MS),
    headers: { 'User-Agent': NAVEGADOR, ...(opciones.headers || {}) },
    method: opciones.method || 'GET'
  });
  return r;
}

function linea(ok, texto) {
  console.log(`  ${ok ? '✔' : '✘'} ${texto}`);
}

/** Lee un canal y devuelve cuántas noticias trae (total y del sector) y su título. */
async function probarCanal(url, medio) {
  try {
    const r = await traer(url);
    const xml = await r.text();
    if (!r.ok) return { ok: false, detalle: `HTTP ${r.status}` };
    const bloques = (xml.match(/<item[\s>]/gi) || xml.match(/<entry[\s>]/gi) || []).length;
    const titulo = (xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
    const aceptadas = rss.interpretarRss(xml, medio).length;
    return { ok: bloques > 0, detalle: `${bloques} entradas, ${aceptadas} aceptadas · «${titulo.replace(/<!\[CDATA\[|\]\]>/g, '').trim().slice(0, 60)}»` };
  } catch (e) {
    return { ok: false, detalle: e.name === 'TimeoutError' ? 'no respondió a tiempo' : e.message };
  }
}

async function comprobarMedios() {
  console.log('\n== Medios (fuentes-prestigio.js) ==');
  for (const m of Fuentes.medios) {
    const url = rss.urlDe(m);
    const r = await probarCanal(url, m);
    linea(r.ok, `${m.id} [${m.url ? 'RSS' : 'Google Noticias'}] ${r.detalle}`);
  }
  console.log('\n== Canales RSS candidatos ==');
  for (const c of CANDIDATOS) {
    const medio = Fuentes.medios.find((m) => m.id === c.id) || { nombre: c.id, especializado: true };
    const r = await probarCanal(c.url, { ...medio, googleNoticias: undefined });
    linea(r.ok, `${c.id} ${c.url} → ${r.detalle}`);
  }
}

async function comprobarRevistas() {
  console.log('\n== Revistas académicas (Crossref, por ISSN) ==');
  for (const rev of Fuentes.revistas) {
    await new Promise((ok) => setTimeout(ok, 1500)); // Crossref limita las consultas seguidas
    try {
      const r = await traer(`https://api.crossref.org/journals/${rev.issn}`);
      if (!r.ok) { linea(false, `${rev.issn} ${rev.nombre}: HTTP ${r.status}`); continue; }
      const j = (await r.json()).message || {};
      const coincide = String(j.title || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '') ===
        rev.nombre.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
      linea(true, `${rev.issn} → «${j.title}» (${(j.ISSN || []).join(', ')})${coincide ? '' : '  ⚠ el nombre no coincide exactamente'}`);
    } catch (e) {
      linea(false, `${rev.issn} ${rev.nombre}: ${e.message}`);
    }
  }
}

async function comprobarCatalogo() {
  console.log('\n== Enlaces del catálogo ==');
  for (const d of catalogo) {
    const urls = [['enlace', d.enlace]];
    if (d.descarga) urls.push(['descarga', d.descarga.url]);
    for (const [clase, url] of urls) {
      try {
        const r = await traer(url);
        const tipo = r.headers.get('content-type') || '';
        await r.body?.cancel();
        linea(r.ok, `${d.id} (${clase}) HTTP ${r.status} ${tipo.split(';')[0]} ${r.url !== url ? '→ ' + r.url : ''}`);
      } catch (e) {
        linea(false, `${d.id} (${clase}) ${url}: ${e.message}`);
      }
    }
  }
}

(async () => {
  try {
    await comprobarMedios();
    await comprobarRevistas();
    await comprobarCatalogo();
  } catch (e) {
    console.error('Error inesperado:', e.message);
  }
})();
