# Construcción Global

Buscador muy fácil de usar de **noticias, estudios académicos (papers) y libros** sobre el ciclo de
vida de los proyectos de construcción: **Ingeniería, Procura, Construcción, Puesta en marcha y
Operación** (edificación, infraestructura, energía, minería, industria y saneamiento).
Solo muestra **fuentes de gran prestigio**, en dos secciones: **Nacional (Perú)** e **Internacional**.

Está pensado para personas mayores y para quien no se lleva bien con la tecnología: letra grande,
botones grandes, colores con buen contraste y mensajes en lenguaje sencillo.

Es la aplicación hermana de [Diplomacia Global](https://github.com/ehchavezm-hub/03-Diplomacia):
misma arquitectura y forma de uso, con contenido del sector construcción y paleta de la NASA.

---

## 👉 Enlace para compartir

**https://ehchavezm-hub.github.io/04-newsconstruccion/**

Quien reciba el enlace no tiene que instalar ni configurar nada: lo abre en el navegador del
teléfono o la computadora y listo. (También funciona `…/04-newsconstruccion/construccion/`, que
lleva a la misma página.)

### Se actualiza sola

GitHub Actions (`.github/workflows/publicar.yml`) vuelve a publicar la web:

- cada vez que se guarda un cambio en la rama `main`,
- y **cada 4 horas**, para traer las novedades de la última semana.

En cada actualización se generan tres archivos en `public/datos/`:

| Archivo | Qué contiene |
|---|---|
| `ultima-semana.json` | Noticias y papers de los últimos 7 días |
| `noticias-archivo.json` | Todas las noticias de los últimos 90 días (se van sumando) |
| `papers-recientes.json` | Papers de los últimos 12 meses de cada uno de los 22 temas |
| `libros-recientes.json` | Libros de los últimos 12 meses de cada tema, de editoriales de prestigio |

### Configuración única (solo la primera vez)

En GitHub, dentro de `ehchavezm-hub/04-newsconstruccion`:
**Settings → Pages → Source: GitHub Actions**. No hace falta nada más.

---

## Qué se muestra: solo lo vigente y relacionado con los temas

En las cuatro pestañas (Buscar, Últimas Noticias, Papers Académicos y Libros Destacados) cada
resultado debe cumplir dos condiciones:

1. **Estar vigente a la fecha:**
   - noticias de los últimos 7 días (pestaña Últimas Noticias) o 3 meses (Buscar);
   - papers y libros publicados en los **últimos 12 meses** (para Crossref se usa la fecha más
     temprana, impresa o en línea: un artículo publicado en línea en 2024 no aparece aunque salga
     impreso ahora);
   - normas solo si están en vigor (Ley 32069 y Norma G.050). Los libros y papers clásicos del
     catálogo ya no se muestran.
2. **Relacionarse, directa o indirectamente, con los 22 temas sugeridos:** directa si menciona el
   tema (por ejemplo «Last Planner»); indirecta si trata de algo ligado a él (una obra que «entra
   en operación» se relaciona con la Puesta en marcha). Cada tarjeta muestra su **«Tema: …»**.
   Los términos están en `public/js/temas.js` (`terminos` y `RELACIONADOS`).

Los plazos se cambian en `VIGENCIA_DIAS` de `public/js/motor-busqueda.js`.

## Cómo busca

1. **Escriba un tema** (por ejemplo, «Puerto de Chancay», «BIM» o «puesta en marcha») y pulse
   **Buscar**, o pulse **Buscar hablando** y dígalo en voz alta.
2. Enseguida aparecen los resultados guardados (novedades, archivo de 90 días, libros y catálogo).
3. Unos segundos después se suman los que llegan de internet:
   - **GDELT**: noticias de los últimos 3 meses, solo en los sitios de prestigio de la lista.
   - **Crossref**: artículos de **todas las revistas y congresos** de las editoriales académicas
     de prestigio (Elsevier, ASCE, Taylor & Francis, Emerald, SAGE, Wiley, Springer, ICE
     Publishing, IEEE, ACM, Cambridge, Oxford, IGLC e ISARC), de los últimos 12 meses.
   - **Open Library**: libros de editoriales de prestigio de los últimos 12 meses.
4. Todo se muestra **de lo más reciente a lo más antiguo** («de hoy hacia atrás»), en dos
   secciones: **Nacional (Perú)** (en rojo) e **Internacional** (en azul), de 10 en 10.

Detalles del buscador:

- No importan las mayúsculas ni las tildes, y entiende español e inglés.
- Entiende sinónimos del sector: **EPC = IPC = Ingeniería, Procura y Construcción**;
  **puesta en marcha = commissioning = comisionamiento = arranque**; **O&M = operación y
  mantenimiento**; **BIM = Building Information Modeling**; **APP = PPP = asociación
  público-privada**; licitación = tender; cronograma = schedule; valor ganado = earned value;
  y otros (ver `public/js/motor-busqueda.js`).
- Si escribe varias palabras, deben aparecer todas. Si pulsa un tema sugerido, basta con
  cualquiera de sus términos.
- El botón amarillo **Ver novedades de la última semana** muestra lo publicado en los últimos
  7 días (si antes escribe un tema, solo lo de ese tema).
- Al final de cada búsqueda hay un enlace para seguir buscando en **Google Noticias**, limitado a
  medios de prestigio.

### Temas sugeridos (5 grupos, 22 temas)

1. **Planificación:** AWP (Advanced Work Packaging) · Last Planner System (LPS) · PPM (Project
   Production Management) · Constructabilidad e Ingeniería de Valor · Programación Rítmica y
   Líneas de Balance.
2. **Métodos Constructivos y Sistemas de Soporte:** Métodos Constructivos · Sistemas de
   Encofrados · Andamios · Procesos Constructivos.
3. **Tecnologías y Metodologías Integradas:** VDC (Virtual Design and Construction) · BIM ·
   Gestión de la Información para la construcción · IA y Automatización de Procesos ·
   Construcción e Industrialización Digital.
4. **Ciclo de Vida y Fases del Proyecto** (en orden): Ingeniería y Diseño (FEED) · Procura y
   Contratos · Construcción y Montaje · Puesta en Marcha (Commissioning) · Operación y
   Mantenimiento (O&M).
5. **Marcos de Gestión de Proyectos y Gobernanza:** PMBOK y Estándares del PMI · PRINCE2
   (Gobernanza y Control) · IPMA (Modelo de Competencias ICB4).

Glosario en lenguaje sencillo:

- **Ingeniería**: se estudia la idea y se diseña la obra con planos y cálculos.
- **Procura**: se compran los equipos y materiales y se contratan los servicios.
- **Construcción**: se levanta la obra en el terreno.
- **Puesta en marcha**: se prueban los equipos y sistemas hasta que funcionan bien y se entregan.
- **Operación**: la obra se usa y se mantiene durante toda su vida útil (O&M).
- **IPC / EPC**: Ingeniería, Procura y Construcción (en inglés, *Engineering, Procurement and
  Construction*). **BIM**: Modelado de Información de la Construcción. **APP**: Asociación
  Público-Privada. **FEED**: ingeniería básica extendida, antes de construir.

Los temas se cambian en `public/js/temas.js` (etiqueta visible y lista de términos).

---

## Fuentes de prestigio

Todas están en un solo archivo: **`public/js/fuentes-prestigio.js`**.

- **Nacionales (Perú):** El Comercio — Economía, Gestión — Economía y Perú, La República —
  Economía, RPP — Economía, Andina, Semana Económica, El Peruano.
- **Gremios y medios especializados peruanos:** CAPECO, Colegio de Ingenieros del Perú, Rumbo
  Minero, Energiminas.
- **Entidades públicas:** ProInversión, MTC, Ministerio de Vivienda, Construcción y Saneamiento,
  OECE, Autoridad Nacional de Infraestructura (ANIN), Contraloría.
- **Medios especializados internacionales:** Engineering News-Record (ENR), Construction Dive,
  Global Construction Review, New Civil Engineer, Construction News, BNamericas, Mining.com,
  Power Engineering.
- **Organismos multilaterales:** Banco Mundial, BID, CAF, Global Infrastructure Hub, OCDE.
- **Agencias:** Reuters, AP, EFE, Europa Press, Bloomberg.
- **Consultoras:** McKinsey, Deloitte, PwC, BCG, KPMG, EY.
- **Institutos, asociaciones y empresas (academia e industria):** Construction Industry Institute
  (CII), Lean Construction Institute, Project Production Institute, PMI, IPMA, PeopleCert
  (PRINCE2), buildingSMART, ASCE, ICE, RICS, AACE, Dodge Construction Network, Arup, Autodesk,
  Foro Económico Mundial; en el Perú, SENCICO y Plan BIM Perú.
- **Editoriales y congresos académicos (Crossref, por prefijo de DOI):** Elsevier, ASCE, Taylor &
  Francis, Emerald, SAGE, Wiley, Springer, ICE Publishing, Canadian Science Publishing, IEEE, ACM,
  Cambridge, Oxford, IGLC (Lean Construction) e ISARC (robótica en construcción).
- **Medios generales:** BBC Mundo, El País — Economía, DW Español, The Guardian, Financial
  Times, The Economist.
- **Revistas académicas (15, por ISSN en Crossref):** Journal of Construction Engineering and
  Management, Journal of Management in Engineering, Journal of Legal Affairs and Dispute
  Resolution in Engineering and Construction, Journal of Computing in Civil Engineering,
  International Journal of Project Management, Project Management Journal, Construction
  Management and Economics, Engineering, Construction and Architectural Management, Automation
  in Construction, Journal of Building Engineering, Construction and Building Materials,
  Tunnelling and Underground Space Technology, Safety Science, Reliability Engineering & System
  Safety y Journal of Cleaner Production (de esta, solo los artículos sobre construcción).
- **Editoriales de libros:** Wiley, Routledge, Taylor & Francis, CRC Press, Elsevier, Springer,
  McGraw-Hill, Pearson, Cambridge, Oxford, MIT Press, ASCE Press, ICE Publishing, RIBA, PMI,
  AACE, FIDIC, Industrial Press, Reverté, Fondo Editorial PUCP, Fondo Editorial UNI, entre otras.

Los **medios generales** (diarios, agencias, consultoras) solo aportan noticias que mencionan el
sector (construcción, obra, infraestructura, licitación, concesión, puerto, carretera, EPC, BIM,
APP…). Las siglas cuentan solo en MAYÚSCULAS, para que «app» (del teléfono) no se confunda con
«APP» (Asociación Público-Privada).

### Canales RSS sustituidos por Google Noticias

Cada canal se comprobó con `herramientas/comprobar-fuentes.js` (flujo «Comprobar fuentes» en la
pestaña Actions, 27 de septiembre de 2026). Cuando un medio no tiene canal propio, no responde o
bloquea a los lectores automáticos, se lee a través de **Google Noticias limitado a ese sitio**
(`site:…`), con el mismo nombre visible.

**Canal RSS propio (comprobado ✔):** El Comercio — Economía, Gestión — Economía y Perú,
La República — Economía, RPP — Economía, Rumbo Minero, Energiminas, Engineering News-Record
(`enr.com/rss/articles`), Construction Dive, Global Construction Review, New Civil Engineer,
Construction News, Mining.com, BBC Mundo, El País — Economía, DW Español y The Guardian.

**Sustituidos por Google Noticias:**

| Medio | Motivo |
|---|---|
| Power Engineering | Su canal RSS bloquea lectores automáticos (HTTP 403) |
| Semana Económica | Su canal RSS bloquea lectores automáticos (HTTP 403) |
| Andina — Economía | Sus canales RSS no separan la sección de economía; Google Noticias trae más notas del sector |
| CAPECO, Colegio de Ingenieros del Perú | No publican canal RSS |
| ProInversión, MTC, Ministerio de Vivienda, OECE, ANIN, Contraloría | gob.pe no publica canales RSS. Google Noticias no admite rutas en `site:` (`site:gob.pe/mtc` no trae nada), por eso se busca en `site:gob.pe` con el nombre de la entidad |
| El Peruano | No publica canal RSS general |
| Banco Mundial, BID, CAF, Global Infrastructure Hub, OCDE | Sin canal RSS de noticias utilizable |
| Reuters, AP, EFE, Europa Press, Bloomberg | Sin canal RSS público |
| McKinsey, Deloitte, PwC, Financial Times, The Economist | Sin canal RSS público o de pago |

Notas de la comprobación:

- **Global Infrastructure Hub** no trajo noticias (el organismo redujo su actividad); se mantiene
  en la lista por si vuelve a publicar.
- Los 15 **ISSN** de las revistas se confirmaron en Crossref.
- **Catálogo:** la página del PMI, el DOI de dos revistas de pago (Taylor & Francis y SAGE), el
  enlace de El Peruano de la Ley 32069 y un PDF del Ministerio de Vivienda no respondían a la
  comprobación. Se reemplazaron por la ficha de Open Library (PMBOK), la versión libre del autor
  en arXiv (los dos artículos de Flyvbjerg, que ahora también se pueden descargar), la página
  oficial del OECE (Ley 32069) y el PDF oficial de la Norma G.050 publicado en gob.pe.

## Colores y tamaños

**Paleta oficial de la NASA en versión minimalista** (fondo blanco y pocos colores), con contraste
verificado según WCAG 2.1 AA:

| Uso | Color NASA | Contraste |
|---|---|---|
| Fondo | Blanco `#FFFFFF`; cajas en un tinte muy claro de Sky Gray `#F2F5F8` | — |
| Texto principal y menú | Space Black `#0E1A2B` | 17,5 : 1 |
| Texto secundario | Space Gray `#293241` | 12,9 : 1 |
| Cabecera, títulos, botón Buscar, enlaces, sección Internacional | NASA Blue `#0B3D91` | 10,0 : 1 |
| Sección Nacional (Perú) | Mission Red `#C91B1B` | 5,7 : 1 |
| Acento (pestaña activa, franja de noticias) | NASA Red `#FC3D21` (solo gráfico: 3,6 : 1 no alcanza para texto) | — |
| Botón de novedades | Solar Gold `#FDB515` con texto Space Black | 9,8 : 1 |
| Descargas, normas, «Acceso libre» | Earth Green `#0A7C3E` | 5,3 : 1 |
| Franja de los papers | Science Blue `#1B81A8` (solo gráfico) | — |
| Bordes | Sky Gray `#9BB4C8` (solo decorativo) | — |
| WhatsApp | `#075E54` (se mantiene porque la gente lo reconoce) | 7,7 : 1 |

**Tipografía:** Atkinson Hyperlegible en toda la página, títulos incluidos (diseñada por el
Braille Institute para personas con baja visión). Tamaños: nombre 25 px, títulos 23 px y 19 px,
botones 15 px, texto 16 px, notas 14 px. La fuente solo tiene pesos normal y negrita.
Los botones **A−** y **A+** agrandan o achican todo (90 % a 150 %) y la página lo recuerda.

## Probar en su computadora (paso a paso)

### Opción 1: sin instalar nada

Abra la carpeta `public` y haga **doble clic en `index.html`**. Funciona con el catálogo local
(sin noticias del día).

### Opción 2: con el servidor (todas las funciones)

1. Instale **Node.js LTS** desde https://nodejs.org (siguiente, siguiente, finalizar).
2. Abra una terminal en la carpeta del proyecto:
   - **Windows:** abra la carpeta en el Explorador, escriba `cmd` en la barra de dirección y
     pulse Enter.
   - **Mac:** clic derecho sobre la carpeta → *Servicios* → *Nuevo terminal en la carpeta*.
   - **Linux:** clic derecho dentro de la carpeta → *Abrir en una terminal*.
3. Escriba `npm start` y pulse Enter. (No necesita `npm install`: el servidor no usa paquetes.)
4. Abra el navegador en **http://localhost:3000**
5. Para apagarlo, vuelva a la terminal y pulse **Ctrl + C**.

¿El puerto 3000 está ocupado? Use otro:

- Mac/Linux: `PUERTO=8080 npm start`
- Windows: `set PUERTO=8080 && npm start`

Sin conexión a internet: `npm run sin-internet` (solo catálogo local).

### Biblioteca personal (solo con el servidor)

Copie sus libros, normas o especificaciones técnicas en formato **.md** o **.txt** en la carpeta
`biblioteca/`. Al buscar, verá los **párrafos** donde aparece el tema, con el capítulo y la
ubicación aproximada. Esos archivos **nunca se suben a GitHub** ni se pueden descargar desde la
aplicación (ver `biblioteca/LEEME.md`).

---

## Estructura de archivos

```
.github/workflows/publicar.yml          Publica public/ en GitHub Pages y actualiza datos cada 4 h
.github/workflows/comprobar-fuentes.yml Comprueba canales RSS, ISSN y enlaces del catálogo
herramientas/actualizar-semana.js       Genera los JSON de public/datos/
herramientas/comprobar-fuentes.js       Informe ✔/✘ de cada fuente y enlace
servidor.js, servidor/                  Servidor local opcional (sin dependencias)
pruebas/pruebas.test.js                 Pruebas automáticas (node:test)
public/index.html                       La página (4 pestañas)
public/js/fuentes-prestigio.js          Lista única de fuentes
public/js/temas.js                      Temas sugeridos
public/js/motor-busqueda.js             Búsqueda, sinónimos y orden por fecha
public/js/servicio-datos.js             De dónde salen los datos (web, servidor o archivo)
public/js/interfaz.js                   Tarjetas, secciones y avisos
public/datos/catalogo.js                Catálogo local: 13 libros, 7 papers, 3 normas, 6 ejemplos
```

## Cómo conectar nuevas fuentes

- **Un medio con RSS:** copie una línea en `medios` de `public/js/fuentes-prestigio.js` con su
  `url`. Si no tiene RSS, use `googleNoticias: 'site:dominio.com'`.
- **Un sitio para la búsqueda de noticias (GDELT):** añádalo a `dominios`.
- **Una revista:** añádala a `revistas` con su ISSN (compruébelo en Crossref).
- **Una editorial:** añádala a `editoriales` (en minúsculas y sin tildes).
- **Otra base de datos (servidor):** cree un archivo en `servidor/fuentes/` con
  `nombre`, `tipos` y `buscar(consulta)`, y agréguelo en `servidor/buscador.js`.

Después ejecute `npm test` y lance el flujo «Comprobar fuentes».

## Variables de entorno (servidor)

| Variable | Qué hace | Valor por defecto |
|---|---|---|
| `PUERTO` | Puerto del servidor | `3000` |
| `FUENTES_EN_VIVO` | `no` para usar solo el catálogo | `si` |
| `TIEMPO_ESPERA_SEG` | Espera máxima por fuente | `5` |
| `CACHE_MINUTOS` | Minutos que se guardan las respuestas | `15` |
| `CORREO_CROSSREF` | Correo de contacto para Crossref (recomendado) | vacío |
| `CARPETA_BIBLIOTECA` | Carpeta de la biblioteca personal | `biblioteca/` |
| `ARCHIVO_PUBLICADO` | Archivo de 90 días publicado (para `npm run actualizar`) | la web publicada |

## Accesibilidad

- Contraste AA en todo el texto; controles de al menos 44 px de alto.
- Iconos siempre acompañados de texto; sin emojis de banderas.
- Enlace «Saltar al contenido principal», anuncios para lectores de pantalla, pestaña activa
  marcada, filtros como botones de opción reales, foco visible de 4 px.
- Respeta «reducir movimiento» y el modo de alto contraste de Windows.
- Sin desplazamiento horizontal en teléfonos de 390 px.
- Las siglas técnicas se explican (en los temas y en la Ayuda).

## Comandos de desarrollo

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta las pruebas automáticas (sin internet) |
| `npm run css` | Vuelve a generar `public/css/tailwind.css` (requiere `npm install` una vez) |
| `npm run actualizar` | Genera los datos de `public/datos/` (lo hace GitHub Actions) |
| `node herramientas/comprobar-fuentes.js` | Comprueba fuentes y enlaces |

## Limitaciones conocidas

- GDELT permite una consulta cada 5 segundos y tarda unos 14 s: por eso primero se muestra lo
  guardado y después lo nuevo.
- Google Books sin clave suele responder «demasiadas consultas»: se usa Open Library.
- Algunos medios (ENR, BNamericas) son de pago: se muestra el titular y el enlace.
- Algunas entidades y gremios pueden no publicar nada en una semana: es normal.
- Tras una actualización grande puede hacer falta pulsar **Ctrl + F5** una sola vez.
