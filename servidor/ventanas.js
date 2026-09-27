/*
 * VENTANAS DE TIEMPO PARA EL ARCHIVO HISTÓRICO
 * Para ofrecer «Último año», «Últimos 2… 5 años» y «Todo el tiempo», el archivo se llena por
 * ventanas: el último año se consulta en CADA actualización (cada 4 horas) y, además, una
 * ventana más antigua que va rotando (1-2 años, 2-3, 3-4, 4-5 y «antes de 5 años»). Así, en
 * un día se recorren todas las ventanas sin hacer demasiadas consultas de una vez, y el
 * archivo (que se guarda en la web publicada) crece y se renueva solo.
 */
'use strict';

const DIA = 86400000;

function fecha(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Todas las ventanas: [desde, hasta) en "AAAA-MM-DD" (null = sin límite). */
function ventanas(ahora = new Date()) {
  const t = ahora.getTime();
  const anio = (n) => fecha(t - n * 365 * DIA);
  return [
    { id: 'anio-1', etiqueta: 'último año', desde: anio(1), hasta: null },
    { id: 'anio-2', etiqueta: 'hace 1 a 2 años', desde: anio(2), hasta: anio(1) },
    { id: 'anio-3', etiqueta: 'hace 2 a 3 años', desde: anio(3), hasta: anio(2) },
    { id: 'anio-4', etiqueta: 'hace 3 a 4 años', desde: anio(4), hasta: anio(3) },
    { id: 'anio-5', etiqueta: 'hace 4 a 5 años', desde: anio(5), hasta: anio(4) },
    { id: 'antes', etiqueta: 'hace más de 5 años', desde: null, hasta: anio(5) }
  ];
}

/**
 * Ventanas de esta actualización: siempre el último año y una más antigua que rota cada
 * 4 horas. Con la variable VENTANAS=todas se consultan todas (primera carga completa).
 */
function ventanasDeHoy(ahora = new Date(), todas = process.env.VENTANAS === 'todas') {
  const lista = ventanas(ahora);
  if (todas) return lista;
  const turno = Math.floor(ahora.getTime() / (4 * 3600000)) % (lista.length - 1);
  return [lista[0], lista[1 + turno]];
}

module.exports = { ventanas, ventanasDeHoy };
