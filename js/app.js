/**
 * app.js — Punto de entrada principal del Mapa Político
 *
 * Responsabilidades:
 *  1. Cargar los componentes HTML (navbar, footer) de forma asíncrona
 *  2. Inicializar el mapa Leaflet
 *  3. Inicializar tooltips y comportamientos globales de Bootstrap
 */

import { initMap } from './map.js';

/**
 * Carga un fragmento HTML desde /components/ e inyecta en un placeholder
 * Equivalente funcional al include() de PHP — sin servidor
 *
 * @param {string} placeholderId — id del elemento destino
 * @param {string} componentPath — ruta relativa al archivo HTML
 */
async function loadComponent(placeholderId, componentPath) {
  try {
    const res  = await fetch(componentPath);
    const html = await res.text();
    document.getElementById(placeholderId).innerHTML = html;
  } catch (err) {
    console.error(`Error cargando componente "${componentPath}":`, err);
  }
}

/**
 * Bootstrap de la aplicación
 */
async function main() {
  // 1 — Cargar navbar y footer (módulos independientes como en arquitectura PHP)
  await Promise.all([
    loadComponent('navbar-placeholder', 'components/navbar.html'),
    loadComponent('footer-placeholder', 'components/footer.html'),
  ]);

  // 2 — Inicializar el mapa
  initMap('map');

  // 3 — Comportamientos globales de Bootstrap post-carga de componentes
  initGlobalUI();
}

function initGlobalUI() {
  // Inicializar todos los tooltips de Bootstrap (si los hay en navbar/footer)
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el);
  });

  // Link "Acerca de" en navbar — modal o comportamiento futuro
  const aboutLink = document.getElementById('navAbout');
  if (aboutLink) {
    aboutLink.addEventListener('click', e => {
      e.preventDefault();
      alert(
        'Mapa Político Mundial\n\n' +
        'Visualizador cartográfico interactivo que muestra formas de gobierno\n' +
        'y jefes de estado consultados en tiempo real desde Wikidata.\n\n' +
        'Stack: Leaflet · Bootstrap 5 · Wikidata REST API\n' +
        'Repo: github.com/XtnPaez/mapa_politico'
      );
    });
  }
}

// ── Iniciar ────────────────────────────────────────────────
main();
