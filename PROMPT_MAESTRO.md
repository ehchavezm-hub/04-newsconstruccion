# Prompt maestro — Construcción Global (versión inicial)

> Este prompt describe **exactamente** la aplicación que debe construirse y publicarse en el
> repositorio `ehchavezm-hub/04-newsconstruccion`
> (`https://github.com/ehchavezm-hub/04-newsconstruccion`), con web en
> `https://ehchavezm-hub.github.io/04-newsconstruccion/`.
> Toma como base la arquitectura, el diseño y la accesibilidad de «Diplomacia Global»
> (`ehchavezm-hub/03-Diplomacia`), pero **todo el contenido temático se refiere al ciclo de vida de
> los proyectos de construcción: Ingeniería, Procura, Construcción, Puesta en marcha y Operación**.
> Guarde este documento en la raíz del repositorio como `PROMPT_MAESTRO.md`.

---

## 1. Rol y objetivo

Actúa como **Desarrollador Full Stack Senior, Arquitecto de Software y Experto en UI/UX con
enfoque en accesibilidad (WCAG 2.1 AA)**.

Construye **Construcción Global**: una aplicación web **extremadamente fácil de usar**, pensada para
**adultos mayores y personas no vinculadas a la tecnología**, que funciona como buscador
centralizado de **noticias, papers académicos y libros sobre ingeniería, procura, construcción,
puesta en marcha y operación de proyectos** (edificación, infraestructura, energía, minería,
industria y saneamiento), **solo de fuentes de gran prestigio**, con una sección
**Nacional (Perú)** y otra **Internacional**.

Las personas usuarias **solo reciben un enlace**: no instalan ni configuran nada.

- Repositorio: `ehchavezm-hub/04-newsconstruccion` (rama `main`). Todo el proyecto vive en la raíz.
- Enlace para compartir: `https://ehchavezm-hub.github.io/04-newsconstruccion/`
  (también `…/04-newsconstruccion/construccion/`, que redirige a la raíz).
- Idioma de la interfaz: **español**, tratamiento de **usted**, sin mensajes técnicos.
- Prefijo de variables globales y claves: `CG_` (por ejemplo `window.CG_VERSION`,
  `localStorage` con clave `cg-escala`).

---

## 2. Arquitectura general

- **Frontend estático** (HTML5 + Tailwind CSS compilado + JavaScript vainilla en archivos
  separados con patrón UMD, sin frameworks). Se publica en **GitHub Pages** desde `public/`.
- **Datos precalculados** por **GitHub Actions cada 4 horas** (JSON en `public/datos/`).
- **Consultas en vivo desde el navegador** al buscar un tema (servicios con CORS abierto):
  GDELT (noticias), Crossref (papers) y Open Library (libros).
- **Servidor Node.js opcional** (sin dependencias, `npm start`) para uso local/desarrollo, con la
  misma lógica y una función extra: buscar dentro de libros y normas propias.
- Los módulos de lógica (`motor-busqueda`, `fuentes-prestigio`, `crossref`, `gdelt`, `libros`,
  `temas`, `catalogo`) son **UMD**: los usa el navegador (`window.X`) y Node (`require`).

### Estructura de archivos

```
04-newsconstruccion/
├── .github/workflows/publicar.yml   Publica public/ en Pages; actualiza datos cada 4 h
├── .gitignore                       node_modules/, biblioteca/* (salvo LEEME.md y libros.json)
├── README.md                        Instrucciones sencillas y documentación
├── PROMPT_MAESTRO.md                Este documento
├── package.json                     start, sin-internet, test, css, actualizar
├── tailwind.config.js               Colores y fuentes de la plantilla
├── estilos-fuente/tailwind.css      Entrada de Tailwind (@tailwind base/components/utilities)
├── servidor.js                      Servidor HTTP Node (opcional)
├── herramientas/actualizar-semana.js  Genera los JSON de datos (lo corre GitHub Actions)
├── servidor/
│   ├── config.js                    Puerto 3000, fuentes en vivo, espera 5 s, caché 15 min
│   ├── buscador.js                  Une fuentes, quita duplicados, marca ámbito, ordena por fecha
│   ├── semana.js                    Novedades de los últimos 7 días
│   ├── archivo.js                   Archivo acumulativo de noticias de 90 días
│   └── fuentes/
│       ├── catalogo-local.js        Catálogo + libros-recientes.json
│       ├── noticias-rss.js          RSS/Atom de medios y Google Noticias por sitio
│       ├── noticias-gdelt.js        Búsqueda GDELT
│       ├── crossref.js              Papers de revistas de prestigio
│       ├── libros-recientes.js      Google Books + Open Library (build) / Open Library (búsqueda)
│       ├── biblioteca-personal.js   Fragmentos de libros y normas propias (.md/.txt)
│       └── utilidades.js            fetch con tiempo límite, caché
├── biblioteca/                      LEEME.md y libros.json (los libros no se versionan)
├── pruebas/pruebas.test.js          Pruebas (node:test), al menos 36
└── public/
    ├── index.html                   Página única con 4 pestañas
    ├── construccion/index.html      Redirección a ../
    ├── css/tailwind.css             Tailwind compilado (no requiere internet)
    ├── css/estilos.css              Estilos propios y escala tipográfica
    ├── img/icono.svg                Casco de obra y grúa en Slate + arco Claret sobre FT Pink
    ├── datos/catalogo.js            Catálogo local
    ├── datos/ultima-semana.json     Novedades 7 días (generado)
    ├── datos/noticias-archivo.json  Archivo 90 días (generado)
    ├── datos/libros-recientes.json  Libros desde hace 3 años (generado)
    └── js/
        ├── fuentes-prestigio.js     Lista única de fuentes, dominios, revistas, editoriales
        ├── temas.js                 Temas sugeridos
        ├── crossref.js              URL/conversión Crossref + utilidades de texto
        ├── gdelt.js                 URL/conversión GDELT
        ├── libros.js                Google Books / Open Library
        ├── motor-busqueda.js        Búsqueda sin tildes, sinónimos, orden por fecha
        ├── servicio-datos.js        Modos servidor / web / archivo; búsqueda en dos pasos
        ├── interfaz.js              Tarjetas, secciones por ámbito, paginación, avisos
        ├── voz.js                   Búsqueda por voz
        └── app.js                   Une todo
```

Orden de carga de scripts en `index.html` (todos con `?v=__VERSION__`):
`datos/catalogo.js`, `js/fuentes-prestigio.js`, `js/crossref.js`, `js/gdelt.js`, `js/libros.js`,
`js/temas.js`, `js/motor-busqueda.js`, `js/servicio-datos.js`, `js/interfaz.js`, `js/voz.js`,
`js/app.js`. Antes de ellos: `<script>window.CG_VERSION = '__VERSION__';</script>`.

---

## 3. Diseño visual (plantilla editorial estilo Financial Times)

Se mantiene la misma plantilla visual de Diplomacia Global, ya verificada en contraste, para que
ambas aplicaciones se reconozcan como una misma familia.

