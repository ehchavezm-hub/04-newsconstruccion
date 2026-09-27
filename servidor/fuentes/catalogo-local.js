/*
 * FUENTE: CATÁLOGO LOCAL
 * Los mismos datos de demostración que usa el navegador (public/datos/catalogo.js).
 * Siempre está disponible y sirve de respaldo cuando internet falla.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const catalogo = require('../../public/datos/catalogo.js');

const LIBROS_RECIENTES = path.join(__dirname, '..', '..', 'public', 'datos', 'libros-recientes.json');

/** Libros recientes guardados por "npm run actualizar" (si existen). */
function librosRecientes() {
  try {
    return JSON.parse(fs.readFileSync(LIBROS_RECIENTES, 'utf8')).resultados || [];
  } catch {
    return [];
  }
}

module.exports = {
  nombre: 'Catálogo local',
  tipos: ['noticia', 'paper', 'libro', 'norma'],

  async buscar() {
    return [...catalogo, ...librosRecientes()];
  },

  obtenerPorId(id) {
    return catalogo.find((d) => d.id === id) || null;
  }
};
