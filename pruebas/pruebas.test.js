/*
 * PRUEBAS AUTOMÁTICAS
 * Ejecutar con:  npm test
 * No usan internet: las fuentes externas se prueban con datos de ejemplo.
 */
'use strict';

process.env.FUENTES_EN_VIVO = 'no';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const catalogo = require('../public/datos/catalogo.js');
const Motor = require('../public/js/motor-busqueda.js');
const Crossref = require('../public/js/crossref.js');
const Fuentes = require('../public/js/fuentes-prestigio.js');
const Temas = require('../public/js/temas.js');
const Gdelt = require('../public/js/gdelt.js');
const Libros = require('../public/js/libros.js');
const { obtenerSemana } = require('../servidor/semana');
const rss = require('../servidor/fuentes/noticias-rss');
const biblioteca = require('../servidor/fuentes/biblioteca-personal');

const doc = (id, titulo, fecha = '2026-09-20', extra = {}) =>
  ({ id, tipo: 'noticia', titulo, resumen: '', autor: '', fuente: '', fecha, ...extra });

describe('Catálogo', () => {
  test('cada documento tiene los campos obligatorios y un id único', () => {
    const ids = new Set();
    for (const d of catalogo) {
      assert.ok(d.id && d.titulo && d.resumen && d.autor && d.fecha, `Faltan datos en ${d.id}`);
      assert.ok(['noticia', 'paper', 'libro', 'norma'].includes(d.tipo), `Tipo inválido en ${d.id}`);
      assert.ok(/^https:\/\//.test(d.enlace), `Enlace inválido en ${d.id}`);
      assert.ok(!ids.has(d.id), `Id repetido: ${d.id}`);
      ids.add(d.id);
      if (d.descarga) assert.ok(/^https:\/\//.test(d.descarga.url) && d.descarga.formato && d.descarga.nombreArchivo, d.id);
    }
  });

  test('tiene 13 libros, 7 papers, 3 normas o guías y 6 noticias de ejemplo', () => {
    const cuenta = (t) => catalogo.filter((d) => d.tipo === t).length;
    assert.equal(cuenta('libro'), 13);
    assert.equal(cuenta('paper'), 7);
    assert.equal(cuenta('norma'), 3);
    assert.equal(cuenta('noticia'), 6);
  });

  test('todas las noticias locales están marcadas como ejemplo', () => {
    catalogo.filter((d) => d.tipo === 'noticia').forEach((d) => assert.equal(d.ejemplo, true, d.id));
    assert.ok(catalogo.filter((d) => d.tipo !== 'noticia').every((d) => !d.ejemplo));
  });

  test('las normas peruanas son nacionales y los libros de dominio público se descargan en texto', () => {
    assert.equal(Fuentes.ambitoDe(catalogo.find((d) => d.id === 'norma-ley-32069')), 'nacional');
    assert.equal(Fuentes.ambitoDe(catalogo.find((d) => d.id === 'norma-g050')), 'nacional');
    const vitruvio = catalogo.find((d) => d.id === 'libro-vitruvio-arquitectura');
    assert.equal(vitruvio.descarga.formato, 'Texto');
    assert.match(vitruvio.descarga.url, /gutenberg\.org/);
  });
});

describe('Motor de búsqueda', () => {
  test('ignora mayúsculas y tildes', () => {
    assert.equal(Motor.normalizar('¿Licitación PÚBLICA?'), 'licitacion publica');
    const a = Motor.buscar(catalogo, { consulta: 'contrataciones publicas' }).map((d) => d.id);
    const b = Motor.buscar(catalogo, { consulta: 'CONTRATACIONES PÚBLICAS' }).map((d) => d.id);
    assert.deepEqual(a, b);
    assert.ok(a.includes('norma-ley-32069'));
  });

  test('EPC = IPC = Ingeniería, Procura y Construcción', () => {
    const docs = [doc('epc', 'Firman contrato EPC para la planta'), doc('ipc', 'Nuevo contrato IPC en Arequipa'),
      doc('frase', 'Engineering, Procurement and Construction market grows'), doc('otro', 'Contrato EPCM de supervisión')];
    for (const consulta of ['EPC', 'ipc', 'Ingeniería, Procura y Construcción']) {
      assert.deepEqual(Motor.buscar(docs, { consulta }).map((d) => d.id).sort(), ['epc', 'frase', 'ipc'], consulta);
    }
  });

  test('commissioning = puesta en marcha = comisionamiento', () => {
    const docs = [doc('a', 'Commissioning of the new substation'), doc('b', 'Puesta en marcha de la planta de agua'),
      doc('c', 'Comisionamiento de sistemas'), doc('d', 'Marcha por la paz')];
    assert.deepEqual(Motor.buscar(docs, { consulta: 'puesta en marcha' }).map((d) => d.id).sort(), ['a', 'b', 'c']);
    assert.deepEqual(Motor.buscar(docs, { consulta: 'commissioning' }).map((d) => d.id).sort(), ['a', 'b', 'c']);
  });

  test('BIM = Building Information Modeling', () => {
    const ids = Motor.buscar(catalogo, { consulta: 'building information modeling' }).map((d) => d.id);
    assert.ok(ids.includes('libro-bim-handbook'));
    assert.ok(ids.includes('paper-succar-2009'));
    assert.deepEqual(Motor.buscar([doc('x', 'Bimestre de ventas')], { consulta: 'BIM' }), []);
  });

  test('O&M y APP también se entienden como siglas', () => {
    const docs = [doc('om', 'Contrato de operación y mantenimiento'), doc('app', 'Nueva APP de agua potable'),
      doc('ppp', 'Public-private partnership for roads')];
    assert.deepEqual(Motor.buscar(docs, { consulta: 'O&M' }).map((d) => d.id), ['om']);
    assert.deepEqual(Motor.buscar(docs, { consulta: 'asociación público-privada' }).map((d) => d.id).sort(), ['app', 'ppp']);
  });

  test('filtra por tipo; las normas aparecen junto a los papers', () => {
    const libros = Motor.buscar(catalogo, { consulta: 'Flyvbjerg', tipo: 'libro' });
    assert.ok(libros.length >= 2);
    assert.ok(libros.every((d) => d.tipo === 'libro'));
    assert.equal(Motor.buscar(catalogo, { consulta: 'Flyvbjerg', tipo: 'noticia' }).length, 0);
    const papers = Motor.buscar(catalogo, { tipo: 'paper' });
    assert.ok(papers.some((d) => d.tipo === 'norma'));
    assert.ok(papers.every((d) => d.tipo === 'paper' || d.tipo === 'norma'));
  });

  test('con texto o con tema, ordena de lo más reciente a lo más antiguo', () => {
    const docs = [doc('viejo', 'Licitación del puerto', '1999-06-26'), doc('medio', 'La licitación y el puerto', '2014-09'),
      doc('nuevo', 'Licitación', '2026-09-23T10:00:00.000Z')];
    assert.deepEqual(Motor.buscar(docs, { consulta: 'licitacion' }).map((d) => d.id), ['nuevo', 'medio', 'viejo']);
    assert.deepEqual(Motor.buscar(docs, { terminos: Temas.porId('procura').terminos }).map((d) => d.id), ['nuevo', 'medio', 'viejo']);
    assert.deepEqual(Motor.ordenarPorFecha([docs[0], docs[2], docs[1]]).map((d) => d.id), ['nuevo', 'medio', 'viejo']);
  });

  test('a igual fecha, el título pesa más que el resumen', () => {
    const docs = [doc('resumen', 'Informe anual', '2026-09-20', { resumen: 'Habla del valor ganado' }),
      doc('titulo', 'Valor ganado en obras', '2026-09-20')];
    assert.deepEqual(Motor.buscar(docs, { consulta: 'earned value' }).map((d) => d.id), ['titulo', 'resumen']);
  });

  test('sin coincidencias devuelve una lista vacía', () => {
    assert.deepEqual(Motor.buscar(catalogo, { consulta: 'zzzqqq' }), []);
  });

  test('sin texto ordena por fecha (incluye años a. C.)', () => {
    const libros = Motor.buscar(catalogo, { tipo: 'libro' });
    const valores = libros.map((d) => Motor.valorFecha(d.fecha));
    assert.deepEqual(valores, [...valores].sort((x, y) => y - x));
    assert.equal(libros[libros.length - 1].id, 'libro-vitruvio-arquitectura');
  });
});

describe('Temas sugeridos', () => {
  test('cinco grupos numerados con los 22 temas pedidos', () => {
    assert.deepEqual(Temas.grupos.map((g) => `${g.numero}. ${g.titulo}`), [
      '1. Planificación', '2. Métodos Constructivos y Sistemas de Soporte', '3. Tecnologías y Metodologías Integradas',
      '4. Ciclo de Vida y Fases del Proyecto', '5. Marcos de Gestión de Proyectos y Gobernanza']);
    assert.deepEqual(Temas.grupos.map((g) => g.temas.map((t) => t.etiqueta)), [
      ['AWP (Advanced Work Packaging)', 'Last Planner System (LPS)', 'PPM (Project Production Management)',
        'Constructabilidad e Ingeniería de Valor', 'Programación Rítmica y Líneas de Balance'],
      ['Métodos Constructivos', 'Sistemas de Encofrados', 'Andamios', 'Procesos Constructivos'],
      ['VDC (Virtual Design and Construction)', 'BIM', 'Gestión de la Información para la construcción',
        'IA y Automatización de Procesos', 'Construcción e Industrialización Digital'],
      ['Ingeniería y Diseño (FEED)', 'Procura y Contratos', 'Construcción y Montaje',
        'Puesta en Marcha (Commissioning)', 'Operación y Mantenimiento (O&M)'],
      ['PMBOK y Estándares del PMI', 'PRINCE2 (Gobernanza y Control)', 'IPMA (Modelo de Competencias ICB4)']]);
  });

  test('el ciclo de vida sigue el orden de las etapas, con su nota', () => {
    const ciclo = Temas.grupos.find((g) => g.id === 'ciclo');
    assert.deepEqual(ciclo.temas.map((t) => t.id), ['ingenieria', 'procura', 'construccion', 'puesta-marcha', 'operacion']);
    assert.equal(ciclo.nota, 'Las etapas de un proyecto, de la idea a la operación.');
  });

  test('cada tema tiene id único, grupo y entre 14 y 110 términos', () => {
    const temas = Temas.grupos.flatMap((g) => g.temas);
    assert.equal(temas.length, 22);
    assert.equal(new Set(temas.map((t) => t.id)).size, 22);
    const ids = Temas.grupos.map((g) => g.id);
    temas.forEach((t) => {
      assert.ok(t.terminos.length >= 14 && t.terminos.length <= 110, `${t.id}: ${t.terminos.length}`);
      assert.ok(ids.includes(t.grupo), t.id);
      // Los 8 primeros términos (los que van a GDELT) deben dejar al menos uno de 4 letras o más.
      assert.ok(Gdelt.terminosDeTema(t.terminos).length > 0, t.id);
    });
    assert.equal(Temas.porId('operacion').etiqueta, 'Operación y Mantenimiento (O&M)');
  });

  test('las siglas de cada tema exigen palabra exacta («BIM » no encuentra «bimestre»)', () => {
    const docs = [doc('a', 'Coordinación BIM del hospital'), doc('b', 'Ventas del bimestre'), doc('c', 'Andamios multidireccionales en altura')];
    assert.deepEqual(Motor.buscar(docs, { terminos: Temas.porId('bim').terminos }).map((x) => x.id), ['a']);
    assert.deepEqual(Motor.buscar(docs, { terminos: Temas.porId('andamios').terminos }).map((x) => x.id), ['c']);
    const awp = [doc('x', 'Advanced Work Packaging en minería'), doc('y', 'Nuevos paquetes de trabajo en planta')];
    assert.equal(Motor.buscar(awp, { terminos: Temas.porId('awp').terminos }).length, 2);
  });

  test('un tema encuentra documentos con cualquiera de sus términos', () => {
    const docs = [doc('a', 'Commissioning of a gas plant'), doc('b', 'Pruebas FAT en fábrica'),
      doc('c', 'Recepción de obra en Piura'), doc('d', 'Cumbre del clima')];
    assert.deepEqual(Motor.buscar(docs, { terminos: Temas.porId('puesta-marcha').terminos }).map((x) => x.id).sort(), ['a', 'b', 'c']);
  });

  test('respeta la palabra exacta: «ia » no encuentra «ingeniería»', () => {
    const docs = [doc('a', 'La IA llega a la obra'), doc('b', 'Ingeniería de detalle del hospital'), doc('c', 'Sensores en puentes')];
    assert.deepEqual(Motor.buscar(docs, { terminos: Temas.porId('ia-automatizacion').terminos }).map((x) => x.id).sort(), ['a', 'c']);
  });

  test('en GDELT, un tema se busca con OR entre sus términos principales', () => {
    const q = new URL(Gdelt.construirUrl('Puesta en Marcha', { terminos: Temas.porId('puesta-marcha').terminos })).searchParams.get('query');
    assert.match(q, /^\("puesta en marcha" OR commissioning OR comisionamiento OR /);
    assert.equal((q.match(/ OR /g) || []).length >= 7, true);
  });

  test('las siglas de 3 letras solo van a GDELT junto a otros términos', () => {
    const q = new URL(Gdelt.construirUrl('BIM', { terminos: Temas.porId('bim').terminos })).searchParams.get('query');
    assert.match(q, /^\(BIM OR "building information modeling" OR /);
    assert.deepEqual(Gdelt.terminosDeTema(['BIM ', 'EPC ']), []);
    assert.equal(Gdelt.construirUrl('x', { terminos: ['BIM ', 'ia '] }), null);
    assert.ok(!Gdelt.terminosDeTema(Temas.porId('ia-automatizacion').terminos).includes('ia'));
  });
});

describe('Fuente Crossref', () => {
  test('convierte un registro y solo ofrece descarga con licencia abierta', () => {
    const base = {
      DOI: '10.1234/abc',
      title: ['A <i>BIM</i> Paper'],
      author: [{ given: 'Ana', family: 'Pérez' }],
      issued: { 'date-parts': [[2020, 3]] },
      'container-title': ['Automation in Construction'],
      abstract: '<jats:p>Short abstract.</jats:p>',
      link: [{ URL: 'https://ejemplo.org/a.pdf', 'content-type': 'application/pdf' }]
    };
    const cerrado = Crossref.convertir(base);
    assert.equal(cerrado.titulo, 'A BIM Paper');
    assert.equal(cerrado.autor, 'Ana Pérez');
    assert.equal(cerrado.fecha, '2020-03');
    assert.equal(cerrado.resumen, 'Short abstract.');
    assert.equal(cerrado.descarga, null);
    const abierto = Crossref.convertir({ ...base, license: [{ URL: 'https://creativecommons.org/licenses/by/4.0/' }] });
    assert.equal(abierto.descarga.url, 'https://ejemplo.org/a.pdf');
  });

  test('con un tema busca en todas las editoriales de prestigio, solo en los últimos 12 meses', () => {
    const url = new URL(Crossref.construirUrl({ consulta: 'last planner system' }));
    assert.equal(url.hostname, 'api.crossref.org');
    assert.equal(url.searchParams.get('query'), 'last planner system');
    const filtro = url.searchParams.get('filter');
    assert.match(filtro, /prefix:10\.1061/); // ASCE
    assert.match(filtro, /prefix:10\.24928/); // IGLC (Lean Construction)
    assert.match(filtro, /type:proceedings-article/);
    assert.equal((filtro.match(/prefix:/g) || []).length, Fuentes.editorialesAcademicas.length);
    const desde = /from-pub-date:(\d{4}-\d{2}-\d{2})/.exec(filtro)[1];
    const dias = (Date.now() - Date.parse(desde)) / 86400000;
    assert.ok(dias > 363 && dias < 367, `desde ${desde}`);
  });

  test('sin tema (novedades) consulta las revistas núcleo desde una fecha', () => {
    const filtro = new URL(Crossref.construirUrl({ desde: '2026-09-19' })).searchParams.get('filter');
    assert.match(filtro, /issn:0733-9364/); // Journal of Construction Engineering and Management
    assert.match(filtro, /from-pub-date:2026-09-19/);
    assert.equal((filtro.match(/issn:/g) || []).length, Fuentes.revistas.length);
  });

  test('de Journal of Cleaner Production solo toma artículos sobre construcción', () => {
    const item = (titulo, revista) => ({ DOI: '10.1/' + titulo, title: [titulo], 'container-title': [revista] });
    const docs = Crossref.interpretar({ message: { items: [
      item('Embodied carbon in building construction', 'Journal of Cleaner Production'),
      item('Water use in dairy farms', 'Journal of Cleaner Production'),
      item('Scheduling with genetic algorithms', 'Journal of Construction Engineering and Management')
    ] } });
    assert.deepEqual(docs.map((d) => d.titulo), ['Embodied carbon in building construction', 'Scheduling with genetic algorithms']);
  });
});

describe('Fuente RSS', () => {
  test('lee titulares, enlaces, fechas y HTML escapado', () => {
    const xml = `<rss><channel>
      <item><title><![CDATA[Licitación del puerto]]></title><link>https://ejemplo.org/1</link>
        <description>&lt;p&gt;Obras &amp; más&lt;/p&gt;</description><pubDate>Tue, 22 Sep 2026 10:00:00 GMT</pubDate></item>
      <item><title>Sin enlace</title></item>
    </channel></rss>`;
    const noticias = rss.interpretarRss(xml, 'Medio de prueba');
    assert.equal(noticias.length, 1);
    assert.equal(noticias[0].titulo, 'Licitación del puerto');
    assert.equal(noticias[0].fecha, '2026-09-22T10:00:00.000Z');
    assert.equal(noticias[0].resumen, 'Obras & más');
    assert.equal(noticias[0].tipo, 'noticia');
  });

  test('también entiende feeds Atom', () => {
    const xml = `<feed><entry><title>New bridge opens</title>
      <link rel="alternate" href="https://ejemplo.org/t"/><updated>2026-09-24T08:00:00Z</updated>
      <summary>Details</summary></entry></feed>`;
    const [n] = rss.interpretarRss(xml, { nombre: 'Atom', especializado: true, idioma: 'en' });
    assert.equal(n.enlace, 'https://ejemplo.org/t');
    assert.equal(n.fecha, '2026-09-24T08:00:00.000Z');
    assert.equal(n.idioma, 'en');
  });

  test('de un medio general solo toma noticias del sector', () => {
    const xml = `<rss><channel>
      <item><title>MTC adjudica la carretera Longitudinal de la Sierra</title><link>https://ejemplo.org/a</link></item>
      <item><title>Gana el equipo local</title><link>https://ejemplo.org/b</link></item>
    </channel></rss>`;
    const general = rss.interpretarRss(xml, { nombre: 'Diario', especializado: false, idioma: 'es' });
    assert.deepEqual(general.map((n) => n.titulo), ['MTC adjudica la carretera Longitudinal de la Sierra']);
    assert.equal(rss.interpretarRss(xml, { nombre: 'Revista', especializado: true }).length, 2);
  });

  test('Google Noticias por sitio: titular limpio y edición según el idioma', () => {
    const power = Fuentes.medios.find((m) => m.id === 'power-eng');
    const capeco = Fuentes.medios.find((m) => m.id === 'capeco');
    assert.match(rss.urlDe(power), /news\.google\.com\/rss\/search\?q=site%3Apower-eng\.com\+when%3A7d&hl=en-US&gl=US&ceid=US%3Aen/);
    assert.match(rss.urlDe(capeco), /q=site%3Acapeco\.org\+when%3A7d&hl=es-419&gl=PE&ceid=PE%3Aes-419/);
    const xml = `<rss><item><title>New gas turbine plant enters commercial operation - Power Engineering</title>
      <link>https://news.google.com/rss/articles/abc</link><pubDate>Fri, 25 Sep 2026 10:00:00 GMT</pubDate>
      <description>&lt;a href="x"&gt;New gas turbine&lt;/a&gt; Power Engineering</description></item></rss>`;
    const [n] = rss.interpretarRss(xml, power);
    assert.equal(n.titulo, 'New gas turbine plant enters commercial operation');
    assert.equal(n.fuente, 'Power Engineering');
    assert.match(n.resumen, /^Publicado por Power Engineering\. Pulse «Visitar enlace» para leerlo completo\.$/);
  });

  test('las entidades públicas se buscan en gob.pe por su nombre (Google Noticias no admite rutas)', () => {
    const entidades = Fuentes.medios.filter((m) => m.tipoFuente === 'Entidad pública' && m.googleNoticias);
    assert.ok(entidades.length >= 6);
    entidades.forEach((m) => assert.doesNotMatch(m.googleNoticias, /site:[^ ]+\//, m.id));
  });
});

describe('Fuentes de prestigio', () => {
  test('cada medio tiene nombre, idioma, ámbito y dirección segura', () => {
    for (const m of Fuentes.medios) {
      assert.ok(m.id && m.nombre && m.tipoFuente, m.id);
      assert.ok(['es', 'en'].includes(m.idioma), m.id);
      assert.match(rss.urlDe(m), /^https:\/\//, m.id);
      assert.ok(['nacional', 'internacional'].includes(m.ambito), m.id);
      assert.equal(typeof m.especializado, 'boolean', m.id);
    }
    assert.equal(new Set(Fuentes.medios.map((m) => m.id)).size, Fuentes.medios.length);
    assert.ok(Fuentes.revistas.every((r) => /^\d{4}-\d{3}[\dX]$/.test(r.issn)));
    assert.equal(Fuentes.revistas.length, 20);
  });

  test('la relevancia reconoce el sector y las siglas en mayúsculas', () => {
    assert.equal(Fuentes.esRelevante('Licitación del puerto de Chancay', ''), true);
    assert.equal(Fuentes.esRelevante('Gobierno prioriza nueva APP hospitalaria', ''), true);
    assert.equal(Fuentes.esRelevante('New power plant commissioning in Texas', ''), true);
    assert.equal(Fuentes.esRelevante('Lanzan una app de delivery', ''), false);
    assert.equal(Fuentes.esRelevante('Portugal gana el partido', ''), false);
    assert.equal(Fuentes.esRelevante('Receta de pan casero', ''), false);
  });

  test('editoriales de prestigio del sector', () => {
    assert.ok(Fuentes.esEditorialPrestigio('John Wiley & Sons'));
    assert.ok(Fuentes.esEditorialPrestigio('ICE Publishing'));
    assert.ok(Fuentes.esEditorialPrestigio('Editorial Reverté'));
    assert.ok(!Fuentes.esEditorialPrestigio('Imprenta del Barrio'));
  });
});

describe('Buscador de noticias (GDELT)', () => {
  test('busca la frase exacta solo en sitios de prestigio, lo más nuevo primero', () => {
    const url = new URL(Gdelt.construirUrl('puerto de chancay'));
    const q = url.searchParams.get('query');
    assert.match(q, /^"puerto chancay" \(domainis:elcomercio\.pe OR /);
    assert.match(q, /domainis:enr\.com/);
    assert.match(q, /domainis:gob\.pe/);
    assert.equal(url.searchParams.get('sort'), 'DateDesc');
    assert.equal(url.searchParams.get('maxrecords'), '75');
    assert.equal(Gdelt.construirUrl('a y o'), null); // palabras demasiado cortas
  });

  test('convierte artículos, separa nacional e internacional y descarta sitios no incluidos', () => {
    const json = JSON.stringify({ articles: [
      { url: 'https://gestion.pe/economia/nota-1', title: 'Chancay: nueva etapa', seendate: '20260925T143000Z', domain: 'gestion.pe', language: 'Spanish' },
      { url: 'https://www.enr.com/articles/x', title: 'Mega port in Peru', seendate: '20260924T090000Z', domain: 'enr.com', language: 'English' },
      { url: 'https://www.gob.pe/institucion/mtc/noticias/1', title: 'MTC inaugura puente', seendate: '20260923T090000Z', domain: 'gob.pe', language: 'Spanish' },
      { url: 'https://blog-desconocido.com/x', title: 'Rumor sin fuente', seendate: '20260926T090000Z', domain: 'blog-desconocido.com', language: 'Spanish' }
    ] });
    const docs = Gdelt.interpretar(json);
    assert.equal(docs.length, 3);
    assert.equal(docs[0].ambito, 'nacional');
    assert.equal(docs[0].fuente, 'Gestión');
    assert.equal(docs[0].fecha, '2026-09-25T14:30:00.000Z');
    assert.equal(docs[1].ambito, 'internacional');
    assert.equal(docs[1].idioma, 'en');
    assert.equal(docs[2].ambito, 'nacional');
    assert.match(docs[0].resumen, /^Noticia de Gestión\. Pulse «Visitar enlace» para leerla completa\.$/);
    assert.deepEqual(Gdelt.interpretar('Your query was too short'), []);
  });
});

describe('Libros recientes', () => {
  const volumen = (editorial, fecha) => ({ id: 'x' + editorial + fecha, volumeInfo: {
    title: 'Construction Project Management', publisher: editorial, publishedDate: fecha, authors: ['A. Autor'], description: 'Texto.'
  } });

  test('solo acepta editoriales de prestigio y años recientes', () => {
    const docs = Libros.interpretarGoogle({ items: [
      volumen('Routledge', '2025-03-01'),
      volumen('Editorial Desconocida', '2025-01-01'),
      volumen('Wiley', '2019')
    ] }, 2023);
    assert.equal(docs.length, 1);
    assert.equal(docs[0].fuente, 'Routledge');
    assert.equal(docs[0].tipo, 'libro');
  });

  test('Crossref también entrega libros recientes de editoriales académicas', () => {
    const url = new URL(Crossref.construirUrl({ consulta: 'building information modeling', libros: true }));
    const filtro = url.searchParams.get('filter');
    assert.match(filtro, /type:book/);
    assert.match(filtro, /prefix:10\.4324/); // Routledge
    assert.match(filtro, /from-pub-date:/);
    const [libro] = Crossref.interpretar({ message: { items: [{ DOI: '10.4324/x', type: 'book', title: ['BIM for Owners'],
      publisher: 'Routledge', issued: { 'date-parts': [[2026, 3]] }, author: [{ given: 'A.', family: 'Autor' }] }] } });
    assert.equal(libro.tipo, 'libro');
    assert.equal(libro.fuente, 'Routledge');
    assert.match(libro.resumen, /^Libro publicado por Routledge/);
  });

  test('Open Library como fuente efectiva', () => {
    const docs = Libros.interpretarOpenLibrary({ docs: [
      { key: '/works/OL1W', title: 'Gestión de obras en el Perú', publisher: ['Fondo Editorial PUCP'], first_publish_year: 2024 },
      { key: '/works/OL2W', title: 'Otro', publisher: ['Imprenta X'], first_publish_year: 2025 }
    ] }, 2023);
    assert.equal(docs.length, 1);
    assert.equal(docs[0].ambito, 'nacional');
    assert.equal(docs[0].enlace, 'https://openlibrary.org/works/OL1W');
  });
});

describe('Nacional o internacional', () => {
  test('según la fuente', () => {
    assert.equal(Fuentes.ambitoDe({ tipo: 'noticia', enlace: 'https://rpp.pe/economia/x' }), 'nacional');
    assert.equal(Fuentes.ambitoDe({ tipo: 'noticia', enlace: 'https://proinversion.gob.pe/x' }), 'nacional');
    assert.equal(Fuentes.ambitoDe({ tipo: 'noticia', enlace: 'https://www.constructiondive.com/x' }), 'internacional');
    const xml = '<rss><item><title>Contrato de concesión firmado</title><link>https://gestion.pe/x</link></item></rss>';
    const [n] = rss.interpretarRss(xml, Fuentes.medios.find((m) => m.id === 'gestion'));
    assert.equal(n.ambito, 'nacional');
  });

  test('sin fuente, según el tema (Chancay, ProInversión → nacional)', () => {
    assert.equal(Fuentes.ambitoDe({ tipo: 'paper', titulo: 'Port-led development: the case of Chancay' }), 'nacional');
    assert.equal(Fuentes.ambitoDe({ tipo: 'libro', titulo: 'Las concesiones de ProInversión' }), 'nacional');
    assert.equal(Fuentes.ambitoDe({ tipo: 'paper', titulo: 'Metro de Lima: lecciones' }), 'nacional');
    assert.equal(Fuentes.ambitoDe({ tipo: 'libro', titulo: 'BIM Handbook' }), 'internacional');
  });
});

describe('Período y relación con los temas', () => {
  const ahora = new Date('2026-09-27T12:00:00Z');

  test('por defecto, solo el último año (365 días), también para noticias', () => {
    assert.equal(Motor.PERIODO_POR_DEFECTO, 1);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2024-11-03' }, ahora), false);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2025-08-01' }, ahora), false);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2025-10-15' }, ahora), true);
    assert.equal(Motor.vigente({ tipo: 'noticia', fecha: '2026-01-10T00:00:00Z' }, ahora), true);
    assert.equal(Motor.vigente({ tipo: 'noticia', fecha: '2025-06-01T00:00:00Z' }, ahora), false);
    assert.equal(Motor.vigente({ tipo: 'libro', fecha: '2025' }, ahora), true);
    assert.equal(Motor.vigente({ tipo: 'libro', fecha: '2024' }, ahora), false);
    assert.equal(Motor.vigente({ tipo: 'libro', fecha: '2027' }, ahora), false);
  });

  test('se puede elegir 2 o 5 años o todo el tiempo', () => {
    assert.deepEqual(Motor.PERIODOS.map((p) => p.anios), [1, 2, 5, 0]);
    const paper2024 = { tipo: 'paper', fecha: '2024-11-03' };
    assert.equal(Motor.vigente(paper2024, ahora, 2), true);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2022-01-01' }, ahora, 3), false);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2022-01-01' }, ahora, 5), true);
    assert.equal(Motor.vigente({ tipo: 'libro', fecha: '-0015' }, ahora, 0), true);
    assert.equal(Motor.inicioDePeriodo(1, ahora), '2025-09-27');
    assert.equal(Motor.inicioDePeriodo(0, ahora), null);
  });

  test('normas: solo las que están en vigor; nunca el contenido de ejemplo', () => {
    assert.equal(Motor.vigente(catalogo.find((d) => d.id === 'norma-ley-32069'), ahora), true);
    assert.equal(Motor.vigente(catalogo.find((d) => d.id === 'norma-guia-app-banco-mundial'), ahora, 0), false);
    assert.equal(Motor.vigente(catalogo.find((d) => d.tipo === 'noticia'), ahora, 0), false);
  });

  test('los clásicos del catálogo solo aparecen si el período los abarca', () => {
    assert.deepEqual(Motor.aptos(catalogo, ahora).map((d) => d.id).sort(), ['norma-g050', 'norma-ley-32069']);
    const todo = Motor.aptos(catalogo, ahora, 0).map((d) => d.id);
    assert.ok(todo.includes('paper-ballard-2000'));
    assert.ok(todo.includes('libro-bim-handbook'));
  });

  test('relación directa, indirecta o ninguna con los temas', () => {
    const [directo] = Motor.temasDe(doc('a', 'Lessons from Advanced Work Packaging in mining'));
    assert.deepEqual([directo.id, directo.directo], ['awp', true]);
    const indirecto = Motor.temasDe(doc('b', 'La nueva planta de agua entra en operación en Piura'));
    assert.ok(indirecto.some((t) => t.id === 'puesta-marcha' && !t.directo));
    assert.equal(Motor.esDeLosTemas(doc('c', 'Gana el equipo local')), false);
    // La fuente no cuenta: que el medio se llame «Construction Dive» no basta.
    assert.equal(Motor.esDeLosTemas(doc('d', 'Housing prices fall', '2026-09-20', { fuente: 'Construction Dive' })), false);
  });

  test('se descartan avisos de empleo, cursos y sitios no selectos', () => {
    const empleo = doc('e', 'Assistant BIM Designer in Cardiff, Glamorgan, United Kingdom', '2026-09-25');
    assert.equal(Fuentes.esDescartable(empleo), true);
    assert.equal(Fuentes.esDescartable(doc('f', 'Analista BIM', '2026-09-25', { enlace: 'https://www.bumeran.com.pe/x' })), true);
    assert.equal(Fuentes.esDescartable(doc('g', 'Obras en curso en Lima con BIM')), false);
    assert.deepEqual(Motor.aptos([empleo], new Date('2026-09-27')), []);
    assert.equal(Fuentes.esFuenteSelecta('https://noticias.upc.edu.pe'), true);
    assert.equal(Fuentes.esFuenteSelecta('https://www.mef.gob.pe'), true);
    assert.equal(Fuentes.esFuenteSelecta('https://blog-cualquiera.com'), false);
  });

  test('la tarjeta indica el tema de cada resultado (código de la interfaz)', () => {
    const codigo = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'js', 'interfaz.js'), 'utf8');
    assert.match(codigo, /'Tema: ' \+ temas\[0\]\.etiqueta/);
  });
});