### Paleta (verificada con la fórmula de contraste WCAG 2.1)

| Uso | Color | Contraste |
|---|---|---|
| Fondo de página | FT Pink `#FFF1E5` | — |
| Texto principal | Slate Black `#33302E` | 11,8:1 |
| Cabecera y títulos H1 | FT Claret `#990F3D` (texto blanco encima 8,4:1) | 7,6:1 |
| Menú de pestañas | fondo Slate `#33302E`, texto blanco | 13,1:1 |
| Botón «Buscar», «Visitar enlace», enlaces | Oxford Blue `#0F5499`, texto blanco | 7,6:1 |
| Botón «Novedades de la semana» | Saffron `#F2AF26`, texto Slate, borde Slate | 6,8:1 |
| Fondos suaves / caja semanal | FT Pink Light `#F2E9DC`; bordes Pink Pale `#E2D7CA` | — |
| Texto secundario | Gray Dark `#66605A` (el Gray FT `#A8A49D` NO se usa: 2,2:1) | 5,6:1 |
| Descargas | FT Green oscurecido `#007A3D`, texto blanco | 5,5:1 |
| WhatsApp | `#075E54`, texto blanco | 7,7:1 |
| Papers | Purple Opinion `#593380` | 7,9:1 |
| Sección **Nacional (Perú)** | **Claret (rojo)** | — |
| Sección **Internacional** | **Oxford Blue (azul)** | — |
| Título «Tendencias e Innovación» | **Púrpura `#593380`** | 8,6:1 |
| Título «Ciclo de Vida del Proyecto (IPC)» | **Verde oscuro `#006432`** | 6,6:1 |
| Foco de teclado | contorno 4 px Oxford Blue (Saffron dentro de la cabecera) | 6,9:1 |

El rojo y el azul se reservan para Nacional/Internacional; las agendas temáticas usan púrpura y verde.

### Tipografía

- Texto: **Atkinson Hyperlegible Next** (Google Fonts, pesos 400/600/700; respaldo Verdana).
- Titulares: **Georgia** (serifa, estilo periódico; se ve en negrita porque no tiene seminegrita).
- Base del documento: 16 px (`html { font-size: calc(100% * var(--escala)) }`).
- Escala (clases propias en `estilos.css`):

| Elemento | Clase | Tamaño | Peso |
|---|---|---|---|
| Nombre «Construcción Global» | `t-marca` | 25 px | 700 |
| Encabezado H1 | `t-h1` | 23 px | 700 |
| Encabezado H2 y títulos de tarjeta | `t-h2` / `.titulo-tarjeta` | 19 px | 600 (Georgia: 700) |
| Botones, pestañas, filtros, temas | `t-boton` | 15 px | 600 |
| Texto de cuerpo y resúmenes | `t-cuerpo` | 16 px | 400 |
| Subtítulos, notas, fuente y fecha | `t-nota` | 14 px | 400 |

- Botones **A− / A+** cambian `--escala` entre 0,9 · 1 · 1,15 · 1,3 · 1,5 (se recuerda en
  `localStorage` con la clave `cg-escala`, con try/catch).

### Accesibilidad obligatoria

- Contraste AA en todo el texto (mínimo 5:1 en la práctica).
- Controles de al menos 44 px de alto (botones ~46 px; temas 44 px en escritorio y 40 px en teléfono).
- Iconos SVG de línea **siempre acompañados de texto**; sin emojis de banderas (Windows no los muestra).
- Enlace «Saltar al contenido principal», `aria-live` en estados y avisos, `aria-current` en la
  pestaña activa, foco al título de sección al cambiar de pestaña, filtros como radios reales,
  `prefers-reduced-motion`, modo de alto contraste de Windows.
- Sin desplazamiento horizontal a 390 px de ancho.
- Todo texto externo se inserta con `textContent`, nunca con `innerHTML`.
- Las siglas técnicas (EPC, BIM, O&M, FEED, APP) se muestran con su significado la primera vez que
  aparecen en un tema o en la ayuda, por ejemplo «EPC (Ingeniería, Procura y Construcción)».

---

## 4. Interfaz (página única `index.html`)

### Cabecera (fondo Claret)
Icono + «Construcción Global» (`t-marca`, Georgia) + subtítulo «Noticias, estudios y libros sobre
cómo se diseñan, construyen y operan las obras». A la derecha: «Tamaño del texto:» con **A−**,
**A+** y **Ayuda** (abre un `<dialog>` con 6 pasos de uso, en lenguaje sencillo, que incluye un
pequeño glosario: Ingeniería, Procura, Construcción, Puesta en marcha, Operación).

### Menú (fondo Slate), 4 pestañas grandes con icono y texto
**Buscar · Últimas Noticias · Papers Académicos · Libros Destacados** (2×2 en teléfono, 4 en fila en
escritorio). Navegación por `#hash`; la activa en FT Pink con texto Claret y barra inferior Claret.

### Sección «Buscar»
1. H1 «¿Qué desea encontrar?» + «Escriba un tema, un proyecto, una empresa o el nombre de un autor y
   pulse el botón **Buscar**.»
2. **Caja «¿Qué pasó esta semana en la construcción del Perú y el mundo?»** (fondo Pink Light, borde
   Saffron con franja izquierda gruesa): texto sobre los últimos 7 días y las fuentes (El Comercio,
   Gestión, Andina, RPP, CAPECO, ProInversión, ENR, Construction Dive, Global Construction Review,
   el Banco Mundial, el BID y revistas académicas), nota «Si antes escribe un tema en la caja de
   búsqueda, le mostraremos solo las novedades sobre ese tema», y botón Saffron
   **«Ver novedades de la última semana»** (ancho completo en teléfono).
3. **Formulario de búsqueda** (tarjeta blanca con borde Slate): etiqueta «Escriba aquí un tema,
   proyecto, empresa o autor», caja grande (placeholder «Por ejemplo: Puerto de Chancay o BIM»),
   botón azul **Buscar** con lupa, nota «Puede escribir en español o en inglés. No importan las
   mayúsculas ni las tildes.», botón **«Buscar hablando»** (micrófono) y filtros en pastillas
   «¿Qué busca?»: **Todos · 📰 Noticias · 📄 Papers / Investigaciones · 📘 Libros** (al cambiar,
   repite la vista actual).
4. **Temas sugeridos** — «¿No sabe por dónde empezar? Pulse un tema:», dos grupos generados desde
   `js/temas.js` (lado a lado en escritorio, uno bajo otro en teléfono):
   - 💡 **Tendencias e Innovación** (título púrpura): BIM y Construcción Digital ·
     IA y Automatización · Construcción Sostenible · Seguridad y Salud en Obra ·
     Infraestructura y APP.
   - 🏗️ **Ciclo de Vida del Proyecto (IPC)** (título verde oscuro): Ingeniería y Diseño ·
     Procura y Contratos · Construcción y Obra · Puesta en Marcha · Operación y Mantenimiento.
   - **Solo texto, sin marco ni fondo** (Slate, 15 px, 600). Al pasar el cursor y al estar elegido:
     color del grupo y subrayado (3 px si está elegido, `aria-pressed="true"`). En escritorio fluyen
     en filas alineadas con el título; en teléfono, uno por línea alineado bajo su título.
   - El grupo verde se muestra **en el orden del ciclo de vida** (Ingeniería → Procura →
     Construcción → Puesta en marcha → Operación), con una nota pequeña bajo su título:
     «Las etapas de un proyecto, de la idea a la operación.»
