/*
 * FUENTE: CROSSREF (papers académicos reales de revistas de prestigio)
 * La lógica común está en public/js/crossref.js (también la usa el navegador).
 */
'use strict';

const config = require('../config');
const Comun = require('../../public/js/crossref.js');
const { traerConTiempo } = require('./utilidades');

async function consultar(op) {
  const url = Comun.construirUrl({ ...op, correo: config.correoCrossref });
  const respuesta = await traerConTiempo(url, op.esperaMs || config.tiempoEsperaMs, {
    headers: { 'User-Agent': `ConstruccionGlobal/1.0 (${config.correoCrossref || 'sin correo'})` }
  });
  // De las revistas amplias solo quedan los artículos sobre construcción.
  return Comun.interpretar(await respuesta.json());
}

module.exports = {
  nombre: 'Crossref',
  tipos: ['paper'],
  consultar,

  /** Papers de revistas de prestigio sobre un tema (Crossref necesita un tema). */
  async buscar(consulta, terminos) {
    if (!consulta) return [];
    const texto = terminos ? terminos.slice(0, 4).map((t) => t.trim()).join(' ') : consulta;
    return consultar({ consulta: texto, filas: 10 });
  }
};
