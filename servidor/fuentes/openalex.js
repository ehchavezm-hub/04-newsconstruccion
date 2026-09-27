/*
 * FUENTE: OPENALEX (papers de todo el mundo, solo de fuentes selectas)
 * La lógica común está en public/js/openalex.js (también la usa el navegador).
 */
'use strict';

const config = require('../config');
const OpenAlex = require('../../public/js/openalex.js');
const Motor = require('../../public/js/motor-busqueda.js');
const Temas = require('../../public/js/temas.js');
const { traerConTiempo } = require('./utilidades');

async function consultar(op, esperaMs = config.tiempoEsperaMs) {
  const url = OpenAlex.construirUrl({ ...op, correo: config.correoCrossref });
  if (!url) return [];
  const r = await traerConTiempo(url, esperaMs, { headers: { 'User-Agent': 'ConstruccionGlobal/1.0' } });
  return OpenAlex.interpretar(await r.json());
}

/** Papers de un tema en una ventana de tiempo (pais: 'PE' para autores peruanos). */
async function buscarTema(tema, ventana, pais, esperaMs) {
  const docs = await consultar({ consulta: tema.openalex, desde: ventana.desde, hasta: ventana.hasta, pais, filas: 50 }, esperaMs);
  return docs.filter(Motor.esDeLosTemas);
}

function temaDeTerminos(terminos) {
  return terminos ? Temas.grupos.flatMap((g) => g.temas).find((t) => t.terminos === terminos) : null;
}

module.exports = {
  nombre: 'Papers (OpenAlex)',
  tipos: ['paper'],
  consultar,
  buscarTema,

  /** Papers del período elegido sobre un tema o texto: del mundo y de autores peruanos. */
  async buscar(consulta, terminos, anios) {
    if (!consulta) return [];
    const tema = temaDeTerminos(terminos);
    const op = { consulta: tema ? tema.openalex : consulta, desde: Motor.inicioDePeriodo(anios) };
    const [mundo, peru] = await Promise.allSettled([consultar(op), consultar({ ...op, pais: 'PE' })]);
    const docs = [...(mundo.status === 'fulfilled' ? mundo.value : []), ...(peru.status === 'fulfilled' ? peru.value : [])];
    if (!docs.length && mundo.status === 'rejected') throw new Error('OpenAlex no respondió');
    return docs;
  }
};
