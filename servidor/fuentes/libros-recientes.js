/*
 * FUENTE: LIBROS RECIENTES DE EDITORIALES DE PRESTIGIO
 * Google Books (principal) y Open Library (respaldo). La lógica común está en
 * public/js/libros.js (también la usa el navegador para buscar por tema).
 */
'use strict';

const config = require('../config');
const Libros = require('../../public/js/libros.js');
const Motor = require('../../public/js/motor-busqueda.js');
const { traerConTiempo } = require('./utilidades');

async function traerJson(url, ms) {
  const r = await traerConTiempo(url, ms, { headers: { 'User-Agent': 'ConstruccionGlobal/1.0' } });
  return r.json();
}

/**
 * Libros sobre gestión de proyectos, construcción, ingeniería, contratos, puesta en marcha
 * y mantenimiento publicados desde `desdeAnio`.
 * @returns {Promise<{libros: Array, informe: Array}>}
 */
async function obtenerRecientes({ desdeAnio, esperaMs = config.tiempoEsperaMs } = {}) {
  const informe = [];
  const libros = [];

  const google = await Promise.allSettled(
    Libros.TEMAS.map((t) => traerJson(Libros.urlGoogle({ q: t.q, idioma: t.idioma }), esperaMs))
  );
  const deGoogle = google.filter((r) => r.status === 'fulfilled')
    .flatMap((r) => Libros.interpretarGoogle(r.value, desdeAnio));
  informe.push({ fuente: 'Libros — Google Books', ok: google.some((r) => r.status === 'fulfilled'), cantidad: deGoogle.length });
  libros.push(...deGoogle);

  const ol = await Promise.allSettled(Libros.TEMAS_OPEN_LIBRARY.map((t) => traerJson(Libros.urlOpenLibrary(t), esperaMs)));
  const deOL = ol.filter((r) => r.status === 'fulfilled')
    .flatMap((r) => Libros.interpretarOpenLibrary(r.value, desdeAnio));
  informe.push({ fuente: 'Libros — Open Library', ok: ol.some((r) => r.status === 'fulfilled'), cantidad: deOL.length });
  libros.push(...deOL);

  return { libros: Motor.ordenarPorFecha(Libros.sinRepetidos(libros)), informe };
}

module.exports = {
  nombre: 'Libros (Google Books)',
  tipos: ['libro'],
  obtenerRecientes,

  /** Libros de editoriales de prestigio sobre un tema. */
  async buscar(consulta, terminos) {
    if (!consulta) return [];
    // Open Library (Google Books rechaza consultas sin clave por límite de uso).
    const json = await traerJson(Libros.urlOpenLibrary(terminos ? terminos[0].trim() : consulta), config.tiempoEsperaMs);
    return Libros.interpretarOpenLibrary(json);
  }
};