describe('Búsqueda abierta con selectividad', () => {
  const OpenAlex = require('../public/js/openalex.js');
  const google = require('../servidor/fuentes/noticias-google');
  const { ventanas, ventanasDeHoy } = require('../servidor/ventanas');

  test('OpenAlex: busca en título y resumen, por período y, si se pide, autores del Perú', () => {
    const url = new URL(OpenAlex.construirUrl({ consulta: '"building information modeling", BIM', desde: '2025-09-27', pais: 'PE' }));
    assert.equal(url.hostname, 'api.openalex.org');
    const filtro = url.searchParams.get('filter');
    assert.match(filtro, /^title_and_abstract\.search:"building information modeling"  BIM,/);
    assert.match(filtro, /from_publication_date:2025-09-27/);
    assert.match(filtro, /authorships\.countries:PE/);
    assert.equal(url.searchParams.get('sort'), 'publication_date:desc');
    assert.equal(OpenAlex.construirUrl({ consulta: '' }), null);
  });

  test('OpenAlex: solo revistas indexadas o de editoriales de prestigio; autores peruanos = nacional', () => {
    const obra = (titulo, fuente, extra = {}) => ({ id: 'W' + titulo, title: titulo, publication_date: '2026-06-01',
      primary_location: { source: { display_name: 'Revista', ...fuente } }, authorships: [], ...extra });
    const docs = OpenAlex.interpretar({ results: [
      obra('BIM adoption in Peruvian public works', { is_core: true }, { authorships: [{ author: { display_name: 'Ana Q.' }, countries: ['PE'] }],
        abstract_inverted_index: { Building: [0], information: [1], modeling: [2] } }),
      obra('BIM in small firms', { is_core: false, is_in_doaj: true }),
      obra('Last Planner in IGLC', { is_core: false }, { doi: 'https://doi.org/10.24928/2026/0001' }),
      obra('BIM blog post', { is_core: false, is_in_doaj: false })
    ] });
    assert.deepEqual(docs.map((d) => d.titulo), ['BIM adoption in Peruvian public works', 'BIM in small firms', 'Last Planner in IGLC']);
    assert.equal(docs[0].ambito, 'nacional');
    assert.equal(docs[0].resumen, 'Building information modeling');
    assert.match(docs[0].tipoFuente, /indexada/);
  });

  test('Google Noticias: consultas del Perú y del mundo por ventana de tiempo', () => {
    const bim = Temas.porId('bim');
    const [anio, dosAnios] = ventanas(new Date('2026-09-27T12:00:00Z'));
    const nac = new URL(google.urlTema(bim, 'nacional', anio));
    assert.match(nac.searchParams.get('q'), /Perú when:1y$/);
    assert.equal(nac.searchParams.get('gl'), 'PE');
    const int = new URL(google.urlTema(bim, 'internacional', dosAnios));
    assert.match(int.searchParams.get('q'), /after:2024-09-27 before:2025-09-27$/);
    assert.equal(int.searchParams.get('gl'), 'US');
  });

  test('Google Noticias: solo fuentes selectas, sin empleos; lo peruano es nacional', () => {
    const item = (titulo, url, fecha = 'Fri, 25 Sep 2026 10:00:00 GMT') =>
      `<item><title>${titulo}</title><link>https://news.google.com/rss/articles/${encodeURIComponent(titulo)}</link><pubDate>${fecha}</pubDate><source url="${url}">Fuente</source></item>`;
    const xml = '<rss>' + [
      item('MEF confirma: uso del BIM es obligatorio - Gestión', 'https://gestion.pe'),
      item('UPC realizará evento sobre BIM en Arequipa - Noticias UPC', 'https://noticias.upc.edu.pe'),
      item('Analista BIM - Bumeran', 'https://www.bumeran.com.pe'),
      item('BIM market worth $5 billion - Markets', 'https://www.marketsandmarkets.com'),
      item('Uso de BIM en obras - Blog', 'https://blog-cualquiera.com')
    ].join('') + '</rss>';
    const docs = google.interpretar(xml, 'nacional');
    assert.deepEqual(docs.map((d) => d.titulo), ['MEF confirma: uso del BIM es obligatorio', 'UPC realizará evento sobre BIM en Arequipa']);
    assert.ok(docs.every((d) => d.ambito === 'nacional'));
    assert.equal(docs[0].fuente, 'Gestión');
  });

  test('ventanas: siempre el último año y una más antigua que rota', () => {
    const lista = ventanas(new Date('2026-09-27T12:00:00Z'));
    assert.deepEqual(lista.map((v) => v.id), ['anio-1', 'anio-2', 'anio-3', 'anio-4', 'anio-5', 'antes']);
    const hoy = ventanasDeHoy(new Date('2026-09-27T12:00:00Z'), false);
    assert.equal(hoy.length, 2);
    assert.equal(hoy[0].id, 'anio-1');
    assert.equal(ventanasDeHoy(new Date(), true).length, 6);
  });
});

