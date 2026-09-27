/*
 * SONDEO TEMPORAL (solo para desarrollo): prueba qué ofrecen OpenAlex y Google Noticias.
 */
'use strict';

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function probar(nombre, url, leer) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConstruccionGlobal/1.0)', Origin: 'https://ehchavezm-hub.github.io' } });
    const texto = await r.text();
    console.log(`\n## ${nombre}\nHTTP ${r.status} · CORS: ${r.headers.get('access-control-allow-origin')}`);
    if (r.ok) console.log(leer(texto));
    else console.log(texto.slice(0, 300));
  } catch (e) {
    console.log(`\n## ${nombre}\nERROR ${e.message}`);
  }
  await esperar(1500);
}

const oa = (filtro, busqueda = 'building information modeling') =>
  `https://api.openalex.org/works?search=${encodeURIComponent(busqueda)}&filter=${encodeURIComponent(filtro)}&sort=publication_date:desc&per-page=10&mailto=ehchavezm@example.org`;

const resumenOA = (t) => {
  const j = JSON.parse(t);
  return `total ${j.meta && j.meta.count}\n` + (j.results || []).slice(0, 6).map((w) =>
    `- ${w.publication_date} | ${w.title} | ${w.primary_location && w.primary_location.source && w.primary_location.source.display_name} | core=${w.primary_location && w.primary_location.source && w.primary_location.source.is_core} doaj=${w.primary_location && w.primary_location.source && w.primary_location.source.is_in_doaj} | países=${[...new Set((w.authorships || []).flatMap((a) => a.countries || []))].join(',')}`).join('\n');
};

const gn = (q, region = { hl: 'es-419', gl: 'PE', ceid: 'PE:es-419' }) =>
  'https://news.google.com/rss/search?' + new URLSearchParams({ q, ...region });

const resumenGN = (t) => {
  const items = t.match(/<item>[\s\S]*?<\/item>/g) || [];
  const fuentes = items.map((i) => (i.match(/<source url="([^"]+)"/) || [])[1]).filter(Boolean);
  const cuenta = {};
  fuentes.forEach((f) => { const h = f.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]; cuenta[h] = (cuenta[h] || 0) + 1; });
  const fechas = items.map((i) => Date.parse((i.match(/<pubDate>([^<]+)/) || [])[1])).filter((x) => !isNaN(x)).sort();
  return `items ${items.length} · desde ${fechas.length ? new Date(fechas[0]).toISOString().slice(0, 10) : '-'} hasta ${fechas.length ? new Date(fechas[fechas.length - 1]).toISOString().slice(0, 10) : '-'}\n` +
    Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([h, n]) => `  ${n} ${h}`).join('\n') +
    '\n  ej: ' + items.slice(0, 3).map((i) => (i.match(/<title>([^<]+)/) || [])[1]).join(' || ');
};

(async () => {
  const hoy = new Date();
  const hace = (d) => new Date(hoy.getTime() - d * 86400000).toISOString().slice(0, 10);
  await probar('OpenAlex: BIM, último año', oa(`from_publication_date:${hace(365)}`), resumenOA);
  await probar('OpenAlex: BIM, autores del Perú', oa(`from_publication_date:${hace(365)},authorships.countries:PE`), resumenOA);
  await probar('OpenAlex: BIM, Perú, todo el tiempo', oa('authorships.countries:PE'), resumenOA);
  await probar('OpenAlex: filtro is_core', oa(`from_publication_date:${hace(365)},primary_location.source.is_core:true`), resumenOA);
  await probar('OpenAlex: filtro is_in_doaj', oa(`from_publication_date:${hace(365)},primary_location.source.is_in_doaj:true`), resumenOA);
  await probar('OpenAlex: tipo journal', oa(`from_publication_date:${hace(365)},primary_location.source.type:journal`), resumenOA);
  await probar('OpenAlex: last planner, Perú', oa('authorships.countries:PE', 'last planner'), resumenOA);
  await probar('Google Noticias: BIM Perú when:1y', gn('BIM Perú when:1y'), resumenGN);
  await probar('Google Noticias: "BIM" site:pe when:1y', gn('"BIM" site:pe when:1y'), resumenGN);
  await probar('Google Noticias: BIM Perú after/before (hace 2 años)', gn(`BIM Perú after:${hace(730)} before:${hace(365)}`), resumenGN);
  await probar('Google Noticias: BIM Perú sin fecha', gn('BIM Perú'), resumenGN);
  await probar('Google Noticias: "building information modeling" when:1y (EE. UU.)', gn('"building information modeling" when:1y', { hl: 'en-US', gl: 'US', ceid: 'US:en' }), resumenGN);
  await probar('Google Noticias: "last planner" when:1y (EE. UU.)', gn('"last planner" when:1y', { hl: 'en-US', gl: 'US', ceid: 'US:en' }), resumenGN);
  await probar('Google Noticias: "advanced work packaging" after/before 3 años', gn(`"advanced work packaging" after:${hace(1095)} before:${hace(730)}`, { hl: 'en-US', gl: 'US', ceid: 'US:en' }), resumenGN);
  await probar('GDELT: BIM gob.pe', 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent('BIM (domainis:gob.pe OR domainis:elperuano.pe OR domainis:gestion.pe OR domainis:andina.pe)') + '&mode=ArtList&format=json&maxrecords=20&timespan=3m', (t) => t.slice(0, 600));
})();
