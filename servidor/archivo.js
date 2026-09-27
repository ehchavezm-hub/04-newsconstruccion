/*
 * ARCHIVO HISTÓRICO (noticias, papers y libros)
 * Cada actualización suma lo nuevo a lo ya publicado en la web. Así el buscador encuentra
 * lo del último año y, si la persona lo pide, lo de 2, 3, 4, 5 años o todo el tiempo, sin
 * depender de ningún servicio externo en el momento de buscar.
 *
 * Se guarda en dos partes para que la página cargue rápido:
 *   <nombre>-anio.json       lo del último año (se usa siempre)
 *   <nombre>-historico.json  lo anterior (solo se descarga si se elige un período mayor)
 */
'use strict';

const Crossref = require('../public/js/crossref.js');
const Motor = require('../public/js/motor-busqueda.js');

// Máximo de elementos que se guardan de cada tipo (los más recientes).
const MAXIMOS = { noticia: 6000, paper: 5000, libro: 3000 };

/** Versión reducida de un documento, para que el archivo pese poco. */
function compacta(d) {
  return {
    id: d.id, tipo: d.tipo, titulo: d.titulo,
    resumen: Crossref.recortar(d.resumen || '', d.tipo === 'noticia' ? 200 : 300),
    autor: d.autor, fuente: d.fuente, tipoFuente: d.tipoFuente, ambito: d.ambito, idioma: d.idioma,
    fecha: d.fecha, enlace: d.enlace, sitio: d.sitio, descarga: d.descarga || null,
    etiquetas: (d.etiquetas || []).slice(0, 8), origen: d.origen
  };
}

/**
 * Une lo anterior con lo nuevo: sin repetidos (por enlace o título), sin fechas futuras,
 * solo lo relacionado con los temas definidos y que no es ruido, de lo más reciente a lo
 * más antiguo y con un máximo de elementos.
 */
function unir(anteriores, nuevas, ahora = new Date(), maximo = Infinity) {
  const vistos = new Set();
  const lista = [];
  const aceptados = Motor.aptos([...nuevas, ...anteriores], ahora, 0); // 0 = todo el tiempo
  for (const d of aceptados) {
    if (!d.enlace) continue;
    const claves = [d.enlace, Motor.normalizar(d.titulo)];
    if (claves.some((c) => vistos.has(c))) continue;
    claves.forEach((c) => vistos.add(c));
    lista.push(compacta(d));
  }
  return Motor.ordenarPorFecha(lista).slice(0, maximo);
}

/** Divide una lista en lo del último año y lo anterior. */
function dividir(lista, ahora = new Date()) {
  const anio = [];
  const historico = [];
  lista.forEach((d) => (Motor.vigente(d, ahora, 1) ? anio : historico).push(d));
  return { anio, historico };
}

module.exports = { unir, dividir, compacta, MAXIMOS };