describe('Archivo histórico', () => {
  const archivo = require('../servidor/archivo');
  test('suma lo nuevo, quita repetidos y lo que no es de los temas; conserva lo antiguo', () => {
    const ahora = new Date('2026-09-26T12:00:00Z');
    const n = (id, fecha, enlace = 'https://x.pe/' + id) => ({ id, tipo: 'noticia', titulo: 'Avance de obra ' + id, resumen: 'r', fecha, enlace });
    const anteriores = [n('a', '2026-09-01T00:00:00Z'), n('viejo', '2021-05-01T00:00:00Z'), n('b', '2026-09-20T00:00:00Z')];
    const nuevas = [n('c', '2026-09-26T08:00:00Z'), n('b', '2026-09-20T00:00:00Z')];
    assert.deepEqual(archivo.unir(anteriores, nuevas, ahora).map((d) => d.id), ['c', 'b', 'a', 'viejo']);
    const ajena = { id: 'x', tipo: 'noticia', titulo: 'Gana el equipo local', resumen: '', fecha: '2026-09-25T00:00:00Z', enlace: 'https://x.pe/x' };
    assert.deepEqual(archivo.unir([ajena], [], ahora), []);
  });

  test('se divide en último año e histórico, con un máximo de elementos', () => {
    const ahora = new Date('2026-09-26T12:00:00Z');
    const n = (id, fecha) => ({ id, tipo: 'noticia', titulo: 'Obra vial ' + id, resumen: 'Palabra '.repeat(80), fecha, enlace: 'https://x.pe/' + id });
    const lista = archivo.unir([], [n('1', '2026-09-20T00:00:00Z'), n('2', '2023-01-01T00:00:00Z'), n('3', '2019-01-01T00:00:00Z')], ahora, 2);
    assert.equal(lista.length, 2);
    assert.ok(lista[0].resumen.length <= 201);
    const { anio, historico } = archivo.dividir(lista, ahora);
    assert.deepEqual([anio.length, historico.length], [1, 1]);
  });
});

