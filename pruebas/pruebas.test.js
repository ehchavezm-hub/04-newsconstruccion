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

  test('cada tema tiene id único, grupo y entre 14 y 25 términos', () => {
    const temas = Temas.grupos.flatMap((g) => g.temas);
    assert.equal(temas.length, 22);
    assert.equal(new Set(temas.map((t) => t.id)).size, 22);
    const ids = Temas.grupos.map((g) => g.id);
    temas.forEach((t) => {
      assert.ok(t.terminos.length >= 14 && t.terminos.length <= 25, `${t.id}: ${t.terminos.length}`);
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
    assert.equal(Fuentes.revistas.length, 15);
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

describe('Vigencia y relación con los temas', () => {
  const ahora = new Date('2026-09-27T12:00:00Z');

  test('papers y libros: solo los últimos 12 meses (un paper de 2024 ya no está vigente)', () => {
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2024-11-03' }, ahora), false);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2025-08-01' }, ahora), false);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2025-10-15' }, ahora), true);
    assert.equal(Motor.vigente({ tipo: 'paper', fecha: '2026-09' }, ahora), true);
    assert.equal(Motor.vigente({ tipo: 'libro', fecha: '2025' }, ahora), true);
    assert.equal(Motor.vigente({ tipo: 'libro', fecha: '2024' }, ahora), false);
    assert.equal(Motor.vigente({ tipo: 'libro', fecha: '2027' }, ahora), false);
  });

  test('noticias: 90 días; normas: solo las que están en vigor; nunca el contenido de ejemplo', () => {
    assert.equal(Motor.vigente({ tipo: 'noticia', fecha: '2026-07-10T00:00:00Z' }, ahora), true);
    assert.equal(Motor.vigente({ tipo: 'noticia', fecha: '2026-06-01T00:00:00Z' }, ahora), false);
    assert.equal(Motor.vigente(catalogo.find((d) => d.id === 'norma-ley-32069'), ahora), true);
    assert.equal(Motor.vigente(catalogo.find((d) => d.id === 'norma-guia-app-banco-mundial'), ahora), false);
    assert.equal(Motor.vigente(catalogo.find((d) => d.tipo === 'noticia'), ahora), false);
  });

  test('los clásicos del catálogo no se muestran; las normas vigentes sí', () => {
    assert.deepEqual(Motor.aptos(catalogo, ahora).map((d) => d.id).sort(), ['norma-g050', 'norma-ley-32069']);
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

  test('los papers por tema se piden en todas las editoriales y quedan solo los vigentes y relacionados', async () => {
    const crossref = require('../servidor/fuentes/crossref');
    const pedidos = [];
    const fetchOriginal = global.fetch;
    const item = (doi, titulo, fecha) => ({ DOI: doi, title: [titulo], issued: { 'date-parts': [fecha] }, 'container-title': ['Automation in Construction'] });
    global.fetch = async (url) => {
      pedidos.push(String(url));
      return new Response(JSON.stringify({ message: { items: [
        item('10.1/a', 'Last Planner System adoption in Peru', [2026, 8, 2]),
        item('10.1/b', 'Last Planner System in 2024 projects', [2024, 5, 1]),
        item('10.1/c', 'Protein folding with deep networks', [2026, 7, 1])
      ] } }), { status: 200 });
    };
    try {
      const { papers } = await crossref.obtenerRecientes({ ahora, esperaMs: 1000, filas: 5 });
      assert.deepEqual(papers.map((d) => d.titulo), ['Last Planner System adoption in Peru']);
      assert.equal(pedidos.length, Temas.grupos.flatMap((g) => g.temas).length);
      assert.ok(pedidos.every((u) => u.includes('prefix%3A10.1016') && u.includes('from-pub-date%3A2025-09-27')));
    } finally {
      global.fetch = fetchOriginal;
    }
  });

  test('la tarjeta indica el tema de cada resultado (código de la interfaz)', () => {
    const codigo = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'js', 'interfaz.js'), 'utf8');
    assert.match(codigo, /'Tema: ' \+ temas\[0\]\.etiqueta/);
  });
});

describe('Archivo de noticias (90 días)', () => {
  const archivo = require('../servidor/archivo');
  test('suma lo nuevo, quita repetidos y lo que pasa de 90 días', () => {
    const ahora = new Date('2026-09-26T12:00:00Z');
    const n = (id, fecha, enlace = 'https://x.pe/' + id) => ({ id, tipo: 'noticia', titulo: 'Avance de obra ' + id, resumen: 'r', fecha, enlace });
    const anteriores = [n('a', '2026-09-01T00:00:00Z'), n('viejo', '2026-05-01T00:00:00Z'), n('b', '2026-09-20T00:00:00Z')];
    const nuevas = [n('c', '2026-09-26T08:00:00Z'), n('b', '2026-09-20T00:00:00Z')];
    assert.deepEqual(archivo.unir(anteriores, nuevas, ahora).map((d) => d.id), ['c', 'b', 'a']);
    // Lo que no se relaciona con los temas se quita (también lo guardado antes).
    const ajena = { id: 'x', tipo: 'noticia', titulo: 'Gana el equipo local', resumen: '', fecha: '2026-09-25T00:00:00Z', enlace: 'https://x.pe/x' };
    assert.deepEqual(archivo.unir([ajena], [], ahora), []);
  });

  test('guarda una versión compacta (resumen de 200 caracteres como máximo)', () => {
    const archivo = require('../servidor/archivo');
    const largo = 'Palabra '.repeat(80);
    const [d] = archivo.unir([], [{ id: 'x', tipo: 'noticia', titulo: 'Nueva obra vial', resumen: largo, fecha: '2026-09-25T00:00:00Z', enlace: 'https://x.pe/1' }],
      new Date('2026-09-26T00:00:00Z'));
    assert.ok(d.resumen.length <= 201);
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
    const archivo = require('../public/datos/noticias-archivo.json');
    assert.ok(Array.isArray(archivo.resultados) && archivo.dias === 90);
    assert.ok(Array.isArray(require('../public/datos/libros-recientes.json').resultados));
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