5. **Zona de resultados**: filtro «¿En qué idioma?» (Todos los idiomas / Solo en español, visible
   solo en la vista semanal), mensaje de estado y resultados en **dos secciones**.

### Sección «Últimas Noticias»
Noticias de los últimos 7 días en las dos secciones Nacional / Internacional. Si no hay datos, se
muestran las noticias explicativas «Contenido de ejemplo» con un aviso amable.

### Secciones «Papers Académicos» y «Libros Destacados»
Lista única, **del más reciente al más antiguo**. En Libros aparecen primero los libros recientes
de editoriales de prestigio (desde hace 3 años) y luego los clásicos del catálogo.

### Pie de página (Pink Light, borde superior Claret)
«Fuentes de prestigio que consultamos» por tipo (nacionales, entidades públicas y gremios,
organismos multilaterales, medios especializados, medios generales, revistas, libros), nota sobre
«Contenido de ejemplo» y «Novedades actualizadas por última vez el … a las …».

---

## 5. Resultados

### Secciones por ámbito (`mostrarPorAmbito`)
- **Nacional (Perú)** primero (icono de ubicación, título y línea inferior en Claret) e
  **Internacional** después (icono de globo, Oxford Blue). Cada una con contador, la nota
  «De la más reciente a la más antigua» y un mensaje propio si queda vacía.
- Ámbito: por la fuente (RSS/GDELT); si no la hay (papers, libros), «nacional» cuando el texto
  menciona Perú/peruano/peruana/Lima/Callao/Chancay/ProInversión/CAPECO/OECE/ANIN/MTC.
- **Paginación de 10 en 10** con botón «Ver 10 resultados más (quedan N)»; el foco pasa al primer
  resultado nuevo.

### Tarjeta de resultado
- Rejilla de dos columnas: **contenido a la izquierda** y, **arriba a la derecha, botones pequeños
  apilados** (ancho 9,5 rem; 7,5 rem en teléfono; 13 px; alto 36 px):
  **Visitar enlace** (azul) · **Descargar PDF/Texto** (verde, solo si es de acceso libre) ·
  **WhatsApp** (verde WhatsApp).
- Etiquetas: 📰 Noticia / 📄 Paper Académico / 📘 Libro / 📐 Norma o Guía (para documentos
  normativos del catálogo), «Contenido de ejemplo», «Publicado hoy / ayer / hace N días» (hasta
  13 días), «En inglés», «Acceso libre ✓».
- Título (Georgia 19 px), resumen (16 px), datos (14 px): Autor (se omite si repite la fuente),
  Fuente con su tipo entre paréntesis, Fecha («26 de septiembre de 2026», «septiembre de 2000»,
  «1994», «Hacia el año 15 a. C.»). Franja izquierda: Claret noticia, púrpura paper, azul libro,
  verde oscuro norma o guía.
- No se muestra ninguna nota de «no es de descarga libre».
- **Visitar enlace** y **WhatsApp** abren pestaña nueva; WhatsApp usa `https://wa.me/?text=` con
  «Te comparto esto que encontré en Construcción Global:», título, autor y enlace.
- **Descargar**: pestaña nueva sin atributo `download`; aviso «¡Descarga iniciada con éxito! …».
  Con servidor: `/api/descargar/:id` (solo documentos conocidos, `Content-Disposition`).

### Enlace de respaldo
Tras cada búsqueda con texto (Todos o Noticias): «¿No encuentra lo que busca? Buscar «…» en Google
Noticias (solo medios de prestigio)», limitado con `site:` a elcomercio.pe, gestion.pe, andina.pe,
rpp.pe, larepublica.pe, enr.com, constructiondive.com, globalconstructionreview.com, reuters.com,
bnamericas.com (para un tema: sus 3 términos principales con OR).

---

## 6. Fuentes de prestigio (`public/js/fuentes-prestigio.js`, lista única)

Regla general: cada canal RSS indicado **se comprueba durante el desarrollo**; si no responde o
bloquea lectores automáticos, se sustituye por **Google Noticias por sitio** (mismo nombre visible)
y se anota en `README.md`. Nunca se inventan direcciones de canal.

### Medios RSS (novedades y archivo)
`especializado:true` = todo su contenido es del sector; `especializado:false` = solo se aceptan
noticias con palabras clave del sector (ver lista de relevancia más abajo).

**Nacional (Perú):**
- El Comercio — Economía (`elcomercio.pe/arcio/rss/category/economia/`, filtrado).
- Gestión — Economía (`gestion.pe/arcio/rss/category/economia/`, filtrado) y Gestión — Perú
  (`gestion.pe/arcio/rss/category/peru/`, filtrado).
- La República — Economía (filtrado) · RPP — Economía (filtrado) · Andina — Economía (filtrado).
- Semana Económica (Google Noticias `site:semanaeconomica.com`, filtrado).
- Gremios y medios especializados vía Google Noticias por sitio (especializados): CAPECO
  (`site:capeco.org`), Colegio de Ingenieros del Perú (`site:cip.org.pe`), Rumbo Minero
  (`site:rumbominero.com`), Energiminas (`site:energiminas.com`).
- Entidades públicas vía Google Noticias (especializadas): ProInversión
  (`site:gob.pe/proinversion`), Ministerio de Transportes y Comunicaciones (`site:gob.pe/mtc`),
  Ministerio de Vivienda, Construcción y Saneamiento (`site:gob.pe/vivienda`), OECE — contrataciones
  públicas (`site:gob.pe/oece`), Autoridad Nacional de Infraestructura (`site:gob.pe/anin`),
  Contraloría — obras (`site:gob.pe/contraloria`, filtrado).
- El Peruano (Google Noticias `site:elperuano.pe`, filtrado).

**Internacional:**
- Medios especializados (especializados): Engineering News-Record — ENR (`site:enr.com`),
  Construction Dive (canal RSS propio), Global Construction Review (canal RSS propio),
  New Civil Engineer, Construction News, BNamericas — Infraestructura (`site:bnamericas.com`),
  Mining.com, Power Engineering.
- Organismos multilaterales vía Google Noticias (especializados o filtrados): Banco Mundial
  (`site:worldbank.org`), BID (`site:iadb.org`), CAF (`site:caf.com`), Global Infrastructure Hub
  (`site:gihub.org`), OCDE — infraestructura (filtrado).
- Agencias vía Google Noticias (filtradas): Reuters (`site:reuters.com`), AP, EFE, Europa Press,
  Bloomberg.
