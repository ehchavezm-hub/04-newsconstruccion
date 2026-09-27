/*
 * FUENTE: CROSSREF (papers y libros de editoriales y congresos académicos de prestigio)
 * La lógica común está en public/js/crossref.js (también la usa el navegador).
 * Aquí se usa para las novedades de la semana (revistas núcleo) y para buscar papers y
 * libros del período elegido.
 */
'use strict';

const config = require('../config');
const Comun = require('../../public/js/crossref.js');
const Motor = require('../../public/js/motor-busqueda.js');
const Temas = require('../../public/js/temas.js');
const { traerConTiempo } = require('./utilidades');

async function consultar(op) {
  const url = Comun.construirUrl({ ...op, correo: config.correoCrossref });
  const respuesta = await traerConTiempo(url, op.esperaMs || config.tiempoEsperaMs, {
    headers: { 'User-Agent': `ConstruccionGlobal/1.0 (${config.correoCrossref || 'sin correo'})` }
  });
  // De las revistas amplias solo quedan los artículos sobre construcción.
  return Comun.interpretar(await respuesta.json());
}

function temaDeTerminos(terminos) {
  return terminos ? Temas.grupos.flatMap((g) => g.temas).find((t) => t.terminos === terminos) : null;
}

module.exports = {
  nombre: 'Crossref',
  tipos: ['paper'],
  consultar,

  /** Papers del período elegido sobre un tema o sobre lo que escribió la persona. */
  async buscar(consulta, terminos, anios) {
    if (!consulta) return [];
    const tema = temaDeTerminos(terminos);
    return consultar({ consulta: tema ? tema.academica : consulta, desde: Motor.inicioDePeriodo(anios), filas: 40 });
  }
};
