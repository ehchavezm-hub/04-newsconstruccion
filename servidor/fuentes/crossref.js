/*
 * FUENTE: CROSSREF (papers académicos reales de editoriales y congresos de prestigio)
 * La lógica común está en public/js/crossref.js (también la usa el navegador).
 * Solo quedan los papers vigentes (últimos 12 meses) y relacionados con los temas.
 */
'use strict';

const config = require('../config');
const Comun = require('../../public/js/crossref.js');
const Motor = require('../../public/js/motor-busqueda.js');
const Temas = require('../../public/js/temas.js');
const { traerConTiempo } = require('./utilidades');

const PAUSA_MS = 1200; // Crossref limita las consultas seguidas

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

/**
 * Papers de los últimos 12 meses de cada uno de los temas definidos, en todas las revistas y
 * congresos de las editoriales académicas de prestigio.
 * @returns {Promise<{papers: Array, informe: Array}>}
 */
async function obtenerRecientes({ ahora = new Date(), esperaMs = config.tiempoEsperaMs, filas = 40 } = {}) {
  const desde = Comun.haceDias(Motor.VIGENCIA_DIAS.paper, ahora);
  const todos = [];
  let respondieron = 0;
  for (const tema of Temas.grupos.flatMap((g) => g.temas)) {
    try {
      todos.push(...await consultar({ consulta: tema.academica, desde, filas, esperaMs }));
      respondieron++;
    } catch { /* se omite el tema que falla */ }
    await new Promise((ok) => setTimeout(ok, PAUSA_MS));
  }
  const vistos = new Set();
  const papers = Motor.aptos(todos, ahora).filter((d) => {
    const clave = Motor.normalizar(d.titulo);
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
  return {
    papers: Motor.ordenarPorFecha(papers),
    informe: [{ fuente: `Papers por tema (Crossref, ${respondieron} de ${Temas.grupos.flatMap((g) => g.temas).length} temas)`, ok: respondieron > 0, cantidad: papers.length }]
  };
}

module.exports = {
  nombre: 'Crossref',
  tipos: ['paper'],
  consultar,
  obtenerRecientes,

  /** Papers vigentes sobre un tema o sobre lo que escribió la persona. */
  async buscar(consulta, terminos) {
    if (!consulta) return [];
    const tema = temaDeTerminos(terminos);
    return Motor.aptos(await consultar({ consulta: tema ? tema.academica : consulta, filas: 40 }));
  }
};
