/**
 * Configuración de Tailwind CSS.
 * Paleta oficial de la NASA en versión minimalista (ver public/css/estilos.css).
 */
module.exports = {
  content: ['./public/**/*.html', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        fondo: '#FFFFFF',
        suave: '#F2F5F8',    // tinte muy claro de Sky Gray para cajas
        borde: '#9BB4C8',    // Sky Gray: solo bordes decorativos
        tinta: '#0E1A2B',    // Space Black: texto principal y menú
        gris: '#293241',     // Space Gray: texto secundario
        marca: '#0B3D91',    // NASA Blue: identidad, títulos, enlaces, Internacional
        acento: '#FC3D21',   // NASA Red: solo acento gráfico
        nacional: '#C91B1B', // Mission Red: sección Nacional (Perú)
        oro: '#FDB515',      // Solar Gold: novedades de la semana
        verde: '#0A7C3E',    // Earth Green: descargas, normas
        ciencia: '#1B81A8'   // Science Blue: franja de los papers
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'Verdana', '"Segoe UI"', 'Arial', 'sans-serif']
      }
    }
  }
};