- Consultoras y análisis (filtrados): McKinsey — Capital Projects & Infrastructure
  (`site:mckinsey.com`), Deloitte, PwC.
- Medios generales (filtrados): BBC Mundo, El País — Economía, DW Español, The Guardian,
  Financial Times, The Economist.

Google Noticias por sitio: `https://news.google.com/rss/search?q=<site:…> when:7d&hl=es-419&gl=PE&ceid=PE:es-419`
(para medios en inglés, `hl=en-US&gl=US&ceid=US:en`); se quita « - Medio» del titular y el resumen
es «Publicado por X. Pulse «Visitar enlace» para leerlo completo.»

### Palabras clave de relevancia (para fuentes `especializado:false`)
construcción, construction, obra, infraestructura, infrastructure, ingeniería, engineering,
licitación, tender, contrato, concesión, concession, carretera, highway, puente, bridge, túnel,
tunnel, puerto, port, aeropuerto, airport, ferrocarril, railway, metro, hidroeléctrica, central
eléctrica, power plant, planta, refinería, refinery, proyecto minero, mining project, saneamiento,
agua potable, vivienda, edificación, building, EPC, BIM, cemento, cement, acero estructural,
APP, PPP, obras por impuestos, reconstrucción, ProInversión, CAPECO, OECE, ANIN, megaproyecto,
puesta en marcha, commissioning, mantenimiento, maintenance.

### Dominios para la búsqueda de noticias (GDELT)
Nacional: elcomercio.pe, gestion.pe, larepublica.pe, rpp.pe, andina.pe, elperuano.pe,
semanaeconomica.com, rumbominero.com, energiminas.com, capeco.org, cip.org.pe, ojo-publico.com,
convoca.pe, gob.pe (incluye subdominios .gob.pe).
Internacional: enr.com, constructiondive.com, globalconstructionreview.com, newcivilengineer.com,
constructionnews.co.uk, bnamericas.com, mining.com, power-eng.com, reuters.com, apnews.com,
efe.com, europapress.es, bloomberg.com, ft.com, economist.com, theguardian.com, bbc.com,
elpais.com, dw.com, worldbank.org, iadb.org, caf.com, oecd.org, gihub.org, mckinsey.com.

### Revistas académicas (Crossref, por ISSN; comprobar cada ISSN en Crossref al desarrollar)
Journal of Construction Engineering and Management (ASCE) · Journal of Management in Engineering
(ASCE) · Journal of Legal Affairs and Dispute Resolution in Engineering and Construction (ASCE) ·
Journal of Computing in Civil Engineering (ASCE) · International Journal of Project Management ·
Project Management Journal · Construction Management and Economics · Engineering, Construction and
Architectural Management · Automation in Construction · Journal of Building Engineering ·
Construction and Building Materials · Tunnelling and Underground Space Technology · Safety Science ·
Reliability Engineering & System Safety · Journal of Cleaner Production (filtrado por términos de
construcción).

### Editoriales de prestigio (libros)
Wiley, Wiley-Blackwell, Routledge, Taylor & Francis, CRC Press, Elsevier, Butterworth-Heinemann,
Gulf Professional Publishing, Springer, McGraw-Hill, Pearson, Cambridge, Oxford, MIT Press,
ASCE Press, ICE Publishing, Thomas Telford, RIBA Publishing, Project Management Institute (PMI),
AACE International, FIDIC, Industrial Press, Kogan Page, Penguin, Currency, Reverté, Paraninfo,
Marcombo, Díaz de Santos, Fondo Editorial PUCP, Fondo Editorial UNI, Universidad de Lima,
Universidad del Pacífico, Editorial Macro.

---

## 7. Búsqueda

### Motor (`motor-busqueda.js`)
- Normaliza: minúsculas, sin tildes ni signos. Coincidencia al **inicio de palabra**; un término
  que termina en espacio exige **palabra exacta** («ia » no encuentra «ingeniería»; «epc » no
  encuentra palabras que empiecen por «epc…»).
- Sinónimos es/en:
  EPC = IPC = Ingeniería, Procura y Construcción = Engineering, Procurement and Construction ·
  procura = procurement = adquisiciones = compras · licitación = tender = bidding = concurso ·
  puesta en marcha = commissioning = comisionamiento = arranque = start-up ·
  operación y mantenimiento = O&M = operation and maintenance ·
  BIM = Building Information Modeling = modelado de información de la construcción ·
  APP = PPP = asociación público-privada = public-private partnership ·
  obra = construction site · contrato = contract · reclamo = claim · arbitraje = arbitration ·
  cronograma = schedule · ruta crítica = critical path · valor ganado = earned value ·
  seguridad y salud = HSE = SSOMA · mantenimiento = maintenance · confiabilidad = reliability ·
  gemelo digital = digital twin · carretera = road = highway · puente = bridge · túnel = tunnel ·
  puerto = port · minería = mining · energía = energy.
- Texto libre: deben aparecer **todos** los conceptos. Tema sugerido: basta **cualquiera** de sus términos.
- Pesos: título 4, etiquetas 3, autor 3, fuente 1, resumen 1.
- **Orden de todas las listas: de lo más reciente a lo más antiguo** («de hoy hacia atrás»); la
  relevancia solo decide qué coincide y desempata.

### Temas (`temas.js`)
Cada tema tiene `id`, `etiqueta`, `grupo` y 14–25 `terminos` es/en (los primeros, los más
representativos, van a GDELT). Al pulsar uno: la caja muestra su nombre, queda marcado y se buscan
sus términos; si la persona edita la caja, se vuelve a búsqueda normal. Aplica también al botón
semanal.

**Grupo «Tendencias e Innovación» (`innovacion`, púrpura)**

| id | Etiqueta | Términos (en este orden) |
|---|---|---|
| `bim-digital` | BIM y Construcción Digital | BIM, building information modeling, gemelo digital, digital twin, construcción digital, digital construction, modelado de información, ISO 19650, Plan BIM Perú, IFC, modelo 4D, 5D, nube de puntos, point cloud, escaneo láser, drones en obra, construction technology, contech |
| `ia-automatizacion` | IA y Automatización | inteligencia artificial, artificial intelligence, «ia », automatización, automation, robótica, construction robotics, impresión 3D, 3D printing, visión artificial, computer vision, machine learning, analítica predictiva, predictive analytics, internet de las cosas, IoT, sensores |
| `sostenible` | Construcción Sostenible | construcción sostenible, sustainable construction, edificación verde, green building, carbono incorporado, embodied carbon, huella de carbono, LEED, EDGE, eficiencia energética, energy efficiency, economía circular, circular economy, net zero, cemento bajo en carbono, low-carbon concrete, resiliencia climática, climate resilience |
| `seguridad-obra` | Seguridad y Salud en Obra | seguridad en obra, construction safety, seguridad y salud en el trabajo, occupational safety, SSOMA, HSE, accidente de trabajo, workplace accident, prevención de riesgos, Norma G.050, ISO 45001, OSHA, SUNAFIL, trabajos en altura, working at height, equipos de protección personal, PPE |
| `infraestructura-app` | Infraestructura y APP | infraestructura, infrastructure, asociación público-privada, public-private partnership, APP, PPP, obras por impuestos, ProInversión, concesión, concession, brecha de infraestructura, infrastructure gap, gobierno a gobierno, megaproyecto, megaproject, project finance, financiamiento de proyectos, Plan Nacional de Infraestructura |

