/*
 * FUENTE: NOTICIAS POR TEMA EN TODO INTERNET (Google Noticias), CON SELECTIVIDAD
 * Para cada tema (public/js/temas.js) se hacen dos búsquedas:
 *   - nacional: la consulta en español + «Perú», en la edición de Google Noticias del Perú;
 *   - internacional: la consulta en inglés, en la edición de Estados Unidos.
 * Cada noticia trae su fuente real (<source url="…">). Solo se acepta si la fuente es selecta
 * (fuentes-prestigio.js: medios de prestigio, sitios oficiales o académicos) y no es ruido
 * (empleo, publicidad). Las fechas se limitan con when:1y o after:/before: (ventanas).
 */
'use strict';

const config = require('../config');
const Fuentes = require('../../public/js/fuentes-prestigio.js');
const Motor = require('../../public/js/motor-busqueda.js');
const { traerConTiempo, idDesdeTexto } = require('./utilidades');
const { etiqueta, aFecha } = require('./noticias-rss');

const REGIONES = {
  nacional: { hl: 'es-419', gl: 'PE', ceid: 'PE:es-419' },
  internacional: { hl: 'en-US', gl: 'US', ceid: 'US:en' }
};

/** Dirección de búsqueda de un tema en una ventana de tiempo. */
function urlTema(tema, ambito, ventana) {
  let q = ambito === 'nacional' ? `(${tema.noticias.es}) Perú` : tema.noticias.en;
  if (ventana.id === 'anio-1') q += ' when:1y';
  else {
    if (ventana.desde) q += ` after:${ventana.desde}`;
    if (ventana.hasta) q += ` before:${ventana.hasta}`;
  }
  return 'https://news.google.com/rss/search?' + new URLSearchParams({ q, ...REGIONES[ambito] });
}

function tipoFuenteDe(host) {
  if (/\.(gob|gov)(\.[a-z]{2})?$|\.gov$|(^|\.)un\.org$/.test(host)) return 'Entidad oficial';
  if (/\.(edu|ac)(\.[a-z]{2})?$|\.edu$/.test(host)) return 'Institución académica';
  return 'Medio de prestigio';
}

/**
 * Convierte el RSS de una búsqueda de Google Noticias. Solo quedan las fuentes selectas.
 * @param {'nacional'|'internacional'} ambitoConsulta
 */
function interpretar(xml, ambitoConsulta) {
  const bloques = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  return bloques.map((b) => {
    const fuenteUrl = (b.match(/<source[^>]*url=["']([^"']+)["']/i) || [])[1] || '';
    const fuenteNombre = etiqueta(b, 'source');
    const sitio = Fuentes.sitioDe(fuenteUrl);
    const host = fuenteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const titulo = etiqueta(b, 'title').replace(/\s+[-–]\s+[^-–]{2,80}$/, '');
    const nombre = (sitio && sitio.nombre !== sitio.dominio ? sitio.nombre : fuenteNombre) || host;
    const doc = {
      id: idDesdeTexto('gnews', etiqueta(b, 'link') || titulo),
      tipo: 'noticia',
      titulo,
      resumen: `Publicado por ${nombre}. Pulse «Visitar enlace» para leerlo completo.`,
      autor: nombre,
      fuente: nombre,
      tipoFuente: tipoFuenteDe(host),
      idioma: ambitoConsulta === 'nacional' ? 'es' : 'en',
      fecha: aFecha(etiqueta(b, 'pubDate')),
      enlace: etiqueta(b, 'link'),
      sitio: fuenteUrl,
      descarga: null,
      etiquetas: [],
      origen: 'Google Noticias'
    };
    // Ámbito: nacional si la fuente es peruana o si la noticia (de la búsqueda del Perú) habla del Perú.
    const hablaDelPeru = Fuentes.ambitoDe({ tipo: 'libro', titulo }) === 'nacional';
    doc.ambito = (sitio && sitio.ambito === 'nacional') || /\.pe$/.test(host) ||
      (ambitoConsulta === 'nacional' && hablaDelPeru) ? 'nacional' : 'internacional';
    return doc;
  })
    .filter((n) => n.titulo && /^https?:\/\//.test(n.enlace) && Fuentes.esFuenteSelecta(n.sitio) && !Fuentes.esDescartable(n));
}

async function buscarTema(tema, ambito, ventana, esperaMs = config.tiempoEsperaMs) {
  const r = await traerConTiempo(urlTema(tema, ambito, ventana), esperaMs, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConstruccionGlobal/1.0)' }
  });
  // Solo lo relacionado con los temas (la búsqueda por tema ya lo asegura casi siempre).
  return interpretar(await r.text(), ambito).filter(Motor.esDeLosTemas);
}

module.exports = { urlTema, interpretar, buscarTema };
