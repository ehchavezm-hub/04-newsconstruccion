/*
 * FUENTE: CATÁLOGO LOCAL
 * El catálogo del navegador (public/datos/catalogo.js) más los papers y libros recientes
 * guardados por "npm run actualizar". El buscador deja solo lo vigente y relacionado con los temas.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const catalogo = require('../../public/datos/catalogo.js');

const DATOS = path.join(__dirname, '..', '..', 'public', 'datos');

/** Papers o libros recientes guardados por "npm run actualizar" (si existen). */
function guardados(archivo) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATOS, archivo), 'utf8')).resultados || [];
  } catch {
    return [];
  }
}

module.exports = {
  nombre: 'Catálogo local',
  tipos: ['noticia', 'paper', 'libro', 'norma'],

  async buscar() {
    return [...catalogo, ...guardados('papers-recientes.json'), ...guardados('libros-recientes.json')];
  },

  obtenerPorId(id) {
    return catalogo.find((d) => d.id === id) || null;
  }
};