describe('Novedades de la última semana', () => {
  test('solo últimos 7 días, sin duplicados, de lo más nuevo a lo más antiguo', async () => {
    const ahora = new Date('2026-09-26T12:00:00Z');
    const rssFalso = `<rss><channel>
      <item><title>Nueva licitación del puerto de Chancay</title><link>https://ejemplo.org/1</link><pubDate>Thu, 24 Sep 2026 10:00:00 GMT</pubDate></item>
      <item><title>Firman contrato EPC para planta de agua</title><link>https://ejemplo.org/2</link><pubDate>Fri, 25 Sep 2026 10:00:00 GMT</pubDate></item>
      <item><title>Obra antigua inaugurada</title><link>https://ejemplo.org/3</link><pubDate>Mon, 07 Sep 2026 10:00:00 GMT</pubDate></item>
      <item><title>Gana el equipo local</title><link>https://ejemplo.org/4</link><pubDate>Fri, 25 Sep 2026 11:00:00 GMT</pubDate></item>
    </channel></rss>`;
    const crossrefFalso = { message: { items: [{
      DOI: '10.1/x', title: ['Digital twins for construction sites'], issued: { 'date-parts': [[2026, 9, 23]] },
      'container-title': ['Automation in Construction']
    }] } };
    const fetchOriginal = global.fetch;
    global.fetch = async (url) => {
      if (String(url).startsWith('https://api.crossref.org')) {
        return new Response(JSON.stringify(crossrefFalso), { status: 200 });
      }
      if (String(url).includes('bbci')) return new Response('', { status: 500 }); // un medio caído
      return new Response(rssFalso, { status: 200 });
    };
    try {
      const semana = await obtenerSemana({ ahora, esperaMs: 1000 });
      assert.deepEqual(semana.resultados.map((d) => d.titulo),
        ['Firman contrato EPC para planta de agua', 'Nueva licitación del puerto de Chancay', 'Digital twins for construction sites']);
      assert.equal(semana.dias, 7);
      assert.ok(semana.generado);
      assert.ok(semana.fuentes.some((f) => f.fuente === 'BBC Mundo' && !f.ok), 'informa del medio caído');
      assert.ok(semana.fuentes.some((f) => f.fuente.includes('Crossref') && f.ok));
    } finally {
      global.fetch = fetchOriginal;
    }
  });

  test('si ninguna fuente responde, lo indica (generado = null)', async () => {
    const fetchOriginal = global.fetch;
    global.fetch = async () => { throw new Error('sin internet'); };
    try {
      const semana = await obtenerSemana({ esperaMs: 500 });
      assert.equal(semana.generado, null);
      assert.deepEqual(semana.resultados, []);
    } finally {
      global.fetch = fetchOriginal;
    }
  });

  test('los archivos de datos publicados tienen el formato esperado', () => {
    const semana = require('../public/datos/ultima-semana.json');
    assert.ok('generado' in semana && Array.isArray(semana.resultados) && semana.dias === 7);
    for (const c of ['noticias', 'papers', 'libros']) {
      for (const parte of ['anio', 'historico']) {
        assert.ok(Array.isArray(require(`../public/datos/${c}-${parte}.json`).resultados), `${c}-${parte}`);
      }
    }
  });
});

