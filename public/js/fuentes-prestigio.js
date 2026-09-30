/*
 * FUENTES DE PRESTIGIO
 * --------------------
 * Única lista de medios, entidades, gremios, organismos, revistas académicas y editoriales
 * que usa la aplicación. Solo se muestran resultados de estas fuentes.
 *
 * - medios: fuentes RSS para "Novedades de la última semana" y el archivo de 90 días.
 *     url:            canal RSS/Atom propio del medio (comprobado).
 *     googleNoticias: para medios y entidades sin RSS propio (o que bloquean lectores
 *                     automáticos), búsqueda "site:" en Google Noticias (solo ese sitio).
 *     ambito: 'nacional' (Perú) o 'internacional'.
 *     especializado: true  -> se toma todo su contenido (medios del sector, gremios,
 *                             entidades de infraestructura).
 *     especializado: false -> medio general: solo las noticias que mencionan temas de
 *                             construcción, ingeniería o infraestructura (ver PALABRAS_CLAVE).
 * - dominios: sitios web en los que busca el buscador de noticias (GDELT).
 * - revistas: revistas académicas de construcción y gestión de proyectos (Crossref, por ISSN).
 *     filtrado: true -> revista amplia: solo se aceptan artículos sobre construcción.
 * - editoriales: editoriales de prestigio para los libros recientes.
 *
 * Para añadir una fuente, copie una línea y cambie sus datos.
 * Se usa en el navegador (window.FuentesPrestigio) y en Node.js (require).
 */