**Grupo «Ciclo de Vida del Proyecto (IPC)» (`ciclo`, verde oscuro, en este orden)**

| id | Etiqueta | Términos (en este orden) |
|---|---|---|
| `ingenieria` | Ingeniería y Diseño | ingeniería de detalle, detailed engineering, ingeniería básica, basic engineering, FEED, front-end engineering design, ingeniería conceptual, conceptual engineering, estudio de factibilidad, feasibility study, expediente técnico, diseño estructural, structural design, constructabilidad, constructability, ingeniería de valor, value engineering, estudio de preinversión |
| `procura` | Procura y Contratos | procura, procurement, contrato EPC, EPC contract, licitación, tender, bidding, adquisiciones, cadena de suministro, supply chain, contrataciones públicas, public procurement, OECE, Ley 32069, FIDIC, NEC4, expediting, inspección en fábrica, arbitraje de construcción, construction arbitration, reclamos, claims |
| `construccion` | Construcción y Obra | ejecución de obra, construction project, gestión de proyectos, project management, cronograma, schedule, ruta crítica, critical path, valor ganado, earned value, control de costos, cost control, Lean Construction, Last Planner, productividad, construction productivity, supervisión de obra, control de calidad, quality control, sobrecostos, cost overrun |
| `puesta-marcha` | Puesta en Marcha | puesta en marcha, commissioning, comisionamiento, precomisionamiento, pre-commissioning, arranque, start-up, completamiento mecánico, mechanical completion, pruebas de desempeño, performance test, entrega de sistemas, handover, turnover, pruebas FAT, pruebas SAT, recepción de obra, liquidación de obra |
| `operacion` | Operación y Mantenimiento | operación y mantenimiento, operation and maintenance, O&M, mantenimiento predictivo, predictive maintenance, confiabilidad, reliability, RCM, gestión de activos, asset management, ISO 55000, disponibilidad, availability, facility management, parada de planta, shutdown, turnaround, vida útil, life cycle cost |

### Modos de datos (`servicio-datos.js`)
- `web` (GitHub Pages; se detecta por `*.github.io`, sin consultar `api/estado`),
  `servidor` (responde `api/estado`), `archivo` (`file://`, solo catálogo).
- Los JSON se piden con `?v=CG_VERSION` para no mezclar versiones.
- **Búsqueda en dos pasos**:
  1. **Al instante**: semana + archivo de 90 días (se descarga solo al buscar un tema) + libros
     recientes + catálogo (las noticias de ejemplo se ocultan si hay noticias reales).
  2. **En segundo plano**: GDELT (espera hasta 30 s; suele tardar ~14 s), Crossref (20 filas) y
     Open Library (editoriales de prestigio). Mientras tanto: «… Seguimos buscando más en medios
     especializados y agencias de prestigio…»; al llegar, se vuelve a dibujar todo junto, sin
     repetidos y por fecha.
- Un contador de turnos evita que una respuesta lenta reemplace una búsqueda más nueva.
- Si algo falla: nunca queda en «Buscando…»; se muestra lo guardado o «No pudimos completar la
  búsqueda en este momento. Por favor, inténtelo de nuevo.».
- **Google Books no se usa en el navegador** (cuota sin clave agotada).

### GDELT (`gdelt.js`)
`https://api.gdeltproject.org/api/v2/doc/doc?query=<tema> (domainis:… OR …)&mode=ArtList&format=json&sort=DateDesc&maxrecords=75`.
Texto de varias palabras → frase exacta; tema → `(t1 OR "t 2" OR …)` con 8 términos de ≥4 letras
(las siglas de 3 letras como BIM, EPC o APP se aceptan solo si van junto a otro término del tema).
Palabras de menos de 3 letras se descartan. Respuestas no JSON → lista vacía. Solo se aceptan
artículos de dominios de la lista; resumen «Noticia de X. Pulse «Visitar enlace» para leerla completa.»

### Novedades de la semana
Filtra por fecha ≥ ahora − 7 días, por tema/términos y por idioma. Mensaje: «Novedades de los
últimos 7 días (del D de mes al D de mes)[ sobre «…»]: N publicaciones de M fuentes de prestigio.»
Sin datos: «En este momento no podemos consultar las novedades…».

---

## 8. Datos generados (GitHub Actions)

`herramientas/actualizar-semana.js` (`npm run actualizar`), nunca termina con error:
1. **`ultima-semana.json`**: todos los medios (hasta 40 por medio), últimos 7 días, sin titulares
   repetidos, por fecha; más papers de Crossref publicados en los últimos 7 días en las revistas de
   la lista. Informa ✔/✘ por fuente. `generado = null` si ninguna fuente respondió.
2. **`noticias-archivo.json`**: descarga el archivo ya publicado en la web, le suma lo nuevo, quita
   repetidos (por enlace y título) y lo mayor de **90 días**; versión compacta (resumen 200 caracteres).
3. **`libros-recientes.json`**: libros desde hace **3 años** de editoriales de prestigio sobre
   gestión de proyectos, construcción, ingeniería, contratos, puesta en marcha y mantenimiento
   (Google Books si responde; Open Library como fuente efectiva).
4. No reemplaza datos buenos por listas vacías.

### Flujo `.github/workflows/publicar.yml`
Disparadores: push a `main`, manual y `cron: "23 */4 * * *"`. Pasos: checkout → Node 22 →
`npm test` → `npm run actualizar` (continue-on-error, 5 min) → `sed` que reemplaza `__VERSION__`
por `<sha8>-<run>` en `index.html` → `upload-pages-artifact` (path `public`) → `deploy-pages`.
Permisos: `contents: read`, `pages: write`, `id-token: write`; `concurrency: pages`.
Configuración única en `ehchavezm-hub/04-newsconstruccion`: **Settings → Pages → Source: GitHub Actions**.

---

## 9. Catálogo local (`public/datos/catalogo.js`)

Cada enlace (Open Library, Gutenberg, DOI o PDF oficial) **se comprueba durante el desarrollo**;
si uno no responde, se reemplaza por la ficha de Open Library o por la página oficial del documento.

