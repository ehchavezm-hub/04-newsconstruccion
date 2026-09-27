/*
 * FUENTE: BUSCADOR DE NOTICIAS GDELT (últimos 3 meses, solo sitios de prestigio)
 * La lógica común está en public/js/gdelt.js (también la usa el navegador).
 */
'use strict';

const config = require('../config');
const Gdelt = require('../../public/js/gdelt.js');
const { traerConTiempo } = require('./utilidades');

module.exports = {
  nombre: 'Buscador de noticias (GDELT)',
  tipos: ['noticia'],

  async buscar(consulta, terminos) {
    const url = Gdelt.construirUrl(consulta, { terminos });
    if (!url) return [];
    const respuesta = await traerConTiempo(url, config.tiempoEsperaMs * 2);
    return Gdelt.interpretar(await respuesta.text());
  }
};
