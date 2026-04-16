/**
 * map.js — Mapa Leaflet con colorización por forma de gobierno
 */

import { findCountryQID, getCountryData, GOV_TYPES, GOV_PALETTE, getGovType } from './wikidata.js';
import { renderOffcanvas } from './ui.js';

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

// Color por defecto (sin datos)
const COLOR_UNKNOWN  = '#94a3b8';
const COLOR_HOVER    = '#f59e0b';
const COLOR_SELECTED = '#ef4444';

let mapInstance   = null;
let geojsonLayer  = null;
let selectedLayer = null;

// QID → color (se llena al cargar el GeoJSON en paralelo)
const countryColors = {};

// ── Inicialización ────────────────────────────────────────

export function initMap(elementId) {
  mapInstance = L.map(elementId, {
    center: [20, 0], zoom: 2, minZoom: 2, maxZoom: 8,
    zoomControl: true, worldCopyJump: true,
    attributionControl: true,
  });

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19,
    }
  ).addTo(mapInstance);

  buildLegend();
  loadGeoJSON();
  return mapInstance;
}

// ── GeoJSON ────────────────────────────────────────────────

async function loadGeoJSON() {
  try {
    const res  = await fetch(GEOJSON_URL);
    const data = await res.json();

    // Primera pasada: dibujar todo con color neutro
    geojsonLayer = L.geoJSON(data, {
      style:         () => styleFor(null),
      onEachFeature: bindFeatureEvents,
    }).addTo(mapInstance);

    // Segunda pasada: colorizar en background según forma de gobierno
    colorizeAll(data.features);

  } catch (err) {
    console.error('Error cargando GeoJSON:', err);
  }
}

/**
 * Coloriza todos los países en lotes para no bloquear la UI
 */
async function colorizeAll(features) {
  const BATCH = 10;
  for (let i = 0; i < features.length; i += BATCH) {
    const batch = features.slice(i, i + BATCH);
    await Promise.all(batch.map(f => colorizeFeature(f)));
    // Pequeña pausa entre lotes para no saturar la API
    await sleep(150);
  }
}

async function colorizeFeature(feature) {
  const props = feature.properties || {};
  const name  = props.ADMIN || props.name || '';
  const rawA2 = props.ISO_A2 || '';
  const rawA3 = props.ISO_A3 || '';
  const isoA2 = (rawA2 && rawA2 !== '-1' && rawA2.length === 2) ? rawA2.toUpperCase() : '';
  const isoA3 = (rawA3 && rawA3 !== '-99' && rawA3.length === 3) ? rawA3.toUpperCase() : '';

  try {
    const qid   = await findCountryQID(isoA2 || null, isoA3 || null, name);
    if (!qid) return;

    const color = await getCountryColor(qid);
    countryColors[qid] = color;

    // Actualizar la capa en el mapa
    geojsonLayer.eachLayer(layer => {
      const lProps = layer.feature?.properties || {};
      const lName  = lProps.ADMIN || lProps.name || '';
      if (lName === name && layer !== selectedLayer) {
        layer.setStyle({ fillColor: color, fillOpacity: 0.65 });
      }
    });
  } catch { /* país sin datos — queda color neutro */ }
}

// Cache de color por QID para no repetir llamadas
const _colorCache = {};

async function getCountryColor(qid) {
  if (_colorCache[qid]) return _colorCache[qid];
  const color = await fetchGovColor(qid);
  _colorCache[qid] = color;
  return color;
}

// ── Estilos Leaflet ────────────────────────────────────────

function styleFor(fillColor) {
  return {
    fillColor:   fillColor || COLOR_UNKNOWN,
    fillOpacity: fillColor ? 0.65 : 0.35,
    color:       '#fff',
    weight:      0.6,
    opacity:     0.8,
  };
}

// ── Eventos ────────────────────────────────────────────────