describe('Biblioteca personal', () => {
  test('recuerda el capítulo de cada párrafo e ignora líneas cortas', () => {
    const largo = 'La puesta en marcha exige pruebas de cada sistema antes de la entrega al cliente. '.repeat(3);
    const texto = `# CAPÍTULO CINCO \n\nComisionamiento de plantas\n\nCorto.\n\n${largo}\n`;
    const parrafos = biblioteca.indexarTexto(texto);
    assert.equal(parrafos.length, 1);
    assert.equal(parrafos[0].capitulo, 'Capítulo cinco: Comisionamiento de plantas');
  });
});

describe('Servidor', () => {
  let servidor;
  let base;

  before(async () => {
    servidor = require('../servidor');
    await new Promise((ok) => servidor.listen(0, ok));
    base = `http://127.0.0.1:${servidor.address().port}`;
  });
  after(() => servidor.close());

  test('entrega la página principal', async () => {
    const r = await fetch(base + '/');
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /Construcción Global/);
    assert.match(html, /window\.CG_VERSION/);
  });

  test('responde el estado', async () => {
    const datos = await (await fetch(base + '/api/estado')).json();
    assert.equal(datos.ok, true);
    assert.equal(datos.fuentesEnVivo, false);
  });

  test('busca por API, respeta el filtro y solo muestra lo vigente', async () => {
    const datos = await (await fetch(base + '/api/buscar?q=contrataciones&tipo=paper')).json();
    assert.ok(datos.resultados.some((d) => d.id === 'norma-ley-32069'));
    assert.ok(datos.resultados.every((d) => d.tipo === 'paper' || d.tipo === 'norma'));
    // Los clásicos del catálogo (Flyvbjerg 2003, 2023…) ya no se muestran: no son de los últimos 12 meses.
    const clasicos = await (await fetch(base + '/api/buscar?q=Flyvbjerg')).json();
    assert.equal(clasicos.total, 0);
  });

  test('el período se elige con p= (0 = todo el tiempo)', async () => {
    const anio = await (await fetch(base + '/api/buscar?q=Last%20Planner')).json();
    assert.equal(anio.anios, 1);
    assert.ok(!anio.resultados.some((d) => d.id === 'paper-ballard-2000'));
    const todo = await (await fetch(base + '/api/buscar?q=Last%20Planner&p=0')).json();
    assert.equal(todo.anios, 0);
    assert.ok(todo.resultados.some((d) => d.id === 'paper-ballard-2000'));
  });

  test('busca un tema por sus términos (t=)', async () => {
    const t = encodeURIComponent(Temas.porId('andamios').terminos.join('|'));
    const datos = await (await fetch(base + '/api/buscar?q=Andamios&t=' + t)).json();
    assert.ok(datos.resultados.some((d) => d.id === 'norma-g050'));
  });

  test('entrega las novedades de la semana (vacías si no hay internet)', async () => {
    const datos = await (await fetch(base + '/api/semana')).json();
    assert.equal(datos.dias, 7);
    assert.ok(Array.isArray(datos.resultados));
  });

  test('un tipo desconocido se trata como "todos"', async () => {
    const datos = await (await fetch(base + '/api/buscar?q=BIM&tipo=<script>')).json();
    assert.equal(datos.tipo, 'todos');
  });

  test('no permite salir de la carpeta public', async () => {
    const r = await fetch(base + '/%2e%2e/servidor.js');
    assert.notEqual(r.status, 200);
  });

  test('la dirección /construccion/ lleva a la página principal', async () => {
    const r = await fetch(base + '/construccion/index.html');
    assert.equal(r.status, 200);
    assert.match(await r.text(), /url=\.\.\//);
  });

  test('descarga con un clic: entrega el archivo con su nombre', async () => {
    const http = require('http');
    const origen = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/pdf' });
      res.end('%PDF-prueba');
    });
    await new Promise((ok) => origen.listen(0, ok));
    const d = catalogo.find((x) => x.id === 'paper-koskela-1992');
    const urlOriginal = d.descarga.url;
    d.descarga.url = `http://127.0.0.1:${origen.address().port}/tr072.pdf`;
    try {
      const r = await fetch(base + '/api/descargar/paper-koskela-1992');
      assert.equal(r.status, 200);
      assert.match(r.headers.get('content-disposition'), /attachment; filename="Koskela-1992-New-Production-Philosophy\.pdf"/);
      assert.equal(await r.text(), '%PDF-prueba');
    } finally {
      d.descarga.url = urlOriginal;
      origen.close();
    }
  });

  test('no descarga documentos que no son de acceso libre', async () => {
    const r = await fetch(base + '/api/descargar/libro-bim-handbook');
    assert.equal(r.status, 404);
  });
});