- **Libros (13):**
  - Guía del PMBOK, 7.ª ed. (Project Management Institute, 2021).
  - Construction Planning, Equipment, and Methods (Peurifoy, Schexnayder y otros; McGraw-Hill).
  - Construction Management (Halpin y Senior; Wiley).
  - BIM Handbook, 3.ª ed. (Sacks, Eastman, Lee y Teicholz; Wiley, 2018).
  - Industrial Megaprojects (Edward W. Merrow; Wiley, 2011).
  - Megaprojects and Risk (Flyvbjerg, Bruzelius y Rothengatter; Cambridge, 2003).
  - How Big Things Get Done (Flyvbjerg y Gardner; Currency, 2023).
  - This is Lean / The Toyota Way (Jeffrey Liker; McGraw-Hill, 2004) — base del Lean Construction.
  - Reliability-Centered Maintenance, 2.ª ed. (John Moubray; Industrial Press, 1997).
  - Project Management: A Systems Approach (Harold Kerzner; Wiley).
  - FIDIC Conditions of Contract for Construction («Red Book», 2.ª ed., FIDIC, 2017).
  - y en dominio público (Proyecto Gutenberg, en inglés, descarga .txt): **Los diez libros de
    arquitectura** de Vitruvio (trad. Morgan, 1914) y **The Principles of Scientific Management**
    de Frederick W. Taylor (1911).
- **Papers y documentos (10):**
  - Koskela (1992), «Application of the New Production Philosophy to Construction», CIFE
    Technical Report 72, Stanford (PDF libre).
  - Ballard (2000), «The Last Planner System of Production Control», tesis doctoral, University of
    Birmingham (acceso libre).
  - Atkinson (1999), «Project management: cost, time and quality…», International Journal of
    Project Management (DOI).
  - Flyvbjerg, Holm y Buhl (2002), «Underestimating Costs in Public Works Projects: Error or Lie?»,
    Journal of the American Planning Association (DOI).
  - Flyvbjerg (2014), «What You Should Know About Megaprojects and Why», Project Management
    Journal (DOI).
  - Succar (2009), «Building information modelling framework», Automation in Construction (DOI).
  - Williams (1999), «The need for new paradigms for complex projects», International Journal of
    Project Management (DOI).
  - 📐 Ley N.º 32069, Ley General de Contrataciones Públicas del Perú (2024) — PDF de El Peruano.
  - 📐 Norma G.050 «Seguridad durante la construcción», Reglamento Nacional de Edificaciones —
    PDF del Ministerio de Vivienda.
  - 📐 Guía de Asociaciones Público-Privadas / materiales de ProInversión o del Banco Mundial
    (PPP Knowledge Lab) — enlace oficial.
- **Noticias de ejemplo (6)**, marcadas `ejemplo: true` y «Contenido de ejemplo»: textos
  explicativos que enlazan a portadas reales (por ejemplo, la sección de economía de Gestión, la
  página de proyectos de ProInversión, CAPECO, ENR, Construction Dive y el área de infraestructura
  del Banco Mundial); solo aparecen si no hay noticias reales.
- Resúmenes de 2–3 líneas en lenguaje sencillo, explicando las siglas.

---

## 10. Servidor local (opcional, `servidor.js`)

Sin dependencias (Node ≥ 18). Rutas: `GET /api/estado`, `/api/buscar?q=&tipo=&t=` (t = términos de
tema separados por «|»), `/api/semana` (caché 30 min), `/api/descargar/:id`, y archivos de
`public/` (protegido contra salir de la carpeta). Fuentes: catálogo + libros recientes, RSS,
GDELT, Crossref, Open Library y **biblioteca personal** (párrafos de libros, normas y
especificaciones propias .md/.txt en `biblioteca/`, con capítulo y ubicación aproximada; nunca se
descargan ni se suben a GitHub). `npm run sin-internet` desactiva las fuentes externas.

---

## 11. Pruebas (`npm test`, al menos 36 con `node:test`, sin internet)

Catálogo (campos, ids únicos, noticias marcadas como ejemplo, tipo «norma») · motor (tildes,
sinónimos EPC/IPC, commissioning/puesta en marcha, BIM, filtros, orden por fecha incluso con tema,
peso del título) · temas (10 temas en 2 grupos, orden del ciclo de vida, búsqueda por cualquiera,
palabra exacta «ia », OR en GDELT, siglas de 3 letras) · Crossref (licencia abierta, filtros ISSN y
fecha) · RSS (fechas, HTML escapado, Atom, filtro de relevancia del sector, Google Noticias) ·
fuentes (URL https, ámbito) · GDELT (frase exacta, dominios, ámbito, respuesta no JSON) · libros
(editorial y año) · ámbito nacional/internacional (Chancay, ProInversión → nacional) · archivo de
90 días · novedades (7 días, duplicados, fuente caída, sin respuesta → `generado: null`) · servidor
(página, API, filtro, ruta protegida, descarga real y denegada).

---

## 12. README (instrucciones para principiantes)

Enlace para compartir (`https://ehchavezm-hub.github.io/04-newsconstruccion/`), cómo se actualiza
solo, configuración única de Pages, cómo busca, temas y glosario del ciclo IPC, lista de fuentes,
colores y tamaños, orden de resultados, cómo probar localmente paso a paso (doble clic en
`public/index.html`; o instalar Node LTS, abrir terminal en Windows/Mac/Linux, `npm start`, abrir
`http://localhost:3000`, Ctrl + C para apagar), puerto alternativo, biblioteca personal, estructura
de archivos, cómo conectar nuevas fuentes, qué canales RSS se sustituyeron por Google Noticias,
variables de entorno, accesibilidad y comandos de desarrollo (`npm test`, `npm run css`,
`npm run actualizar`).

---

## 13. Restricciones conocidas (comportamiento esperado)

- GDELT limita a 1 consulta cada 5 s por IP y tarda ~14 s: por eso la búsqueda en dos pasos y el archivo.
- Google Books sin clave responde 429: solo se intenta al generar datos; se usa Open Library.
- Algunos medios especializados (ENR, BNamericas) tienen contenido de pago: se muestra el titular y
  el enlace; el resumen es el genérico «Publicado por X…».
- Algunas entidades públicas y gremios pueden traer 0 noticias en una semana: es normal y no es error.
- La primera vez tras una actualización grande, puede hacer falta **Ctrl + F5** una sola vez; las
  versiones marcadas evitan que se repita.

---

## 14. Actualización 1 (reemplaza lo indicado en las secciones 3, 4 y 7)

### Tipografía
**Atkinson Hyperlegible** (Google Fonts, pesos 400 y 700, normal e itálica; respaldo Verdana) en
toda la página, **también en los titulares** (ya no se usa Georgia). Como la fuente no tiene
seminegrita, los elementos de peso 600 se muestran en 700. La escala de tamaños no cambia.