function bindFeatureEvents(feature, layer) {
  const props = feature.properties || {};
  const name  = props.ADMIN || props.name || props.NAME || 'País';
  const rawA2 = props.ISO_A2 || '';
  const rawA3 = props.ISO_A3 || '';
  const isoA2 = (rawA2 && rawA2 !== '-1' && rawA2.length === 2) ? rawA2.toUpperCase() : '';
  const isoA3 = (rawA3 && rawA3 !== '-99' && rawA3.length === 3) ? rawA3.toUpperCase() : '';

  layer.bindTooltip(buildTooltip(name, isoA2), {
    sticky: true, direction: 'top', offset: [0, -4],
    className: 'mp-tooltip', opacity: 1,
  });

  let baseFill = COLOR_UNKNOWN;

  layer.on({
    mouseover() {
      if (layer !== selectedLayer) {
        baseFill = layer.options.fillColor || COLOR_UNKNOWN;
        layer.setStyle({ fillColor: COLOR_HOVER, fillOpacity: 0.85, weight: 1.5 });
        layer.bringToFront();
      }
    },
    mouseout() {
      if (layer !== selectedLayer) {
        layer.setStyle({ fillColor: baseFill, fillOpacity: baseFill === COLOR_UNKNOWN ? 0.35 : 0.65, weight: 0.6 });
      }
    },
    click() {
      if (selectedLayer && selectedLayer !== layer) {
        const prevFill = selectedLayer.options.fillColor || COLOR_UNKNOWN;
        selectedLayer.setStyle({ fillColor: prevFill, fillOpacity: prevFill === COLOR_UNKNOWN ? 0.35 : 0.65, weight: 0.6 });
      }
      selectedLayer = layer;
      baseFill = layer.options.fillColor || COLOR_UNKNOWN;
      layer.setStyle({ fillColor: COLOR_SELECTED, fillOpacity: 0.9, weight: 2 });
      layer.bringToFront();
      openPanel(name, isoA2, isoA3);
    },
  });
}

// ── Tooltip ────────────────────────────────────────────────

function buildTooltip(name, isoA2) {
  return `
    <div class="tt-name"><span class="tt-flag">${isoToFlag(isoA2)}</span>${name}</div>
    <div class="tt-gov">Clic para más información</div>
  `;
}

// ── Panel lateral ──────────────────────────────────────────

async function openPanel(name, isoA2, isoA3) {
  const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(
    document.getElementById('countryOffcanvas')
  );

  document.getElementById('countryOffcanvasLabel').textContent = name;
  document.getElementById('countryFlag').textContent           = isoToFlag(isoA2);
  document.getElementById('offcanvasLoader').classList.remove('d-none');
  document.getElementById('offcanvasContent').classList.add('d-none');
  document.getElementById('offcanvasContent').innerHTML = '';
  offcanvas.show();

  try {
    const qid = await findCountryQID(isoA2 || null, isoA3 || null, name);
    if (!qid) throw new Error(`Sin QID: ${name}`);
    const data = await getCountryData(qid);
    renderOffcanvas(data);
  } catch (err) {
    console.warn('Error cargando datos:', err);
    showPanelError(name, isoA2 || isoA3);
  }
}

function showPanelError(name, iso) {
  document.getElementById('offcanvasLoader').classList.add('d-none');
  const el = document.getElementById('offcanvasContent');
  el.classList.remove('d-none');
  el.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-exclamation-triangle text-warning fs-2"></i>
      <p class="mt-3 small text-muted">Sin datos para <strong>${name}</strong>${iso ? ` (${iso})` : ''}.</p>
    </div>`;
}

// ── Leyenda ────────────────────────────────────────────────

function buildLegend() {
  const mapEl = document.getElementById('map');
  const legend = document.createElement('div');
  legend.id = 'map-legend';

  const items = Object.entries(GOV_PALETTE)
    .map(([key, { color, label }]) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${color}"></span>
        ${label}
      </div>
    `).join('');

  legend.innerHTML = `
    <div class="legend-title">Forma de gobierno</div>
    ${items}
    <div class="legend-item">
      <span class="legend-dot" style="background:${COLOR_UNKNOWN}"></span>
      Sin datos
    </div>
  `;

  mapEl.appendChild(legend);
}

// ── Color por forma de gobierno ────────────────────────────

async function fetchGovColor(qid) {
  const type = await getGovType(qid);
  return GOV_PALETTE[type]?.color || COLOR_UNKNOWN;
}

// ── Helpers ────────────────────────────────────────────────

export function isoToFlag(isoA2) {
  if (!isoA2 || isoA2.length !== 2) return '🌐';
  return [...isoA2.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
    .join('');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