describe('Botón de descarga cuando el documento es de acceso libre', () => {
  const OpenAlex = require('../public/js/openalex.js');

  test('OpenAlex: usa el PDF de otra ubicación abierta si la mejor no lo tiene', () => {
    const d = OpenAlex.convertir({
      id: 'https://openalex.org/W1', doi: 'https://doi.org/10.1/x', title: 'BIM in construction',
      best_oa_location: { landing_page_url: 'https://x.org' },
      locations: [{ pdf_url: null }, { pdf_url: 'https://arxiv.org/pdf/1.pdf' }],
      authorships: [], primary_location: { source: {} }
    });
    assert.equal(d.descarga.url, 'https://arxiv.org/pdf/1.pdf');
  });

  test('OpenAlex: sin PDF abierto no hay descarga', () => {
    const d = OpenAlex.convertir({ id: 'W2', title: 'T', authorships: [], primary_location: { source: {} }, open_access: { oa_url: 'https://x.org/page' } });
    assert.equal(d.descarga, null);
  });

  test('Open Library: libro de dominio público se descarga de Internet Archive', () => {
    const editorial = 'Routledge';
    const libre = Libros.convertirOpenLibrary({ key: '/works/OL1W', title: 'Libro', publisher: [editorial], ebook_access: 'public', ia: ['libro00'] });
    assert.equal(libre.descarga.url, 'https://archive.org/download/libro00/libro00.pdf');
    const prestado = Libros.convertirOpenLibrary({ key: '/works/OL2W', title: 'Otro', publisher: [editorial], ebook_access: 'borrowable', ia: ['otro00'] });
    assert.equal(prestado.descarga, null);
  });

  test('RSS: una publicación que es un PDF se puede descargar', () => {
    const xml = '<rss><channel><item><title>Informe de obras 2026</title><link>https://www.gob.pe/informe.pdf</link><pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate></item>' +
      '<item><title>Nota sobre obras</title><link>https://www.gob.pe/nota</link><pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate></item></channel></rss>';
    const [pdf, nota] = rss.interpretarRss(xml, { nombre: 'Gobierno', especializado: true, idioma: 'es' });
    assert.equal(pdf.descarga.url, 'https://www.gob.pe/informe.pdf');
    assert.equal(nota.descarga, null);
  });

  test('el botón de descarga tiene un color propio (Solar Gold)', () => {
    const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'css', 'estilos.css'), 'utf8');
    assert.match(css, /\.boton-descarga \{ background: var\(--oro\)/);
  });
});

