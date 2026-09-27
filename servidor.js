/*
 * SERVIDOR DE DIPLOMACIA GLOBAL
 * No necesita instalar nada: solo Node.js 18 o superior.
 * Para iniciar:  npm start   (o: node servidor.js)
 * Luego abra:    http://localhost:3000
 *
 * Rutas:
 *   GET /api/buscar?q=texto&tipo=todos|noticia|paper|libro&p=1   -> resultados en JSON
 *       (p = período en años: 1 a 5, o 0 para todo el tiempo; por defecto 1)
 *   GET /api/descargar/:id                                    -> descarga el documento abierto
 *   GET /api/semana                                           -> novedades de los últimos 7 días
 *   GET /api/estado                                           -> comprobación rápida
 *   Cualquier otra ruta                                       -> archivos de la carpeta public/
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const config = require('./servidor/config');
const buscador = require('./servidor/buscador');
const { obtenerSemana } = require('./servidor/semana');
const { traerConTiempo, crearCache } = require('./servidor/fuentes/utilidades');

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};
const TIPOS_VALIDOS = ['todos', 'noticia', 'paper', 'libro'];
const cacheSemana = crearCache(30);

async function manejarSemana(res) {
  let datos = cacheSemana.obtener('semana');
  if (!datos) {
    datos = config.fuentesEnVivo
      ? await obtenerSemana()
      : { generado: null, dias: 7, fuentes: [], resultados: [] };
    if (datos.resultados.length) cacheSemana.guardar('semana', datos);
  }
  responderJson(res, 200, datos);
}

function responderJson(res, estado, datos) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(datos));
}

function servirArchivo(res, rutaUrl) {
  const relativa = decodeURIComponent(rutaUrl === '/' ? '/index.html' : rutaUrl);
  const completa = path.normalize(path.join(config.carpetaPublica, relativa));
  // Seguridad: nunca servir archivos fuera de public/.
  if (!completa.startsWith(config.carpetaPublica + path.sep)) {
    res.writeHead(403).end('Acceso no permitido');
    return;
  }
  fs.readFile(completa, (error, contenido) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Página no encontrada');
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS_MIME[path.extname(completa)] || 'application/octet-stream' });
    res.end(contenido);
  });
}

async function manejarBusqueda(res, parametros) {
  const consulta = (parametros.get('q') || '').slice(0, 200);
  const tipo = TIPOS_VALIDOS.includes(parametros.get('tipo')) ? parametros.get('tipo') : 'todos';
  // t = términos de un tema sugerido, separados por "|" (se busca cualquiera de ellos).
  const terminos = (parametros.get('t') || '').split('|').map((x) => x.slice(0, 60)).filter((x) => x.trim()).slice(0, 40);
  // p = período en años (1 a 5; 0 = todo el tiempo). Por defecto, el último año.
  const p = Number(parametros.get('p'));
  const anios = [0, 1, 2, 3, 4, 5].includes(p) && parametros.has('p') ? p : 1;
  const datos = await buscador.buscar({ consulta, tipo, terminos: terminos.length ? terminos : null, anios });
  responderJson(res, 200, { consulta, tipo, anios, total: datos.resultados.length, ...datos });
}

/**
 * Descarga "de un clic": el servidor trae el archivo y lo entrega con el nombre correcto.
 * Solo funciona con documentos del catálogo o resultados ya mostrados (no es un proxy abierto).
 */
async function manejarDescarga(res, id) {
  const doc = buscador.obtenerPorId(id);
  if (!doc || !doc.descarga) {
    responderJson(res, 404, { error: 'Este documento no tiene una descarga libre disponible.' });
    return;
  }
  try {
    const remoto = await traerConTiempo(doc.descarga.url, 30000);
    const nombre = doc.descarga.nombreArchivo || 'documento';
    res.writeHead(200, {
      'Content-Type': remoto.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${nombre.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(nombre)}`
    });
    Readable.fromWeb(remoto.body).pipe(res);
  } catch (e) {
    // Si el servidor no logra traerlo, se redirige al archivo original.
    res.writeHead(302, { Location: doc.descarga.url }).end();
  }
}

const servidor = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end();
    } else if (url.pathname === '/api/estado') {
      responderJson(res, 200, { ok: true, fuentesEnVivo: config.fuentesEnVivo });
    } else if (url.pathname === '/api/semana') {
      await manejarSemana(res);
    } else if (url.pathname === '/api/buscar') {
      await manejarBusqueda(res, url.searchParams);
    } else if (url.pathname.startsWith('/api/descargar/')) {
      await manejarDescarga(res, decodeURIComponent(url.pathname.slice('/api/descargar/'.length)));
    } else if (url.pathname.startsWith('/api/')) {
      responderJson(res, 404, { error: 'Ruta no encontrada' });
    } else {
      servirArchivo(res, url.pathname);
    }
  } catch (error) {
    console.error('Error inesperado:', error);
    if (!res.headersSent) responderJson(res, 500, { error: 'Ocurrió un problema. Inténtelo de nuevo.' });
  }
});

if (require.main === module) {
  servidor.listen(config.puerto, () => {
    console.log('');
    console.log('  ✅ Construcción Global está funcionando.');
    console.log(`  👉 Abra su navegador en: http://localhost:${config.puerto}`);
    console.log(`  🌐 Fuentes de internet: ${config.fuentesEnVivo ? 'activadas' : 'desactivadas (solo catálogo local)'}`);
    console.log('  ⏹  Para detenerlo, pulse Ctrl + C en esta ventana.');
    console.log('');
  });
}

module.exports = servidor;
