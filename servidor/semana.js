/*
 * NOVEDADES DE LA ÚLTIMA SEMANA
 * Reúne lo publicado en los últimos 7 días por las fuentes de prestigio, solo si se relaciona con los temas
 * (public/js/fuentes-prestigio.js): noticias de medios del sector, gremios, entidades públicas y organismos,
 * y artículos de las revistas académicas más importantes de construcción y gestión de proyectos.
 *
 * Lo usan:
 *   - el servidor (ruta /api/semana), y
 *   - herramientas/actualizar-semana.js, que guarda el resultado en
 *     public/datos/ultima-semana.json para la versión publicada en internet.
 */
'use strict';

const noticiasRss = require('./fuentes/noticias-rss');
const crossref = require('./fuentes/crossref');
const Motor = require('../public/js/motor-busqueda.js');

const DIAS = 7;

function haceDias(dias, ahora = new Date()) {
  return new Date(ahora.getTime() - dias * 86400000);
}

/**
 * @param {{ahora?: Date, esperaMs?: number}} op
 * @returns {Promise<{generado: string, desde: string, dias: number, fuentes: Array, resultados: Array}>}
 */
async function obtenerSemana({ ahora = new Date(), esperaMs, papersExtra = [] } = {}) {
  const desde = haceDias(DIAS, ahora);
  const informe = [];

  const { noticias, informe: informeRss } = await noticiasRss.leerTodos(esperaMs);
  informe.push(...informeRss);

  let papers = [];
  try {
    papers = await crossref.consultar({ desde: desde.toISOString().slice(0, 10), filas: 60, esperaMs });
    informe.push({ fuente: 'Revistas académicas (Crossref)', ok: true, cantidad: papers.length });
  } catch (e) {
    informe.push({ fuente: 'Revistas académicas (Crossref)', ok: false, cantidad: 0 });
  }

  // Solo lo publicado en estos 7 días (la fecha de Crossref es la más temprana, impresa o
  // en línea: un artículo publicado en línea en 2024 no pasa aunque salga impreso ahora) y
  // relacionado, directa o indirectamente, con los temas definidos.
  const recientes = [...noticias, ...papers, ...papersExtra].filter((d) => {
    const t = Motor.valorFecha(d.fecha);
    return t >= desde.getTime() && t <= ahora.getTime() + 86400000 && Motor.esDeLosTemas(d);
  });

  // Sin duplicados (el mismo titular en dos medios) y de lo más nuevo a lo más antiguo.
  const vistos = new Set();
  const resultados = recientes
    .filter((d) => {
      const clave = Motor.normalizar(d.titulo);
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));

  return {
    // Si ninguna fuente respondió, no hay datos: la página lo dirá con un mensaje amable.
    generado: informe.some((f) => f.ok) ? ahora.toISOString() : null,
    desde: desde.toISOString(),
    dias: DIAS,
    fuentes: informe,
    resultados
  };
}

module.exports = { obtenerSemana, DIAS };