describe('Gestión contractual, impactos, reajustes y riesgos', () => {
  const tema = (titulo) => Motor.temasDe({ titulo, resumen: '', etiquetas: [] }).map((t) => t.id);

  test('se relacionan con los temas', () => {
    assert.ok(tema('Aprueban adicional de obra y deductivo en hospital de Piura').includes('procura'));
    assert.ok(tema('INEI publica los índices unificados para la fórmula polinómica de reajuste').includes('procura'));
    assert.ok(tema('Contratista pide ampliación de plazo por lluvias').includes('procura'));
    assert.ok(tema('Delay analysis and schedule impact in highway projects').includes('construccion'));
    assert.ok(tema('Obra paralizada: impacto en el costo y en la calidad').includes('construccion'));
    assert.ok(tema('Gestión de riesgos y reserva de contingencia en proyectos mineros').includes('pmbok'));
    assert.ok(tema('Monte Carlo simulation for cost contingency in construction').includes('pmbok'));
  });

  test('estándares contractuales y modelos de entrega se relacionan con «Procura y Contratos»', () => {
    for (const titulo of [
      'FIDIC publica la segunda edición del Emerald Book para túneles',
      'NEC4 early warning notice and programme management',
      'JCT contract update for residential building',
      'Using the Geotechnical Baseline Report in tunnelling contracts',
      'MTC firma adenda de la asociación público privada del puerto',
      'Public-private partnership availability payment for hospitals',
      'Project alliance with pain gain share and no-dispute clause',
      'EPCM contract awarded for copper concentrator',
      'Contrato llave en mano para planta desaladora'
    ]) assert.ok(tema(titulo).includes('procura'), titulo);
  });

  test('hay búsquedas adicionales para cada aspecto, ligadas a un tema existente', () => {
    const ids = Temas.busquedasAdicionales.map((b) => b.id);
    assert.deepEqual(ids, ['gestion-contractual', 'reajustes', 'impactos', 'riesgos', 'estandares-contractuales', 'modelos-entrega']);
    for (const b of Temas.busquedasAdicionales) {
      assert.ok(Temas.porId(b.tema), b.id);
      assert.ok(b.academica && b.noticias.es && b.noticias.en && b.openalex, b.id);
    }
    assert.equal(Temas.consultas.length, 22 + 6);
  });

  test('las nuevas entidades están entre las fuentes selectas', () => {
    for (const id of ['inei-indices', 'tribunal-contrataciones', 'arbitraje-pucp', 'fidic', 'nec', 'scl', 'hka', 'jct', 'ppp-knowledge-lab', 'icw', 'ositran', 'afin']) {
      assert.ok(Fuentes.medios.some((m) => m.id === id), id);
    }
    for (const host of ['fidic.org', 'scl.org.uk', 'globalarbitrationreview.com', 'theirm.org']) {
      assert.ok(Fuentes.esFuenteSelecta('https://www.' + host + '/noticia'), host);
    }
  });
});