(function (raiz) {
  'use strict';

  var medios = [
    // ---------------- NACIONAL (Perú) ----------------
    // Diarios de referencia: solo las noticias del sector (especializado: false).
    { id: 'el-comercio', nombre: 'El Comercio — Economía', tipoFuente: 'Diario de referencia nacional', idioma: 'es', ambito: 'nacional', especializado: false,
      url: 'https://elcomercio.pe/arcio/rss/category/economia/' },
    { id: 'gestion', nombre: 'Gestión — Economía', tipoFuente: 'Diario de referencia nacional', idioma: 'es', ambito: 'nacional', especializado: false,
      url: 'https://gestion.pe/arcio/rss/category/economia/' },
    { id: 'gestion-peru', nombre: 'Gestión — Perú', tipoFuente: 'Diario de referencia nacional', idioma: 'es', ambito: 'nacional', especializado: false,
      url: 'https://gestion.pe/arcio/rss/category/peru/' },
    { id: 'la-republica', nombre: 'La República — Economía', tipoFuente: 'Diario de referencia nacional', idioma: 'es', ambito: 'nacional', especializado: false,
      url: 'https://larepublica.pe/rss/economia.xml' },
    { id: 'rpp', nombre: 'RPP Noticias — Economía', tipoFuente: 'Medio de referencia nacional', idioma: 'es', ambito: 'nacional', especializado: false,
      url: 'https://rpp.pe/feed/economia' },
    { id: 'andina', nombre: 'Andina — Economía', tipoFuente: 'Agencia oficial de noticias', idioma: 'es', ambito: 'nacional', especializado: false,
      googleNoticias: 'site:andina.pe' },
    { id: 'semana-economica', nombre: 'Semana Económica', tipoFuente: 'Revista de negocios', idioma: 'es', ambito: 'nacional', especializado: false,
      googleNoticias: 'site:semanaeconomica.com' },
    // Gremios y medios especializados (todo su contenido es del sector).
    { id: 'capeco', nombre: 'CAPECO — Cámara Peruana de la Construcción', tipoFuente: 'Gremio del sector', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:capeco.org' },
    { id: 'cip', nombre: 'Colegio de Ingenieros del Perú', tipoFuente: 'Gremio del sector', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:cip.org.pe' },
    { id: 'rumbo-minero', nombre: 'Rumbo Minero', tipoFuente: 'Medio especializado', idioma: 'es', ambito: 'nacional', especializado: true,
      url: 'https://www.rumbominero.com/feed/' },
    { id: 'energiminas', nombre: 'Energiminas', tipoFuente: 'Medio especializado', idioma: 'es', ambito: 'nacional', especializado: true,
      url: 'https://energiminas.com/feed/' },
    // Entidades públicas (sin RSS propio: se leen a través de Google Noticias, solo en gob.pe).
    // Google Noticias no admite rutas en "site:" (site:gob.pe/mtc no trae nada), por eso se
    // busca en todo gob.pe con el nombre de la entidad.
    { id: 'proinversion', nombre: 'ProInversión', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe ProInversión' },
    { id: 'mtc', nombre: 'Ministerio de Transportes y Comunicaciones', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe "Ministerio de Transportes y Comunicaciones"' },
    { id: 'vivienda', nombre: 'Ministerio de Vivienda, Construcción y Saneamiento', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe "Ministerio de Vivienda"' },
    { id: 'oece', nombre: 'OECE — Contrataciones públicas', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe OECE' },
    { id: 'anin', nombre: 'Autoridad Nacional de Infraestructura', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe "Autoridad Nacional de Infraestructura"' },
    { id: 'sencico', nombre: 'SENCICO', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe SENCICO' },
    { id: 'plan-bim', nombre: 'Plan BIM Perú (MEF)', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe "Plan BIM"' },
    { id: 'contraloria', nombre: 'Contraloría — Obras', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: false,
      googleNoticias: 'site:gob.pe Contraloría' },
    // Gestión contractual, reajustes (índices unificados), inversión pública y arbitraje.
    { id: 'inei-indices', nombre: 'INEI — Índices Unificados de Precios', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe INEI "índices unificados"' },
    { id: 'invierte-pe', nombre: 'MEF — Invierte.pe', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe "Invierte.pe"' },
    { id: 'tribunal-contrataciones', nombre: 'Tribunal de Contrataciones del Estado', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe "Tribunal de Contrataciones"' },
    { id: 'arbitraje-pucp', nombre: 'Centro de Análisis y Resolución de Conflictos PUCP', tipoFuente: 'Centro de arbitraje', idioma: 'es', ambito: 'nacional', especializado: false,
      googleNoticias: 'site:pucp.edu.pe arbitraje' },
    { id: 'arbitraje-ccl', nombre: 'Centro de Arbitraje de la Cámara de Comercio de Lima', tipoFuente: 'Centro de arbitraje', idioma: 'es', ambito: 'nacional', especializado: false,
      googleNoticias: 'site:lacamara.pe arbitraje' },
    { id: 'lp-derecho', nombre: 'LP Derecho — Contrataciones del Estado', tipoFuente: 'Medio jurídico especializado', idioma: 'es', ambito: 'nacional', especializado: false,
      googleNoticias: 'site:lpderecho.pe contrataciones' },
    { id: 'ositran', nombre: 'OSITRAN — Concesiones de infraestructura de transporte', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:gob.pe OSITRAN' },
    { id: 'afin', nombre: 'AFIN — Asociación para el Fomento de la Infraestructura Nacional', tipoFuente: 'Gremio del sector', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'AFIN infraestructura Perú' },
    { id: 'revista-costos', nombre: 'Revista Costos', tipoFuente: 'Medio especializado', idioma: 'es', ambito: 'nacional', especializado: true,
      googleNoticias: 'site:costosperu.com' },
    { id: 'el-peruano', nombre: 'El Peruano (diario oficial)', tipoFuente: 'Entidad pública', idioma: 'es', ambito: 'nacional', especializado: false,
      googleNoticias: 'site:elperuano.pe' },

    // ---------------- INTERNACIONAL ----------------
    // Medios especializados en construcción, infraestructura, minería y energía.
    { id: 'enr', nombre: 'Engineering News-Record (ENR)', tipoFuente: 'Medio especializado', idioma: 'en', ambito: 'internacional', especializado: true,
      url: 'https://www.enr.com/rss/articles' },
    { id: 'construction-dive', nombre: 'Construction Dive', tipoFuente: 'Medio especializado', idioma: 'en', ambito: 'internacional', especializado: true,
      url: 'https://www.constructiondive.com/feeds/news/' },
    { id: 'gcr', nombre: 'Global Construction Review', tipoFuente: 'Medio especializado', idioma: 'en', ambito: 'internacional', especializado: true,
      url: 'https://www.globalconstructionreview.com/feed/' },
    { id: 'nce', nombre: 'New Civil Engineer', tipoFuente: 'Medio especializado', idioma: 'en', ambito: 'internacional', especializado: true,
      url: 'https://www.newcivilengineer.com/feed' },
    { id: 'construction-news', nombre: 'Construction News', tipoFuente: 'Medio especializado', idioma: 'en', ambito: 'internacional', especializado: true,
      url: 'https://www.constructionnews.co.uk/feed' },
    { id: 'bnamericas', nombre: 'BNamericas — Infraestructura', tipoFuente: 'Medio especializado', idioma: 'es', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:bnamericas.com' },
    { id: 'mining-com', nombre: 'Mining.com', tipoFuente: 'Medio especializado', idioma: 'en', ambito: 'internacional', especializado: true,
      url: 'https://www.mining.com/feed/' },
    { id: 'power-eng', nombre: 'Power Engineering', tipoFuente: 'Medio especializado', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:power-eng.com' },

    // Organismos multilaterales.
    { id: 'banco-mundial', nombre: 'Banco Mundial', tipoFuente: 'Organismo multilateral', idioma: 'es', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:worldbank.org' },
    { id: 'bid', nombre: 'BID — Banco Interamericano de Desarrollo', tipoFuente: 'Organismo multilateral', idioma: 'es', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:iadb.org' },
    { id: 'caf', nombre: 'CAF — Banco de Desarrollo de América Latina', tipoFuente: 'Organismo multilateral', idioma: 'es', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:caf.com' },
    { id: 'gihub', nombre: 'Global Infrastructure Hub', tipoFuente: 'Organismo multilateral', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:gihub.org' },
    { id: 'ocde', nombre: 'OCDE — Infraestructura', tipoFuente: 'Organismo multilateral', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:oecd.org' },

    // Agencias internacionales de noticias (sin RSS público: Google Noticias).
    { id: 'reuters', nombre: 'Reuters', tipoFuente: 'Agencia internacional de noticias', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:reuters.com' },
    { id: 'ap', nombre: 'Associated Press', tipoFuente: 'Agencia internacional de noticias', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:apnews.com' },
    { id: 'efe', nombre: 'Agencia EFE', tipoFuente: 'Agencia internacional de noticias', idioma: 'es', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:efe.com' },
    { id: 'europa-press', nombre: 'Europa Press', tipoFuente: 'Agencia internacional de noticias', idioma: 'es', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:europapress.es' },
    { id: 'bloomberg', nombre: 'Bloomberg', tipoFuente: 'Agencia internacional de noticias', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:bloomberg.com' },

    // Consultoras y análisis del sector.
    { id: 'mckinsey', nombre: 'McKinsey — Capital Projects & Infrastructure', tipoFuente: 'Consultora y análisis', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:mckinsey.com' },
    { id: 'deloitte', nombre: 'Deloitte', tipoFuente: 'Consultora y análisis', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:deloitte.com' },
    { id: 'pwc', nombre: 'PwC', tipoFuente: 'Consultora y análisis', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:pwc.com' },

    // Institutos, asociaciones profesionales y centros de conocimiento de la industria
    // (academia y empresas). Sus noticias se relacionan con los temas (AWP, Last Planner,
    // PPM, BIM, PMBOK, PRINCE2, IPMA…); el filtro de temas descarta lo demás.
    { id: 'cii', nombre: 'Construction Industry Institute (CII)', tipoFuente: 'Instituto de investigación', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:construction-institute.org' },
    { id: 'lci', nombre: 'Lean Construction Institute', tipoFuente: 'Instituto de investigación', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:leanconstruction.org' },
    { id: 'ppi', nombre: 'Project Production Institute', tipoFuente: 'Instituto de investigación', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:projectproduction.org' },
    { id: 'pmi', nombre: 'Project Management Institute (PMI)', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:pmi.org' },
    { id: 'ipma', nombre: 'IPMA — International Project Management Association', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:ipma.world' },
    { id: 'peoplecert', nombre: 'PeopleCert (PRINCE2)', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:peoplecert.org' },
    { id: 'buildingsmart', nombre: 'buildingSMART International', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:buildingsmart.org' },
    { id: 'asce', nombre: 'ASCE — American Society of Civil Engineers', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:asce.org' },
    { id: 'ice', nombre: 'ICE — Institution of Civil Engineers', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:ice.org.uk' },
    { id: 'rics', nombre: 'RICS', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:rics.org' },
    { id: 'aace', nombre: 'AACE International', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:aacei.org' },
    // Contratos, reclamos, disputas y riesgos en construcción.
    { id: 'fidic', nombre: 'FIDIC — Federación Internacional de Ingenieros Consultores', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:fidic.org' },
    { id: 'nec', nombre: 'NEC Contracts', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:neccontract.com' },
    { id: 'scl', nombre: 'Society of Construction Law', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:scl.org.uk' },
    { id: 'jct', nombre: 'JCT — Joint Contracts Tribunal', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:jctltd.co.uk' },
    { id: 'ppp-knowledge-lab', nombre: 'PPP Knowledge Lab (Banco Mundial)', tipoFuente: 'Organismo multilateral', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: '"PPP Knowledge Lab" OR site:ppp.worldbank.org' },
    { id: 'apmg-ppp', nombre: 'APMG — Certificación en APP (CP3P)', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:ppp-certification.com' },
    { id: 'icw', nombre: 'Institute for Collaborative Working (alianzas y partnering)', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:instituteforcollaborativeworking.org' },
    { id: 'hka', nombre: 'HKA — Reclamos y disputas en construcción', tipoFuente: 'Consultora especializada', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:hka.com' },
    { id: 'secretariat', nombre: 'Secretariat — Construction Disputes', tipoFuente: 'Consultora especializada', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:secretariat-intl.com' },
    { id: 'diales', nombre: 'Diales (Driver Group)', tipoFuente: 'Consultora especializada', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:diales.com' },
    { id: 'arcadis', nombre: 'Arcadis — Global Construction Disputes', tipoFuente: 'Empresa de ingeniería', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:arcadis.com' },
    { id: 'icc', nombre: 'ICC — Cámara de Comercio Internacional (arbitraje)', tipoFuente: 'Organismo internacional', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:iccwbo.org' },
    { id: 'gar', nombre: 'Global Arbitration Review', tipoFuente: 'Medio jurídico especializado', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:globalarbitrationreview.com' },
    { id: 'irm', nombre: 'Institute of Risk Management', tipoFuente: 'Asociación profesional', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:theirm.org' },
    { id: 'dodge', nombre: 'Dodge Construction Network', tipoFuente: 'Análisis del sector', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:construction.com' },
    { id: 'arup', nombre: 'Arup', tipoFuente: 'Empresa de ingeniería', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:arup.com' },
    { id: 'autodesk', nombre: 'Autodesk — Construction Blog', tipoFuente: 'Empresa de tecnología', idioma: 'en', ambito: 'internacional', especializado: true,
      googleNoticias: 'site:construction.autodesk.com' },
    { id: 'bcg', nombre: 'Boston Consulting Group', tipoFuente: 'Consultora y análisis', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:bcg.com' },
    { id: 'kpmg', nombre: 'KPMG', tipoFuente: 'Consultora y análisis', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:kpmg.com' },
    { id: 'ey', nombre: 'EY', tipoFuente: 'Consultora y análisis', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:ey.com' },
    { id: 'wef', nombre: 'Foro Económico Mundial', tipoFuente: 'Organismo internacional', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:weforum.org' },

    // Periódicos y cadenas de referencia mundial.
    { id: 'bbc-mundo', nombre: 'BBC Mundo', tipoFuente: 'Medio de referencia', idioma: 'es', ambito: 'internacional', especializado: false,
      url: 'https://feeds.bbci.co.uk/mundo/rss.xml' },
    { id: 'el-pais', nombre: 'El País — Economía', tipoFuente: 'Medio de referencia', idioma: 'es', ambito: 'internacional', especializado: false,
      url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada' },
    { id: 'dw-es', nombre: 'DW Español', tipoFuente: 'Medio de referencia', idioma: 'es', ambito: 'internacional', especializado: false,
      url: 'https://rss.dw.com/xml/rss-sp-all' },
    { id: 'guardian', nombre: 'The Guardian', tipoFuente: 'Medio de referencia', idioma: 'en', ambito: 'internacional', especializado: false,
      url: 'https://www.theguardian.com/business/rss' },
    { id: 'ft', nombre: 'Financial Times', tipoFuente: 'Medio de referencia', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:ft.com' },
    { id: 'economist', nombre: 'The Economist', tipoFuente: 'Medio de referencia', idioma: 'en', ambito: 'internacional', especializado: false,
      googleNoticias: 'site:economist.com' }
  ];

  // Sitios donde busca el buscador de noticias (GDELT), con su nombre visible.
  var dominios = [
    // Nacional (Perú)
    { dominio: 'elcomercio.pe', nombre: 'El Comercio', ambito: 'nacional' },
    { dominio: 'gestion.pe', nombre: 'Gestión', ambito: 'nacional' },
    { dominio: 'larepublica.pe', nombre: 'La República', ambito: 'nacional' },
    { dominio: 'rpp.pe', nombre: 'RPP Noticias', ambito: 'nacional' },
    { dominio: 'andina.pe', nombre: 'Andina', ambito: 'nacional' },
    { dominio: 'elperuano.pe', nombre: 'El Peruano', ambito: 'nacional' },
    { dominio: 'semanaeconomica.com', nombre: 'Semana Económica', ambito: 'nacional' },
    { dominio: 'rumbominero.com', nombre: 'Rumbo Minero', ambito: 'nacional' },
    { dominio: 'energiminas.com', nombre: 'Energiminas', ambito: 'nacional' },
    { dominio: 'capeco.org', nombre: 'CAPECO', ambito: 'nacional' },
    { dominio: 'cip.org.pe', nombre: 'Colegio de Ingenieros del Perú', ambito: 'nacional' },
    { dominio: 'ojo-publico.com', nombre: 'Ojo Público', ambito: 'nacional' },
    { dominio: 'convoca.pe', nombre: 'Convoca', ambito: 'nacional' },
    { dominio: 'gob.pe', nombre: 'Gobierno del Perú (gob.pe)', ambito: 'nacional' },
    // Internacional
    { dominio: 'enr.com', nombre: 'Engineering News-Record (ENR)', ambito: 'internacional' },
    { dominio: 'constructiondive.com', nombre: 'Construction Dive', ambito: 'internacional' },
    { dominio: 'globalconstructionreview.com', nombre: 'Global Construction Review', ambito: 'internacional' },
    { dominio: 'newcivilengineer.com', nombre: 'New Civil Engineer', ambito: 'internacional' },
    { dominio: 'constructionnews.co.uk', nombre: 'Construction News', ambito: 'internacional' },
    { dominio: 'bnamericas.com', nombre: 'BNamericas', ambito: 'internacional' },
    { dominio: 'mining.com', nombre: 'Mining.com', ambito: 'internacional' },
    { dominio: 'power-eng.com', nombre: 'Power Engineering', ambito: 'internacional' },
    { dominio: 'reuters.com', nombre: 'Reuters', ambito: 'internacional' },
    { dominio: 'apnews.com', nombre: 'Associated Press', ambito: 'internacional' },
    { dominio: 'efe.com', nombre: 'Agencia EFE', ambito: 'internacional' },
    { dominio: 'europapress.es', nombre: 'Europa Press', ambito: 'internacional' },
    { dominio: 'bloomberg.com', nombre: 'Bloomberg', ambito: 'internacional' },
    { dominio: 'ft.com', nombre: 'Financial Times', ambito: 'internacional' },
    { dominio: 'economist.com', nombre: 'The Economist', ambito: 'internacional' },
    { dominio: 'theguardian.com', nombre: 'The Guardian', ambito: 'internacional' },
    { dominio: 'bbc.com', nombre: 'BBC', ambito: 'internacional' },
    { dominio: 'elpais.com', nombre: 'El País', ambito: 'internacional' },
    { dominio: 'dw.com', nombre: 'DW', ambito: 'internacional' },
    { dominio: 'worldbank.org', nombre: 'Banco Mundial', ambito: 'internacional' },
    { dominio: 'iadb.org', nombre: 'BID', ambito: 'internacional' },
    { dominio: 'caf.com', nombre: 'CAF', ambito: 'internacional' },
    { dominio: 'oecd.org', nombre: 'OCDE', ambito: 'internacional' },
    { dominio: 'gihub.org', nombre: 'Global Infrastructure Hub', ambito: 'internacional' },
    { dominio: 'mckinsey.com', nombre: 'McKinsey', ambito: 'internacional' }
  ];

  /*
   * BÚSQUEDA ABIERTA A TODO INTERNET, CON SELECTIVIDAD
   * Las noticias por tema (Google Noticias) pueden venir de cualquier sitio, pero solo se
   * aceptan si el sitio es selecto:
   *   - está en `dominios` (arriba) o en `dominiosAmpliados` (abajo), o
   *   - es oficial o académico: .gob.pe, .edu.pe, .gov, .gob.xx, .edu, .edu.xx, .ac.uk, un.org…
   * y nunca si está en `dominiosExcluidos` (empleo, notas de prensa pagadas, «estudios de
   * mercado», tiendas). Además se descartan avisos de empleo y cursos por su titular.
   */
  var dominiosAmpliados = [
    // Nacional (Perú): medios de referencia, especializados y gremios
    { dominio: 'infobae.com', nombre: 'Infobae', ambito: 'internacional' },
    { dominio: 'peru21.pe', nombre: 'Perú21', ambito: 'nacional' },
    { dominio: 'diariocorreo.pe', nombre: 'Correo', ambito: 'nacional' },
    { dominio: 'exitosanoticias.pe', nombre: 'Exitosa', ambito: 'nacional' },
    { dominio: 'forbes.pe', nombre: 'Forbes Perú', ambito: 'nacional' },
    { dominio: 'caretas.pe', nombre: 'Caretas', ambito: 'nacional' },
    { dominio: 'rcrperu.com', nombre: 'Radio Cadena Nacional (RCR)', ambito: 'nacional' },
    { dominio: 'construir.com.pe', nombre: 'Construir', ambito: 'nacional' },
    { dominio: 'proactivo.com.pe', nombre: 'Proactivo', ambito: 'nacional' },
    { dominio: 'mineriaenergia.com', nombre: 'Minería & Energía', ambito: 'nacional' },
    { dominio: 'lacamara.pe', nombre: 'Cámara de Comercio de Lima', ambito: 'nacional' },
    { dominio: 'stakeholders.com.pe', nombre: 'Stakeholders', ambito: 'nacional' },
    { dominio: 'lpderecho.pe', nombre: 'LP Derecho', ambito: 'nacional' },
    { dominio: 'costosperu.com', nombre: 'Revista Costos', ambito: 'nacional' },
    { dominio: 'constructivo.com', nombre: 'Constructivo', ambito: 'nacional' },
    { dominio: 'elbuho.pe', nombre: 'El Búho', ambito: 'nacional' },
    { dominio: 'mercadonegro.pe', nombre: 'Mercado Negro', ambito: 'nacional' },
    // Internacional: especializados, académicos, institutos y empresas de referencia
    { dominio: 'nature.com', nombre: 'Nature', ambito: 'internacional' },
    { dominio: 'frontiersin.org', nombre: 'Frontiers', ambito: 'internacional' },
    { dominio: 'sciencedirect.com', nombre: 'ScienceDirect (Elsevier)', ambito: 'internacional' },
    { dominio: 'springer.com', nombre: 'Springer', ambito: 'internacional' },
    { dominio: 'tandfonline.com', nombre: 'Taylor & Francis', ambito: 'internacional' },
    { dominio: 'ascelibrary.org', nombre: 'ASCE Library', ambito: 'internacional' },
    { dominio: 'emerald.com', nombre: 'Emerald', ambito: 'internacional' },
    { dominio: 'facilitiesdive.com', nombre: 'Facilities Dive', ambito: 'internacional' },
    { dominio: 'constructionspecifier.com', nombre: 'The Construction Specifier', ambito: 'internacional' },
    { dominio: 'forconstructionpros.com', nombre: 'For Construction Pros', ambito: 'internacional' },
    { dominio: 'bdcnetwork.com', nombre: 'Building Design + Construction', ambito: 'internacional' },
    { dominio: 'constructconnect.com', nombre: 'ConstructConnect', ambito: 'internacional' },
    { dominio: 'building.co.uk', nombre: 'Building', ambito: 'internacional' },
    { dominio: 'bimplus.co.uk', nombre: 'BIMplus', ambito: 'internacional' },
    { dominio: 'theconstructionindex.co.uk', nombre: 'The Construction Index', ambito: 'internacional' },
    { dominio: 'pbctoday.co.uk', nombre: 'PBC Today', ambito: 'internacional' },
    { dominio: 'constructionbriefing.com', nombre: 'Construction Briefing', ambito: 'internacional' },
    { dominio: 'aecmagazine.com', nombre: 'AEC Magazine', ambito: 'internacional' },
    { dominio: 'archdaily.com', nombre: 'ArchDaily', ambito: 'internacional' },
    { dominio: 'construction-institute.org', nombre: 'Construction Industry Institute', ambito: 'internacional' },
    { dominio: 'leanconstruction.org', nombre: 'Lean Construction Institute', ambito: 'internacional' },
    { dominio: 'projectproduction.org', nombre: 'Project Production Institute', ambito: 'internacional' },
    { dominio: 'pmi.org', nombre: 'Project Management Institute', ambito: 'internacional' },
    { dominio: 'ipma.world', nombre: 'IPMA', ambito: 'internacional' },
    { dominio: 'peoplecert.org', nombre: 'PeopleCert', ambito: 'internacional' },
    { dominio: 'axelos.com', nombre: 'AXELOS', ambito: 'internacional' },
    { dominio: 'buildingsmart.org', nombre: 'buildingSMART', ambito: 'internacional' },
    { dominio: 'asce.org', nombre: 'ASCE', ambito: 'internacional' },
    { dominio: 'ice.org.uk', nombre: 'ICE', ambito: 'internacional' },
    { dominio: 'rics.org', nombre: 'RICS', ambito: 'internacional' },
    { dominio: 'aacei.org', nombre: 'AACE International', ambito: 'internacional' },
    { dominio: 'construction.com', nombre: 'Dodge Construction Network', ambito: 'internacional' },
    // Contratos, reclamos, disputas, reajustes y riesgos
    { dominio: 'fidic.org', nombre: 'FIDIC', ambito: 'internacional' },
    { dominio: 'neccontract.com', nombre: 'NEC Contracts', ambito: 'internacional' },
    { dominio: 'scl.org.uk', nombre: 'Society of Construction Law', ambito: 'internacional' },
    { dominio: 'hka.com', nombre: 'HKA', ambito: 'internacional' },
    { dominio: 'jctltd.co.uk', nombre: 'JCT', ambito: 'internacional' },
    { dominio: 'ppp-certification.com', nombre: 'APMG PPP Certification', ambito: 'internacional' },
    { dominio: 'instituteforcollaborativeworking.org', nombre: 'Institute for Collaborative Working', ambito: 'internacional' },
    { dominio: 'afin.org.pe', nombre: 'AFIN', ambito: 'nacional' },
    { dominio: 'p3bulletin.com', nombre: 'P3 Bulletin', ambito: 'internacional' },
    { dominio: 'ijglobal.com', nombre: 'IJGlobal (financiamiento de infraestructura y APP)', ambito: 'internacional' },
    { dominio: 'infralatam.info', nombre: 'Infralatam', ambito: 'internacional' },
    { dominio: 'secretariat-intl.com', nombre: 'Secretariat', ambito: 'internacional' },
    { dominio: 'diales.com', nombre: 'Diales', ambito: 'internacional' },
    { dominio: 'arcadis.com', nombre: 'Arcadis', ambito: 'internacional' },
    { dominio: 'iccwbo.org', nombre: 'ICC', ambito: 'internacional' },
    { dominio: 'globalarbitrationreview.com', nombre: 'Global Arbitration Review', ambito: 'internacional' },
    { dominio: 'theirm.org', nombre: 'Institute of Risk Management', ambito: 'internacional' },
    { dominio: 'lexology.com', nombre: 'Lexology', ambito: 'internacional' },
    { dominio: 'hillintl.com', nombre: 'Hill International', ambito: 'internacional' },
    { dominio: 'arup.com', nombre: 'Arup', ambito: 'internacional' },
    { dominio: 'autodesk.com', nombre: 'Autodesk', ambito: 'internacional' },
    { dominio: 'bentley.com', nombre: 'Bentley Systems', ambito: 'internacional' },
    { dominio: 'bcg.com', nombre: 'Boston Consulting Group', ambito: 'internacional' },
    { dominio: 'kpmg.com', nombre: 'KPMG', ambito: 'internacional' },
    { dominio: 'ey.com', nombre: 'EY', ambito: 'internacional' },
    { dominio: 'deloitte.com', nombre: 'Deloitte', ambito: 'internacional' },
    { dominio: 'pwc.com', nombre: 'PwC', ambito: 'internacional' },
    { dominio: 'weforum.org', nombre: 'Foro Económico Mundial', ambito: 'internacional' },
    { dominio: 'unops.org', nombre: 'UNOPS', ambito: 'internacional' },
    { dominio: 'un.org', nombre: 'Naciones Unidas', ambito: 'internacional' },
    { dominio: 'wsj.com', nombre: 'The Wall Street Journal', ambito: 'internacional' },
    { dominio: 'nytimes.com', nombre: 'The New York Times', ambito: 'internacional' },
    { dominio: 'cnbc.com', nombre: 'CNBC', ambito: 'internacional' },
    { dominio: 'forbes.com', nombre: 'Forbes', ambito: 'internacional' },
    { dominio: 'bizjournals.com', nombre: 'The Business Journals', ambito: 'internacional' },
    { dominio: 'eleconomista.es', nombre: 'El Economista', ambito: 'internacional' },
    { dominio: 'expansion.com', nombre: 'Expansión', ambito: 'internacional' }
  ];

  // Sitios oficiales y académicos (Perú y el mundo): se aceptan siempre.
  var DOMINIO_OFICIAL_O_ACADEMICO = /(\.gob\.pe|\.edu\.pe|\.gov|\.gov\.[a-z]{2}|\.gob\.[a-z]{2}|\.edu|\.edu\.[a-z]{2}|\.ac\.uk|\.ac\.[a-z]{2})$/;

  // Sitios que nunca se aceptan: empleo, notas de prensa pagadas, «estudios de mercado», tiendas.
  var dominiosExcluidos = [
    'bumeran.com.pe', 'computrabajo.com', 'computrabajo.com.pe', 'indeed.com', 'linkedin.com', 'glassdoor.com',
    'marketsandmarkets.com', 'precedenceresearch.com', 'snsinsider.com', 'einnews.com', 'openpr.com',
    'getlatka.com', 'tradingview.com', 'barchart.com', 'tipranks.com', 'vocal.media', 'newswire.com',
    'globenewswire.com', 'prnewswire.com', 'businesswire.com', 'medium.com', 'coursera.org', 'udemy.com',
    'mercadolibre.com.pe', 'amazon.com', 'compumarket.pe', 'cuantoestaeldolar.pe'
  ];

  // Titulares que no son noticias del sector: avisos de empleo, cursos, ofertas.
  var TITULAR_DESCARTABLE = /\b(empleo|empleos|vacante|vacantes|se busca|se requiere|convocatoria cas|oferta laboral|trabaja con nosotros|job|jobs|hiring|vacancy|vacancies|career|careers|internship|diplomado|diplomados|webinar|matr[ií]cula|inscr[ií]bete|descuento|market size|market share|market worth|cagr)\b|\bin [A-Z][a-z]+, [A-Z][A-Za-z ]+, (United Kingdom|United States|Canada|Australia)\b/i;

  // Avisos de empleo que solo tienen el nombre del puesto («Senior Project Controls Manager»,
  // «Project Scheduler - Modular Manufacturing»).
  var PUESTO_DE_TRABAJO = /^(?:[A-Z][\w&/.,'’-]*\s){0,6}(?:Manager|Specialist|Scheduler|Estimator|Analyst|Engineer|Coordinator|Director|Consultant|Planner|Superintendent|Technician)s?(?:\s[-–(].*)?$/;

  // Revistas académicas (ISSN impreso o electrónico registrado en Crossref).
  var revistas = [
    { nombre: 'Journal of Construction Engineering and Management', issn: '0733-9364' },
    { nombre: 'Journal of Management in Engineering', issn: '0742-597X' },
    { nombre: 'Journal of Legal Affairs and Dispute Resolution in Engineering and Construction', issn: '1943-4162' },
    { nombre: 'Journal of Computing in Civil Engineering', issn: '0887-3801' },
    { nombre: 'International Journal of Project Management', issn: '0263-7863' },
    { nombre: 'Project Management Journal', issn: '8756-9728' },
    { nombre: 'Construction Management and Economics', issn: '0144-6193' },
    { nombre: 'Engineering, Construction and Architectural Management', issn: '0969-9988' },
    { nombre: 'Automation in Construction', issn: '0926-5805' },
    { nombre: 'Journal of Building Engineering', issn: '2352-7102' },
    { nombre: 'Construction and Building Materials', issn: '0950-0618' },
    { nombre: 'Tunnelling and Underground Space Technology', issn: '0886-7798' },
    { nombre: 'Safety Science', issn: '0925-7535' },
    { nombre: 'Reliability Engineering & System Safety', issn: '0951-8320' },
    // Contratos, costos, reclamos y riesgos
    { nombre: 'International Journal of Construction Management', issn: '1562-3599' },
    { nombre: 'Journal of Financial Management of Property and Construction', issn: '1366-4387' },
    { nombre: 'Built Environment Project and Asset Management', issn: '2044-124X' },
    { nombre: 'Risk Analysis', issn: '0272-4332', filtrado: true },
    // Modelos de contratación (APP, alianzas, contratos estándar)
    { nombre: 'Public Works Management & Policy', issn: '1087-724X' },
    // Revista amplia: solo se aceptan los artículos que tratan de construcción.
    { nombre: 'Journal of Cleaner Production', issn: '0959-6526', filtrado: true }
  ];

  /*
   * Editoriales y congresos académicos de prestigio, por su prefijo de DOI en Crossref.
   * La búsqueda por tema abarca TODAS sus revistas y actas de congresos (no solo las revistas
   * de arriba); después el filtro de temas deja solo lo que trata de los temas definidos.
   */
  var editorialesAcademicas = [
    { prefijo: '10.1016', nombre: 'Elsevier' },
    { prefijo: '10.1061', nombre: 'ASCE — American Society of Civil Engineers' },
    { prefijo: '10.1080', nombre: 'Taylor & Francis' },
    { prefijo: '10.1108', nombre: 'Emerald' },
    { prefijo: '10.1177', nombre: 'SAGE' },
    { prefijo: '10.1002', nombre: 'Wiley' },
    { prefijo: '10.1111', nombre: 'Wiley-Blackwell' },
    { prefijo: '10.1007', nombre: 'Springer' },
    { prefijo: '10.1680', nombre: 'ICE Publishing' },
    { prefijo: '10.1139', nombre: 'Canadian Science Publishing' },
    { prefijo: '10.1109', nombre: 'IEEE' },
    { prefijo: '10.1145', nombre: 'ACM' },
    { prefijo: '10.1017', nombre: 'Cambridge University Press' },
    { prefijo: '10.1093', nombre: 'Oxford University Press' },
    { prefijo: '10.24928', nombre: 'IGLC — International Group for Lean Construction' },
    { prefijo: '10.22260', nombre: 'ISARC — Automation and Robotics in Construction' }
  ];

  // Editoriales de libros académicos y técnicos de prestigio (prefijo de DOI), además de las de arriba.
  var editorialesDeLibros = [
    { prefijo: '10.4324', nombre: 'Routledge' },
    { prefijo: '10.1201', nombre: 'CRC Press' },
    { prefijo: '10.1036', nombre: 'McGraw-Hill' },
    { prefijo: '10.1515', nombre: 'De Gruyter' },
    { prefijo: '10.1057', nombre: 'Palgrave Macmillan' }
  ];

  // Editoriales de prestigio (se compara sin tildes ni mayúsculas, por coincidencia parcial).
  var editoriales = [
    'wiley', 'routledge', 'taylor & francis', 'taylor and francis', 'crc press', 'elsevier',
    'butterworth', 'gulf professional', 'springer', 'mcgraw', 'pearson', 'cambridge', 'oxford',
    'mit press', 'asce press', 'american society of civil engineers', 'ice publishing',
    'thomas telford', 'riba publishing', 'project management institute', 'aace', 'fidic',
    'industrial press', 'kogan page', 'penguin', 'currency', 'reverte', 'paraninfo', 'marcombo',
    'diaz de santos', 'fondo editorial pucp', 'pontificia universidad catolica del peru',
    'fondo editorial uni', 'universidad nacional de ingenieria', 'universidad de lima',
    'universidad del pacifico', 'editorial macro', 'empresa editora macro'
  ];

  // Temas que hacen "relevante" una noticia de un medio general (sin tildes, en minúsculas).
  // Cada término busca el comienzo de una palabra ("construccion" = construcciones…);
  // si termina en espacio, debe ser la palabra exacta ("port " no encuentra "portugal").
  var PALABRAS_CLAVE = [
    'construccion', 'constructora', 'construction', 'obra ', 'obras ',
    'infraestructura', 'infrastructure', 'ingenieria', 'engineering', 'licitacion', 'tender ',
    'tenders ', 'contrato', 'concesion', 'concession', 'carretera', 'highway', 'puente', 'bridge',
    'tunel', 'tunnel', 'puerto', 'port ', 'ports ', 'aeropuerto', 'airport', 'ferrocarril',
    'railway', 'metro ', 'hidroelectrica', 'central electrica', 'power plant', 'planta ', 'plantas ',
    'refineria', 'refinery', 'proyecto minero', 'mining project', 'saneamiento', 'agua potable',
    'vivienda', 'edificacion', 'building', 'cemento', 'cement', 'acero estructural',
    'obras por impuestos', 'reconstruccion', 'proinversion', 'capeco', 'oece ', 'anin ',
    'megaproyecto', 'megaproject', 'puesta en marcha', 'commissioning', 'mantenimiento', 'maintenance',
    'adicional de obra', 'adicionales de obra', 'ampliacion de plazo', 'formula polinomica', 'reajuste',
    'indices unificados', 'arbitraje', 'paralizada', 'paralizacion', 'contrataciones del estado',
    'change order', 'cost overrun', 'construction dispute', 'construction risk',
    'fidic', 'nec4', 'asociacion publico privada', 'asociaciones publico privadas',
    'public-private partnership', 'project alliance', 'epcm', 'llave en mano', 'turnkey'
  ];
  // Siglas que solo cuentan escritas en MAYÚSCULAS ("APP" sí; la "app" del teléfono, no).
  var SIGLAS_CLAVE = /(^|[^A-Za-z])(EPC|BIM|APP|PPP)([^A-Za-z]|$)/;

  // Palabras que indican que un paper, libro o noticia sin ámbito trata del Perú.
  var SENALES_PERU = / (peru|peruan|lima |callao|chancay|arequipa|cusco|trujillo|piura|chiclayo|huancayo|iquitos|ayacucho|puno|tacna|cajamarca|ica |proinversion|capeco|oece |osce |anin |mtc |mef |mvcs |sencico|sedapal|plan bim|obras por impuestos|reconstruccion con cambios)/;

  function sinTildes(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function textoPlano(texto) {
    return ' ' + sinTildes(texto).replace(/[^a-z0-9ñ]+/g, ' ') + ' ';
  }

  /** ¿La noticia de un medio general trata de construcción, ingeniería o infraestructura? */
  function esRelevante(titulo, resumen) {
    var original = String(titulo || '') + ' ' + String(resumen || '');
    var texto = textoPlano(original);
    return SIGLAS_CLAVE.test(original) ||
      PALABRAS_CLAVE.some(function (p) { return texto.indexOf(' ' + p) > -1; });
  }

  /** Para revistas amplias (filtrado: true), solo se aceptan los artículos del sector. */
  function esPaperRelevante(doc) {
    var revista = sinTildes(doc.fuente);
    var amplia = revistas.some(function (r) { return r.filtrado && sinTildes(r.nombre) === revista; });
    return !amplia || esRelevante(doc.titulo, doc.resumen);
  }

  /** ¿La editorial está en la lista de prestigio? */
  function esEditorialPrestigio(editorial) {
    var e = sinTildes(editorial);
    return !!e && editoriales.some(function (p) { return e.indexOf(p) > -1; });
  }

  function hostDe(urlODominio) {
    return sinTildes(urlODominio).replace(/^https?:\/\//, '').split('/')[0].split(':')[0].replace(/^www\./, '');
  }

  function buscarDominio(lista, host) {
    for (var i = 0; i < lista.length; i++) {
      var d = lista[i].dominio || lista[i];
      if (host === d || host.slice(-(d.length + 1)) === '.' + d) return lista[i];
    }
    return null;
  }

  /**
   * Datos del sitio (nombre y ámbito) a partir de una dirección web o dominio.
   * Busca en `dominios` y en `dominiosAmpliados`; un sitio .pe se considera nacional.
   */
  function sitioDe(urlODominio) {
    var host = hostDe(urlODominio);
    if (!host) return null;
    var conocido = buscarDominio(dominios, host) || buscarDominio(dominiosAmpliados, host);
    if (conocido) return conocido;
    if (/\.pe$/.test(host) && esFuenteSelecta(host)) return { dominio: host, nombre: host, ambito: 'nacional' };
    return null;
  }

  /** ¿El sitio cumple el criterio de selectividad? (lista de prestigio u oficial/académico, y no excluido) */
  function esFuenteSelecta(urlODominio) {
    var host = hostDe(urlODominio);
    if (!host || buscarDominio(dominiosExcluidos, host)) return false;
    return !!(buscarDominio(dominios, host) || buscarDominio(dominiosAmpliados, host) || DOMINIO_OFICIAL_O_ACADEMICO.test(host));
  }

  /** ¿Es un aviso de empleo, un curso, publicidad o viene de un sitio excluido? */
  function esDescartable(doc) {
    if (doc.tipo !== 'noticia') return false;
    if (TITULAR_DESCARTABLE.test(doc.titulo || '') || PUESTO_DE_TRABAJO.test(doc.titulo || '')) return true;
    var sitio = doc.sitio || doc.enlace || '';
    return !!buscarDominio(dominiosExcluidos, hostDe(sitio));
  }

  /**
   * 'nacional' (Perú) o 'internacional'.
   * Usa el ámbito de la fuente; si no lo tiene (papers, libros), mira si el texto trata del Perú.
   */
  function ambitoDe(doc) {
    if (doc.ambito) return doc.ambito;
    var sitio = doc.tipo === 'noticia' && doc.enlace ? sitioDe(doc.enlace) : null;
    if (sitio) return sitio.ambito;
    var texto = textoPlano([doc.titulo, doc.resumen, (doc.etiquetas || []).join(' ')].join(' '));
    return SENALES_PERU.test(texto) ? 'nacional' : 'internacional';
  }

  var FuentesPrestigio = {
    medios: medios,
    dominios: dominios,
    revistas: revistas,
    editorialesAcademicas: editorialesAcademicas,
    editorialesDeLibros: editorialesDeLibros,
    editoriales: editoriales,
    PALABRAS_CLAVE: PALABRAS_CLAVE,
    esRelevante: esRelevante,
    esPaperRelevante: esPaperRelevante,
    esEditorialPrestigio: esEditorialPrestigio,
    sitioDe: sitioDe,
    dominiosAmpliados: dominiosAmpliados,
    esFuenteSelecta: esFuenteSelecta,
    esDescartable: esDescartable,
    ambitoDe: ambitoDe
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FuentesPrestigio;
  } else {
    raiz.FuentesPrestigio = FuentesPrestigio;
  }
})(typeof window !== 'undefined' ? window : globalThis);
