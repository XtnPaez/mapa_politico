/**
 * Mapa Político — map.js
 * Lógica principal: inicialización de Leaflet, carga de GeoJSON,
 * interactividad (hover/click) y consulta a la Wikibase REST API.
 *
 * Stack: Leaflet 1.9.4 + Bootstrap 5 Offcanvas + Wikidata API
 */

'use strict';

/* ══════════════════════════════════════════════════════
   CONFIGURACIÓN GLOBAL
══════════════════════════════════════════════════════ */
const CONFIG = {
  geojsonUrl: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
  wikidataApi: 'https://www.wikidata.org/w/rest.php/wikibase/v1',
  mapCenter: [20, 0],
  mapZoom: 2,
  mapMinZoom: 2,
  // QIDs de propiedades Wikidata que consultaremos
  props: {
    headOfState:    'P35',
    headOfGovt:     'P6',
    govtForm:       'P122',
    capital:        'P36',
    population:     'P1082',
    officialLangs:  'P37',
    isoCode:        'P297',
  }
};

/* ══════════════════════════════════════════════════════
   INICIALIZACIÓN DEL MAPA
══════════════════════════════════════════════════════ */
const map = L.map('map', {
  center: CONFIG.mapCenter,
  zoom: CONFIG.mapZoom,
  minZoom: CONFIG.mapMinZoom,
  zoomControl: true,
  attributionControl: true,
});

// Capa base: tiles de CartoDB (sin etiquetas intrusivas, buen contraste)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

/* ══════════════════════════════════════════════════════
   ESTADO DE LA APLICACIÓN
══════════════════════════════════════════════════════ */
let geojsonLayer   = null;
let activeLayer    = null;   // País actualmente seleccionado
let countryPanel   = null;   // Instancia Bootstrap Offcanvas

/* ══════════════════════════════════════════════════════
   ESTILOS DE CAPAS
══════════════════════════════════════════════════════ */
const style = {
  default: {
    fillColor:   '#4a6fa5',
    fillOpacity: 0.6,
    color:       '#2c3e50',
    weight:      0.5,
  },
  hover: {
    fillColor:   '#e8a838',
    fillOpacity: 0.85,
    color:       '#c0392b',
    weight:      1.5,
  },
  active: {
    fillColor:   '#e74c3c',
    fillOpacity: 0.8,
    color:       '#922b21',
    weight:      2,
  },
};