### Paleta: NASA en versión minimalista
Fondo blanco, pocos colores y contraste AA verificado:
Space Black `#0E1A2B` (texto y menú, 17,5:1) · Space Gray `#293241` (texto secundario, 12,9:1) ·
NASA Blue `#0B3D91` (cabecera, títulos H1, botón Buscar, enlaces, sección Internacional, 10:1) ·
Mission Red `#C91B1B` (sección Nacional, 5,7:1) · NASA Red `#FC3D21` (solo acento gráfico: barra de
la pestaña activa, franja de noticias, indicador de carga) · Solar Gold `#FDB515` (botón de
novedades con texto Space Black, 9,8:1) · Earth Green `#0A7C3E` (descargas, normas, 5,3:1) ·
Science Blue `#1B81A8` (solo franja de papers) · Sky Gray `#9BB4C8` (solo bordes) · cajas en
`#F2F5F8`. Foco: NASA Blue 4 px (Solar Gold en la cabecera). WhatsApp conserva `#075E54`.
Etiquetas de tipo con texto Space Black y el color del tipo solo en el borde. Esquinas de 0,5 rem,
bordes finos, sin emojis en los títulos de los grupos de temas.

### Temas sugeridos: 5 grupos numerados, 22 temas
Títulos de grupo en Space Black con su número en NASA Blue; un tema por línea; el elegido en
NASA Blue subrayado 3 px. Lo que va entre paréntesis en la etiqueta se muestra sin negrita.
Rejilla de 3 columnas en escritorio, 2 en tableta y 1 en teléfono. Cada grupo puede llevar una
nota y una línea «Siglas: …» con el significado de las siglas.

1. **Planificación:** AWP (Advanced Work Packaging) · Last Planner System (LPS) · PPM (Project
   Production Management) · Constructabilidad e Ingeniería de Valor · Programación Rítmica y
   Líneas de Balance.
2. **Métodos Constructivos y Sistemas de Soporte:** Métodos Constructivos · Sistemas de
   Encofrados · Andamios · Procesos Constructivos.
3. **Tecnologías y Metodologías Integradas:** VDC (Virtual Design and Construction) · BIM ·
   Gestión de la Información para la construcción · IA y Automatización de Procesos ·
   Construcción e Industrialización Digital.
4. **Ciclo de Vida y Fases del Proyecto** (en orden, con la nota «Las etapas de un proyecto, de la
   idea a la operación.»): Ingeniería y Diseño (FEED) · Procura y Contratos · Construcción y
   Montaje · Puesta en Marcha (Commissioning) · Operación y Mantenimiento (O&M).
5. **Marcos de Gestión de Proyectos y Gobernanza:** PMBOK y Estándares del PMI · PRINCE2
   (Gobernanza y Control) · IPMA (Modelo de Competencias ICB4).

Los términos de cada tema (14–25, en español e inglés) están en `public/js/temas.js`. Las siglas
cortas llevan espacio final para exigir palabra exacta («BIM » no encuentra «bimestre») y se
evitan siglas ambiguas en inglés (por ejemplo, «ICE»).

---

## 15. Actualización 2: solo resultados vigentes y relacionados con los temas

### Regla para las 4 ventanas (Buscar, Últimas Noticias, Papers Académicos, Libros Destacados)
Todo resultado debe estar **vigente a la fecha** y **relacionado, directa o indirectamente**, con
los 22 temas de la sección 14:
- Vigencia (`VIGENCIA_DIAS` en `motor-busqueda.js`): noticias 90 días (7 en Últimas Noticias);
  papers y libros 12 meses (si solo hay año, el año del límite o posterior); normas solo con
  `vigente: true`; el contenido de ejemplo nunca. Los clásicos del catálogo no se muestran.
  Crossref usa la fecha más temprana (impresa o en línea), así no se cuelan artículos publicados en
  línea años antes.
- Relación (`Motor.temasDe`, `Motor.esDeLosTemas`, `Motor.aptos`): directa si el título, resumen o
  etiquetas contienen un término del tema; indirecta si contienen uno de sus `relacionados`
  (`RELACIONADOS` en `temas.js`). La fuente no cuenta, ni los resúmenes genéricos («Publicado por…»).
  Cada tarjeta muestra «Tema: …».
- Se aplica en el navegador, en el servidor y al generar los datos (semana, archivo de 90 días,
  papers y libros recientes). Si Últimas Noticias queda vacía, se explica con un mensaje (ya no se
  muestran noticias de ejemplo).

### Búsqueda abierta a más fuentes de prestigio
- **Crossref por editorial:** con un tema o texto, busca en todas las revistas y congresos de
  Elsevier (10.1016), ASCE (10.1061), Taylor & Francis (10.1080), Emerald (10.1108), SAGE (10.1177),
  Wiley (10.1002, 10.1111), Springer (10.1007), ICE Publishing (10.1680), Canadian Science Publishing
  (10.1139), IEEE (10.1109), ACM (10.1145), Cambridge (10.1017), Oxford (10.1093), IGLC (10.24928) e
  ISARC (10.22260); tipos artículo y ponencia; `from-pub-date` de hace 12 meses. Cada tema tiene una
  `academica` (consulta en inglés) para Crossref y Open Library.
- **`papers-recientes.json`** (nuevo): papers de los últimos 12 meses de cada uno de los 22 temas.
  `libros-recientes.json` también se genera tema por tema (12 meses).
- **Institutos, asociaciones y empresas** (Google Noticias por sitio): CII, Lean Construction
  Institute, Project Production Institute, PMI, IPMA, PeopleCert, buildingSMART, ASCE, ICE, RICS,
  AACE, Dodge Construction Network, Arup, Autodesk, BCG, KPMG, EY, Foro Económico Mundial, SENCICO y
  Plan BIM Perú.
- **Libros por Crossref:** además de Open Library, los libros recientes (tipos book, monograph,
  edited-book, reference-book) de las editoriales académicas y de libros de prestigio: Routledge
  (10.4324), CRC Press (10.1201), McGraw-Hill (10.1036), De Gruyter (10.1515), Palgrave (10.1057)
  y las de la lista de papers.

---

## 16. Actualización 3: período elegible, búsqueda abierta con selectividad y sin negritas en los temas

### Temas sin negritas
Títulos de grupo y temas en peso normal (400); la jerarquía la dan el tamaño y la línea bajo el
título. El tema elegido va en NASA Blue con subrayado de 3 px.

### Período (obligatorio en las 4 pestañas)
Por defecto, **último año (365 días)** en Buscar, Últimas Noticias, Papers Académicos y Libros
Destacados. Control «¿De qué fecha?» (pastillas) arriba de las pestañas: Último año · Últimos 2 ·
3 · 4 · 5 años · Todo el tiempo; se recuerda en `localStorage` (`cg-periodo`). `Motor.PERIODOS`,
`Motor.vigente(doc, ahora, anios)` y `Motor.aptos(docs, ahora, anios)`; servidor: `/api/buscar?p=`.
El botón «Ver novedades de la última semana» sigue mostrando 7 días.

### Búsqueda abierta con selectividad
- **Noticias por tema (Google Noticias, solo al generar datos):** consulta del Perú
  (`temas.js → noticias.es` + «Perú», edición PE) y del mundo (`noticias.en`, edición US), con
  `when:1y` o `after:/before:`. Se usa la fuente real (`<source url>`) y solo se aceptan fuentes
  selectas (`esFuenteSelecta`: listas de prestigio o sitios oficiales/académicos) que no estén en
  `dominiosExcluidos`; se descartan titulares de empleo, cursos y «estudios de mercado»
  (`esDescartable`). Lo peruano (sitio .pe o texto sobre el Perú) es «Nacional».
