/*
 * FUENTE: LIBROS RECIENTES DE EDITORIALES DE PRESTIGIO
 * Google Books (si responde) y Open Library, buscando cada uno de los temas definidos
 * (public/js/temas.js). Solo quedan los libros vigentes (últimos 12 meses) y relacionados
 * con los temas. La lógica común está en public/js/libros.js.
 */
'use strict';

const config = require('../config');
const Libros = require('../../public/js/libros.js');
const Motor = require('../../public/js/motor-busqueda.js');
const Temas = require('../../public/js/temas.js');
const { traerConTiempo } = require('./utilidades');

const PAUSA_MS = 400; // Open Library pide no hacer muchas consultas seguidas

async function traerJson(url, ms) {
  const r = await traerConTiempo(url, ms, { headers: { 'User-Agent': 'ConstruccionGlobal/1.0' } });
  return r.json();
}

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Consulta una lista de direcciones de una en una; devuelve las respuestas que llegaron. */
async function consultarEnOrden(urls, esperaMs) {
  const respuestas = [];
  for (const url of urls) {
    try {
      respuestas.push(await traerJson(url, esperaMs));
    } catch { /* se omite la que falla */ }
    await esperar(PAUSA_MS);
  }
  return respuestas;
}

/**
 * Libros de los temas definidos publicados en los últimos 12 meses.
 * @returns {Promise<{libros: Array, informe: Array}>}
 */
async function obtenerRecientes({ ahora = new Date(), esperaMs = config.tiempoEsperaMs } = {}) {
  const informe = [];
  const temas = Temas.grupos.flatMap((g) => g.temas);
  const desdeAnio = new Date(ahora.getTime() - Motor.VIGENCIA_DIAS.libro * 86400000).getUTCFullYear();

  const google = await consultarEnOrden(temas.map((t) => Libros.urlGoogle({ q: t.academica })), esperaMs);
  const deGoogle = google.flatMap((j) => Libros.interpretarGoogle(j, desdeAnio));
  informe.push({ fuente: 'Libros — Google Books', ok: google.length > 0, cantidad: deGoogle.length });

  const ol = await consultarEnOrden(temas.map((t) => Libros.urlOpenLibrary(t.academica)), esperaMs);
  const deOL = ol.flatMap((j) => Libros.interpretarOpenLibrary(j, desdeAnio));
  informe.push({ fuente: 'Libros — Open Library', ok: ol.length > 0, cantidad: deOL.length });

  const libros = Motor.aptos(Libros.sinRepetidos([...deGoogle, ...deOL]), ahora);
  return { libros: Motor.ordenarPorFecha(libros), informe };
}

module.exports = {
  nombre: 'Libros (Open Library)',
  tipos: ['libro'],
  obtenerRecientes,

  /** Libros de editoriales de prestigio sobre un tema (solo vigentes y relacionados). */
  async buscar(consulta, terminos) {
    if (!consulta) return [];
    const tema = terminos ? Temas.grupos.flatMap((g) => g.temas).find((t) => t.terminos === terminos) : null;
    const json = await traerJson(Libros.urlOpenLibrary(tema ? tema.academica : consulta), config.tiempoEsperaMs);
    return Motor.aptos(Libros.interpretarOpenLibrary(json));
  }
};