/* ══════════════════════════════════════════════════════
   CARGA DEL GEOJSON
══════════════════════════════════════════════════════ */
async function loadGeoJSON() {
  try {
    const res = await fetch(CONFIG.geojsonUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderGeoJSON(data);
  } catch (err) {
    console.error('[MapaPolitico] Error cargando GeoJSON:', err);
    showMapError('No se pudo cargar el mapa de países. Verifica tu conexión.');
  }
}

/* ══════════════════════════════════════════════════════
   RENDERIZADO DEL GEOJSON
══════════════════════════════════════════════════════ */
function renderGeoJSON(data) {
  geojsonLayer = L.geoJSON(data, {
    style: () => style.default,
    onEachFeature: (feature, layer) => {
      bindCountryEvents(feature, layer);
    },
  }).addTo(map);
}

/* ══════════════════════════════════════════════════════
   EVENTOS POR PAÍS
══════════════════════════════════════════════════════ */
function bindCountryEvents(feature, layer) {
  const props        = feature.properties;
  const countryName  = props.ADMIN   || props.name || 'País desconocido';
  const iso3         = props.ISO_A3  || '';
  const iso2         = props.ISO_A2  || '';

  // ── Tooltip en hover ──────────────────────────────
  layer.bindTooltip(buildTooltipHTML(countryName, iso2), {
    sticky:    true,
    direction: 'top',
    offset:    [0, -4],
    className: 'country-tooltip',
    opacity:   1,
  });

  // ── Mouse over ────────────────────────────────────
  layer.on('mouseover', function (e) {
    if (this !== activeLayer) {
      this.setStyle(style.hover);
    }
    this.openTooltip(e.latlng);
  });

  // ── Mouse out ─────────────────────────────────────
  layer.on('mouseout', function () {
    if (this !== activeLayer) {
      this.setStyle(style.default);
    }
    this.closeTooltip();
  });

  // ── Click: abrir panel con datos de Wikidata ──────
  layer.on('click', function () {
    // Resetear estilo del país previamente activo
    if (activeLayer && activeLayer !== this) {
      activeLayer.setStyle(style.default);
    }
    activeLayer = this;
    this.setStyle(style.active);

    openCountryPanel(countryName, iso2, iso3);
  });
}

/* ══════════════════════════════════════════════════════
   TOOLTIP HTML
══════════════════════════════════════════════════════ */
function buildTooltipHTML(name, iso2) {
  const flag = iso2 ? getFlagEmoji(iso2) : '🏳';
  return `<strong>${flag} ${name}</strong>`;
}

function getFlagEmoji(iso2) {
  // Convierte código ISO-2 en emoji de bandera
  return iso2
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

/* ══════════════════════════════════════════════════════
   OFFCANVAS: APERTURA Y CARGA DE DATOS
══════════════════════════════════════════════════════ */
function openCountryPanel(name, iso2, iso3) {
  const flag = iso2 ? getFlagEmoji(iso2) : '🏳';

  // Actualizar título del panel
  document.getElementById('panel-flag').textContent        = flag;
  document.getElementById('panel-country-name').textContent = name;

  // Mostrar spinner, ocultar el resto
  setPanelState('loading');

  // Abrir Offcanvas de Bootstrap
  if (!countryPanel) {
    countryPanel = new bootstrap.Offcanvas(
      document.getElementById('countryPanel'),
      { scroll: true, backdrop: false }
    );
  }
  countryPanel.show();

  // Consultar Wikidata por nombre de país
  fetchCountryData(name, iso2);
}

/* ══════════════════════════════════════════════════════
   WIKIBASE REST API — Búsqueda + Detalle
══════════════════════════════════════════════════════ */

/**
 * Paso 1: Buscar el QID del país en Wikidata por nombre.
 */
async function fetchCountryData(name, iso2) {
  try {
    // Búsqueda por etiqueta en español y luego inglés
    const searchUrl = `${CONFIG.wikidataApi}/items?search=${encodeURIComponent(name)}&language=en&limit=1`;
    const res = await fetch(searchUrl);

    if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
    const results = await res.json();

    if (!results || results.length === 0) {
      throw new Error('No se encontró el país en Wikidata.');
    }

    const qid = results[0].id;
    await fetchItemDetails(qid, name, iso2);

  } catch (err) {
    console.warn('[MapaPolitico] Wikidata search fallback por ISO:', err.message);
    // Fallback: mostrar datos mínimos del GeoJSON
    renderMinimalPanel(name, iso2);
  }
}

/**
 * Paso 2: Obtener el ítem completo por QID.
 */
async function fetchItemDetails(qid, name, iso2) {
  try {
    const res = await fetch(`${CONFIG.wikidataApi}/entities/items/${qid}`);
    if (!res.ok) throw new Error(`Item HTTP ${res.status}`);
    const item = await res.json();

    await renderPanel(item, qid, name, iso2);

  } catch (err) {
    console.error('[MapaPolitico] Error obteniendo ítem:', err);
    renderMinimalPanel(name, iso2);
  }
}

/* ══════════════════════════════════════════════════════
   RENDERIZADO DEL PANEL
══════════════════════════════════════════════════════ */
async function renderPanel(item, qid, name, iso2) {
  const statements = item.statements || {};
  const labels     = item.labels     || {};

  // Extraer etiqueta oficial
  const officialName = labels.es?.value || labels.en?.value || name;

  // Resolver valores de propiedades relevantes
  const rows = [
    { label: 'Nombre oficial', value: officialName },
    { label: 'Forma de gobierno', value: await resolveProperty(statements, CONFIG.props.govtForm) },
    { label: 'Jefe de Estado',    value: await resolveProperty(statements, CONFIG.props.headOfState) },
    { label: 'Jefe de Gobierno',  value: await resolveProperty(statements, CONFIG.props.headOfGovt) },
    { label: 'Capital',           value: await resolveProperty(statements, CONFIG.props.capital) },
    { label: 'Idioma oficial',    value: await resolveProperty(statements, CONFIG.props.officialLangs) },
    { label: 'Población',         value: resolvePopulation(statements) },
    { label: 'Código ISO',        value: iso2 || '—' },
  ];

  // Construir lista HTML
  const list = document.getElementById('panel-data-list');
  list.innerHTML = rows
    .filter(r => r.value && r.value !== '—')
    .map(r => `
      <li class="list-group-item">
        <span class="label">${r.label}</span>
        <span class="value">${r.value}</span>
      </li>
    `).join('');

  // Actualizar link a Wikidata
  const link = document.getElementById('panel-wikidata-link');
  link.href = `https://www.wikidata.org/wiki/${qid}`;
  link.textContent = qid;

  setPanelState('content');
}

/**
 * Fallback: panel con datos mínimos del GeoJSON.
 */
function renderMinimalPanel(name, iso2) {
  const flag = iso2 ? getFlagEmoji(iso2) : '';
  const list = document.getElementById('panel-data-list');
  list.innerHTML = `
    <li class="list-group-item">
      <span class="label">País</span>
      <span class="value">${flag} ${name}</span>
    </li>
    <li class="list-group-item">
      <span class="label">Código ISO</span>
      <span class="value">${iso2 || '—'}</span>
    </li>
  `;

  document.getElementById('panel-wikidata-link').href =
    `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(name)}`;

  setPanelState('content');
}

/* ══════════════════════════════════════════════════════
   HELPERS: RESOLUCIÓN DE PROPIEDADES WIKIDATA
══════════════════════════════════════════════════════ */

/**
 * Resuelve el primer valor de una propiedad.
 * Si el valor es un QID (entity-id), hace una segunda consulta para obtener la etiqueta.
 */
async function resolveProperty(statements, propId) {
  const prop = statements[propId];
  if (!prop || prop.length === 0) return '—';

  const firstStatement = prop[0];
  const datavalue = firstStatement?.value;

  if (!datavalue) return '—';

  // Valor de tipo "value" directo (string, monolingualtext, etc.)
  if (typeof datavalue === 'string') return datavalue;
  if (datavalue.content && typeof datavalue.content === 'string') return datavalue.content;

  // Valor de tipo entity-id (QID) → resolver etiqueta
  const qid = datavalue?.content?.id || datavalue?.id;
  if (qid && qid.startsWith('Q')) {
    return await fetchLabel(qid);
  }

  return '—';
}

/**
 * Obtiene la etiqueta en español o inglés de un QID.
 */
async function fetchLabel(qid) {
  try {
    const res = await fetch(`${CONFIG.wikidataApi}/entities/items/${qid}/labels`);
    if (!res.ok) return qid;
    const labels = await res.json();
    return labels.es?.value || labels.en?.value || qid;
  } catch {
    return qid;
  }
}

/**
 * Resuelve la población con formato localizado.
 */
function resolvePopulation(statements) {
  const prop = statements[CONFIG.props.population];
  if (!prop || prop.length === 0) return '—';

  // Tomar el valor más reciente (último en el array suele ser el más actualizado)
  const sorted = [...prop].sort((a, b) => {
    const tA = a?.qualifiers?.P585?.[0]?.value?.content?.time || '';
    const tB = b?.qualifiers?.P585?.[0]?.value?.content?.time || '';
    return tB.localeCompare(tA);
  });

  const val = sorted[0]?.value?.content;
  if (typeof val === 'number') {
    return val.toLocaleString('es-AR');
  }
  return '—';
}

/* ══════════════════════════════════════════════════════
   CONTROL DE ESTADOS DEL PANEL
══════════════════════════════════════════════════════ */
function setPanelState(state) {
  document.getElementById('panel-loading').classList.toggle('d-none', state !== 'loading');
  document.getElementById('panel-content').classList.toggle('d-none', state !== 'content');
  document.getElementById('panel-error').classList.toggle('d-none',   state !== 'error');
}

/* ══════════════════════════════════════════════════════
   ERROR EN EL MAPA
══════════════════════════════════════════════════════ */
function showMapError(msg) {
  const el = document.createElement('div');
  el.className = 'alert alert-danger position-absolute top-50 start-50 translate-middle';
  el.style.zIndex = 9999;
  el.textContent = msg;
  document.getElementById('map').appendChild(el);
}

/* ══════════════════════════════════════════════════════
   ARRANQUE
══════════════════════════════════════════════════════ */
loadGeoJSON();