- **Papers (OpenAlex, navegador y datos):** `title_and_abstract.search` con `temas.js → openalex`,
  por fechas; solo fuentes `is_core`, `is_in_doaj` o de editoriales de prestigio; consulta aparte
  con `authorships.countries:PE` → «Nacional».
- **Archivo histórico** (`servidor/ventanas.js`, `servidor/archivo.js`): noticias, papers y libros
  en `*-anio.json` (último año) y `*-historico.json` (anterior, solo se descarga si el período es
  mayor). Cada actualización consulta el último año y una ventana antigua rotativa; con
  `VENTANAS=todas` (entrada del flujo manual) se llenan todas. Máximos: 6000 noticias, 5000 papers,
  3000 libros.

## 17. Actualización 4: escala tipográfica minimalista

| Elemento | Tamaño | Peso |
|---|---|---|
| Nombre «Construcción Global» | 20 px | Negrita |
| Títulos H1 | 18 px | Normal |
| H2, títulos de tarjetas, mensajes de estado, títulos de grupos de temas | 15 px | Normal |
| Texto del buscador, texto y resúmenes | 12 px | Normal |
| Botones, pestañas, filtros, temas sugeridos, opciones de período | 10 px | Normal |
| Notas, fuente, fecha, etiquetas, siglas | 10 px | Normal |
| Botones pequeños de las tarjetas | 8 px | Normal |

- Diseño más minimalista: bordes y líneas de 1 px (bordes laterales de tarjetas 3 px), sin sombras gruesas.
- Interlineado 1,4 en el texto (1,2–1,3 en títulos).
- Los botones A− / A+ siguen agrandando todo hasta 150 %.

## 18. Actualización 5: escala tipográfica definitiva (reemplaza la tabla de la sección 17)

| Elemento | Tamaño | Peso |
|---|---|---|
| Nombre «Construcción Global» (cabecera) | 22 px | Negrita |
| Títulos principales (H1) | 20 px | Negrita |
| Subtítulos (H2), títulos de tarjetas y mensajes de estado | 16 px | Negrita |
| Títulos de los grupos de temas | 16 px | Normal |
| Texto de la caja de búsqueda | 14 px (13 px en teléfono) | Normal |
| Texto de cuerpo y resúmenes | 13 px | Normal |
| Botones principales, pestañas y filtros | 13 px | Negrita |
| Temas sugeridos y opciones de período | 12 px | Normal |
| Notas, fuente, fecha, etiquetas y siglas | 11 px | Normal |
| Botones pequeños de cada tarjeta | 10 px | Negrita |

Se mantienen las líneas finas (1 px) y el diseño minimalista; interlineado 1,45.

## 19. Actualización 6: escala tipográfica final (reemplaza las tablas de las secciones 17 y 18)

| Elemento | Tamaño | Peso |
|---|---|---|
| Nombre «Construcción Global» (cabecera) | 23 px | Negrita |
| Títulos principales (H1) | 21 px | Negrita |
| Subtítulos (H2), títulos de tarjetas y mensajes de estado | 19 px | Negrita |
| Títulos de los grupos de temas | 19 px | Normal |
| Texto de la caja de búsqueda | 17 px (16 px en teléfono) | Normal |
| Texto de cuerpo y resúmenes | 16 px | Normal |
| Botones principales, pestañas y filtros | 15 px | Negrita |
| Temas sugeridos y opciones de período | 15 px | Normal |
| Notas, fuente, fecha, etiquetas y siglas | 14 px | Normal |
| Botones pequeños de cada tarjeta | 13 px | Negrita |

## 20. Actualización 7: tarjetas

| Parte de la tarjeta | Tamaño | Peso |
|---|---|---|
| Etiqueta de tipo, etiqueta «nuevo», etiqueta de tema | 14 px | Normal |
| Título de la tarjeta | 16 px | Negrita |
| Resumen de la tarjeta | 16 px | Normal |
| Datos de la tarjeta y sus rótulos («Fuente:», «Fecha:») | 14 px | Normal |
| Botones de la tarjeta | 12 px | Negrita |

## 21. Actualización 8: opciones de período

«¿De qué fecha?» ofrece solo: **Último año** (por defecto), **Últimos 2 años**, **Últimos 5 años** y **Todo el tiempo**. Se eliminaron «Últimos 3 años» y «Últimos 4 años»; si alguien las tenía guardadas, la página vuelve al último año.

## 22. Actualización 9: temas sin siglas y más compactos

- Se quitaron las líneas «Siglas: …» de los grupos de temas (el significado de las siglas sigue en la Ayuda).
- Interlineado mínimo en el bloque de temas (1,15) y menos espacio entre temas y grupos.

## 23. Actualización 10: botón «Buscar hablando»

El botón «Buscar hablando» va entre la caja de búsqueda y el botón **Buscar**, y es más pequeño (12 px, peso normal, icono chico). En teléfono queda debajo de la caja, a la izquierda del botón Buscar.

## 24. Actualización 11: botón «Descargar»

- En cada tarjeta, cuando el documento se puede descargar gratis, aparece **Descargar PDF** entre «Visitar enlace» y «WhatsApp», en color propio: Solar Gold `#FDB515` con texto Space Black.
- Se ofrece descarga en más casos:
  - Papers de OpenAlex: el PDF abierto de cualquier ubicación (revista, repositorio, arXiv).
  - Papers de Crossref con licencia Creative Commons y enlace PDF.
  - Libros de dominio público en Internet Archive (vía Open Library).
  - Publicaciones de canales RSS que son directamente un PDF.
  - Documentos del catálogo con descarga libre.
- Las noticias de páginas web no tienen archivo descargable: solo «Visitar enlace» y «WhatsApp».

## 25. Actualización 12: botones de la tarjeta en fila

- Los tres botones (Visitar enlace · Descargar PDF · WhatsApp) van en fila horizontal, a la altura de las etiquetas («Paper Académico», «En inglés»…), a la derecha.
- Título, resumen y datos ocupan todo el ancho de la tarjeta.
- En pantallas angostas (hasta 760 px) los botones pasan debajo de las etiquetas, también en fila.

## 26. Actualización 13: pie de página más pequeño

El pie «Fuentes de prestigio que consultamos» se muestra al 80 % del tamaño anterior: texto 11,2 px (antes 14 px) y título 15,2 px (antes 19 px).

## 27. Actualización 14: tarjeta en dos columnas en todas las pantallas

Arriba de cada tarjeta hay siempre dos columnas: a la izquierda, las etiquetas sin relleno (Noticia, Publicado hoy, Tema…); a la derecha, los botones con color (Visitar enlace, Descargar PDF, WhatsApp). En pantallas anchas los botones van en fila; en las angostas (hasta 760 px), uno debajo del otro, siempre a la derecha.
