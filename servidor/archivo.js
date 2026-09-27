/*
 * ARCHIVO DE NOTICIAS (últimos 90 días)
 * Cada vez que se actualiza la web, las noticias nuevas se suman a las ya guardadas.
 * Así el buscador encuentra todo lo publicado por los medios de prestigio en los últimos
 * 3 meses, sin depender de ningún servicio externo en el momento de buscar.
 */
'use strict';

const Crossref = require('../public/js/crossref.js');
const Motor = require('../public/js/motor-busqueda.js');

const DIAS_ARCHIVO = 90;

/** Versión reducida de una noticia, para que el archivo pese poco. */
function compacta(d) {
  return {
    id: d.id, tipo: d.tipo, titulo: d.titulo,
    resumen: Crossref.recortar(d.resumen || '', 200),
    autor: d.autor, fuente: d.fuente, tipoFuente: d.tipoFuente, ambito: d.ambito, idioma: d.idioma,
    fecha: d.fecha, enlace: d.enlace, descarga: d.descarga || null, etiquetas: [], origen: d.origen
  };
}

/**
 * Une el archivo anterior con las noticias nuevas: sin repetidos (por enlace o título),
 * solo los últimos 90 días y de lo más reciente a lo más antiguo.
 */
function unir(anteriores, nuevas, ahora = new Date()) {
  const limite = ahora.getTime() - DIAS_ARCHIVO * 86400000;
  const vistos = new Set();
  const lista = [];
  for (const d of [...nuevas, ...anteriores]) {
    const t = Date.parse(d.fecha);
    if (!d.enlace || isNaN(t) || t < limite || t > ahora.getTime() + 86400000) continue;
    const claves = [d.enlace, Motor.normalizar(d.titulo)];
    if (claves.some((c) => vistos.has(c))) continue;
    claves.forEach((c) => vistos.add(c));
    lista.push(compacta(d));
  }
  return Motor.ordenarPorFecha(lista);
}

module.exports = { unir, DIAS_ARCHIVO };