describe('Términos amplios y sinónimos de impactos', () => {
  const tema = (doc) => Motor.temasDe({ resumen: '', etiquetas: [], ...doc }).map((t) => t.id);

  test('un término amplio solo cuenta si el resultado habla de construcción', () => {
    assert.deepEqual(tema({ titulo: 'Impacto a largo plazo del tratamiento sobre la variabilidad de frecuencia cardiaca', fuente: 'Archivos de Bronconeumología' }), []);
    assert.deepEqual(tema({ titulo: 'Artificial intelligence for PFAS toxicology and risk assessment', fuente: 'Discover Artificial Intelligence' }), []);
    assert.deepEqual(tema({ titulo: 'Plan de contingencia ante lluvias en colegios', fuente: 'Andina' }), []);
    assert.ok(tema({ titulo: 'Reducing variability in construction production flow', fuente: 'Journal of Construction Engineering and Management' }).includes('ppm'));
    assert.ok(tema({ titulo: 'Artificial intelligence on the jobsite', fuente: 'Construction Dive' }).includes('ia-automatizacion'));
    assert.ok(tema({ titulo: 'La inteligencia artificial llega a las obras públicas', fuente: 'Gestión' }).includes('ia-automatizacion'));
  });

  test('los términos propios del sector no necesitan contexto', () => {
    assert.ok(tema({ titulo: 'Nueva versión del PMBOK', fuente: 'PMI' }).includes('pmbok'));
    assert.ok(tema({ titulo: 'BIM obligatorio desde 2026', fuente: 'Andina' }).includes('bim'));
  });

  test('«impacto en plazo» encuentra ampliaciones de plazo, atrasos y obras paralizadas', () => {
    const docs = [
      { id: 'a', tipo: 'noticia', titulo: 'Contratista pide ampliación de plazo de 120 días en hospital de Piura', fecha: '2026-09-01' },
      { id: 'b', tipo: 'noticia', titulo: 'Contraloría alerta atraso en obra de saneamiento', fecha: '2026-08-01' },
      { id: 'c', tipo: 'noticia', titulo: 'Obra paralizada por falta de expediente', fecha: '2026-07-01' },
      { id: 'd', tipo: 'noticia', titulo: 'Inauguran colegio en Cusco', fecha: '2026-06-01' }
    ];
    assert.deepEqual(Motor.buscar(docs, { consulta: 'impacto en plazo' }).map((d) => d.id), ['a', 'b', 'c']);
    assert.deepEqual(Motor.buscar(docs, { consulta: 'impacto en el cronograma' }).map((d) => d.id), ['a', 'b', 'c']);
    const costos = [{ id: 'e', tipo: 'noticia', titulo: 'Aprueban adicional de obra por S/ 5 millones', fecha: '2026-09-01' }];
    assert.equal(Motor.buscar(costos, { consulta: 'impacto en costo' }).length, 1);
  });
});
