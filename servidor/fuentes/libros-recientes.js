/*
 * FUENTE: LIBROS DE EDITORIALES DE PRESTIGIO
 * Crossref (libros de editoriales académicas y técnicas de prestigio) y Open Library,
 * buscando cada uno de los temas definidos (public/js/temas.js). Al generar los datos se
 * consulta por ventanas de tiempo (servidor/ventanas.js); en el servidor local, por el
 * período elegido. Solo quedan los libros relacionados con los temas.
 */
'use strict';

const config = require('../config');
const Libros = require('../../public/js/libros.js');
const Crossref = require('../../public/js/crossref.js');
const Motor = require('../../public/js/motor-busqueda.js');
const Temas = require('../../public/js/temas.js');
const { traerConTiempo } = require('./utilidades');

const PAUSA_MS = 500; // para no saturar a Crossref ni a Open Library

async function traerJson(url, ms) {
  const r = await traerConTiempo(url, ms, { headers: { 'User-Agent': 'ConstruccionGlobal/1.0' } });
  return r.json();
}

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Libros de todos los temas en las ventanas indicadas.
 * @returns {Promise<{libros: Array, informe: Array}>}
 */
async function obtenerPorVentanas(ventanas, { esperaMs = config.tiempoEsperaMs, maximoMs = Infinity } = {}) {
  const temas = Temas.consultas; // temas y búsquedas adicionales
  const deCrossref = [];
  const inicio = Date.now();
  let respondieron = 0;
  for (const ventana of ventanas) {
    for (const t of temas) {
      if (Date.now() - inicio > maximoMs) break;
      try {
        const url = Crossref.construirUrl({ consulta: t.academica, libros: true, desde: ventana.desde, hasta: ventana.hasta, filas: 30 });
        deCrossref.push(...Crossref.interpretar(await traerJson(url, esperaMs)).filter((d) => d.tipo === 'libro'));
        respondieron++;
      } catch { /* se omite la consulta que falla */ }
      await esperar(PAUSA_MS);
    }
  }
  const deOL = [];
  for (const t of temas) {
    if (Date.now() - inicio > maximoMs) break;
    try {
      deOL.push(...Libros.interpretarOpenLibrary(await traerJson(Libros.urlOpenLibrary(t.academica), esperaMs)));
    } catch { /* se omite */ }
    await esperar(PAUSA_MS);
  }
  const libros = Libros.sinRepetidos([...deCrossref, ...deOL]).filter(Motor.esDeLosTemas);
  return {
    libros,
    informe: [
      { fuente: `Libros — Crossref (${ventanas.map((v) => v.etiqueta).join(' y ')})`, ok: respondieron > 0, cantidad: deCrossref.length },
      { fuente: 'Libros — Open Library', ok: deOL.length > 0, cantidad: deOL.length }
    ]
  };
}

module.exports = {
  nombre: 'Libros (Crossref y Open Library)',
  tipos: ['libro'],
  obtenerPorVentanas,

  /** Libros del período elegido sobre un tema o texto. */
  async buscar(consulta, terminos, anios) {
    if (!consulta) return [];
    const tema = terminos ? Temas.grupos.flatMap((g) => g.temas).find((t) => t.terminos === terminos) : null;
    const texto = tema ? tema.academica : consulta;
    const [cr, ol] = await Promise.allSettled([
      traerJson(Crossref.construirUrl({ consulta: texto, libros: true, desde: Motor.inicioDePeriodo(anios), filas: 30 }), config.tiempoEsperaMs),
      traerJson(Libros.urlOpenLibrary(texto), config.tiempoEsperaMs)
    ]);
    const libros = [
      ...(cr.status === 'fulfilled' ? Crossref.interpretar(cr.value).filter((d) => d.tipo === 'libro') : []),
      ...(ol.status === 'fulfilled' ? Libros.interpretarOpenLibrary(ol.value) : [])
    ];
    if (!libros.length && cr.status === 'rejected' && ol.status === 'rejected') throw new Error('Sin respuesta');
    return Libros.sinRepetidos(libros);
  }
};
