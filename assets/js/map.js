/**
 * Mapa Político — map.js  (v2)
 *
 * Filosofía: simple y funcional primero.
 * El mapa base y el GeoJSON deben renderizar sin errores
 * antes de agregar capas de complejidad.
 */

'use strict';

/* ══════════════════════════════════════════════
   CONFIGURACIÓN CENTRAL
══════════════════════════════════════════════ */
const GEOJSON_URL   = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const WIKIDATA_API  = 'https://www.wikidata.org/w/rest.php/wikibase/v1';

const STYLE_DEFAULT = { color: '#336699', weight: 0.8, fillColor: '#6a9fcf', fillOpacity: 0.5 };
const STYLE_HOVER   = { color: '#c0392b', weight: 2,   fillColor: '#e8a838', fillOpacity: 0.8 };
const STYLE_ACTIVE  = { color: '#7b241c', weight: 2.5, fillColor: '#e74c3c', fillOpacity: 0.85 };

const WIKIDATA_PROPS = {
  govtForm:    'P122',
  headOfState: 'P35',
  headOfGovt:  'P6',
  capital:     'P36',
  officialLang:'P37',
  population:  'P1082',
};

/* ══════════════════════════════════════════════
   PASO 1 — Inicializar mapa Leaflet en #map
══════════════════════════════════════════════ */
const map = L.map('map', {
  center:  [20, 10],
  zoom:    2,
  minZoom: 2,
  maxZoom: 10,
  worldCopyJump: true,   // tiles continúan al desplazar horizontalmente
});

/* ══════════════════════════════════════════════
   PASO 2 — Capa base OpenStreetMap
══════════════════════════════════════════════ */
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
}).addTo(map);

/* ══════════════════════════════════════════════
   ESTADO
══════════════════════════════════════════════ */
let activeLayer    = null;
let panelInstance  = null;   // Bootstrap Offcanvas (lazy)

/* ══════════════════════════════════════════════
   PASO 3 — Cargar GeoJSON con fetch()
══════════════════════════════════════════════ */
fetch(GEOJSON_URL)
  .then(function(response) {
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  })
  .then(function(geojsonData) {
    renderGeoJSON(geojsonData);   // PASO 4
  })
  .catch(function(err) {
    console.error('[MapaPolitico] Error GeoJSON:', err);
    document.getElementById('map').insertAdjacentHTML('beforeend',
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'background:#fff;padding:1rem 2rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:9999;">' +
      '⚠️ No se pudo cargar el mapa. Verifica tu conexión.</div>'
    );
  });

/* ══════════════════════════════════════════════
   PASO 4 — Renderizar polígonos con L.geoJSON()
══════════════════════════════════════════════ */
function renderGeoJSON(data) {
  L.geoJSON(data, {

    style: function() {
      return Object.assign({}, STYLE_DEFAULT);
    },

    onEachFeature: function(feature, layer) {
      var props = feature.properties;
      var name  = props.ADMIN  || props.name || 'Desconocido';
      var iso2  = props.ISO_A2 || '';
      var iso3  = props.ISO_A3 || '';

      setupCountryLayer(layer, name, iso2, iso3);
    }

  }).addTo(map);
}

/* ══════════════════════════════════════════════
   PASO 5 — Eventos por país
══════════════════════════════════════════════ */
function setupCountryLayer(layer, name, iso2, iso3) {

  /* — Tooltip en hover (sigue el cursor) — */
  var flag = iso2 ? toFlagEmoji(iso2) : '';
  layer.bindTooltip(flag + ' <strong>' + name + '</strong>', {
    sticky:    true,
    direction: 'top',
    opacity:   1,
    className: 'country-tooltip',
  });

  /* — mouseover: resaltar — */
  layer.on('mouseover', function() {
    if (this !== activeLayer) {
      this.setStyle(STYLE_HOVER);
      this.bringToFront();
    }
  });

  /* — mouseout: restaurar — */
  layer.on('mouseout', function() {
    if (this !== activeLayer) {
      this.setStyle(STYLE_DEFAULT);
    }
  });

  /* — click: abrir panel Offcanvas — */
  layer.on('click', function() {
    if (activeLayer && activeLayer !== this) {
      activeLayer.setStyle(STYLE_DEFAULT);
    }
    activeLayer = this;
    this.setStyle(STYLE_ACTIVE);
    openCountryPanel(name, iso2);
  });
}

/* ══════════════════════════════════════════════
   OFFCANVAS — Abrir panel y cargar datos
══════════════════════════════════════════════ */
function openCountryPanel(name, iso2) {
  /* Actualizar encabezado */
  document.getElementById('panel-flag').textContent         = iso2 ? toFlagEmoji(iso2) : '🏳';
  document.getElementById('panel-country-name').textContent = name;

  /* Mostrar spinner */
  setPanelState('loading');

  /* Instanciar Offcanvas una sola vez */
  if (!panelInstance) {
    panelInstance = new bootstrap.Offcanvas(
      document.getElementById('countryPanel'),
      { scroll: true, backdrop: false }
    );
  }
  panelInstance.show();

  /* Consultar Wikidata */
  loadWikidataForCountry(name, iso2);
}

/* ══════════════════════════════════════════════
   WIKIDATA — Búsqueda en 2 pasos
══════════════════════════════════════════════ */

/* Paso A: buscar QID por nombre */
function loadWikidataForCountry(name, iso2) {
  var url = WIKIDATA_API + '/items?' + new URLSearchParams({
    search: name, language: 'en', limit: 1
  });

  fetch(url)
    .then(function(r) {
      if (!r.ok) throw new Error('Search ' + r.status);
      return r.json();
    })
    .then(function(results) {
      if (!results || results.length === 0) throw new Error('sin QID');
      return results[0].id;
    })
    .then(function(qid) {
      return fetch(WIKIDATA_API + '/entities/items/' + qid)
        .then(function(r) {
          if (!r.ok) throw new Error('Item ' + r.status);
          return r.json();
        })
        .then(function(item) {
          return buildPanel(item, qid);
        });
    })
    .catch(function(err) {
      console.warn('[MapaPolitico] Wikidata:', err.message);
      renderFallback(name, iso2);
    });
}

/* Paso B: construir el panel con datos del ítem */
function buildPanel(item, qid) {
  var statements = item.statements || {};
  var labels     = item.labels     || {};
  var offName    = (labels.es && labels.es.value) || (labels.en && labels.en.value) || '—';

  /* Resolver propiedades (pueden ser QIDs o valores directos) */
  Promise.all([
    resolveProp(statements, WIKIDATA_PROPS.govtForm),
    resolveProp(statements, WIKIDATA_PROPS.headOfState),
    resolveProp(statements, WIKIDATA_PROPS.headOfGovt),
    resolveProp(statements, WIKIDATA_PROPS.capital),
    resolveProp(statements, WIKIDATA_PROPS.officialLang),
    resolvePopulation(statements),
  ]).then(function(values) {
    var rows = [
      { label: 'Nombre oficial',    val: offName    },
      { label: 'Forma de gobierno', val: values[0]  },
      { label: 'Jefe de Estado',    val: values[1]  },
      { label: 'Jefe de Gobierno',  val: values[2]  },
      { label: 'Capital',           val: values[3]  },
      { label: 'Idioma oficial',    val: values[4]  },
      { label: 'Población',         val: values[5]  },
    ];

    var list = document.getElementById('panel-data-list');
    list.innerHTML = rows
      .filter(function(r) { return r.val && r.val !== '—'; })
      .map(function(r) {
        return '<li class="list-group-item">' +
          '<span class="label">' + esc(r.label) + '</span>' +
          '<span class="value">' + esc(r.val)   + '</span>' +
          '</li>';
      }).join('');

    var lnk = document.getElementById('panel-wikidata-link');
    lnk.href        = 'https://www.wikidata.org/wiki/' + qid;
    lnk.textContent = qid;

    setPanelState('content');
  });
}

function renderFallback(name, iso2) {
  var list = document.getElementById('panel-data-list');
  list.innerHTML =
    '<li class="list-group-item"><span class="label">País</span>' +
    '<span class="value">' + esc(name) + '</span></li>' +
    (iso2 ? '<li class="list-group-item"><span class="label">ISO</span>' +
    '<span class="value">' + esc(iso2) + '</span></li>' : '');

  var lnk = document.getElementById('panel-wikidata-link');
  lnk.href        = 'https://www.wikidata.org/w/index.php?search=' + encodeURIComponent(name);
  lnk.textContent = 'Buscar en Wikidata';
  setPanelState('content');
}

/* ══════════════════════════════════════════════
   HELPERS — Wikidata
══════════════════════════════════════════════ */

function resolveProp(statements, propId) {
  var prop = statements[propId];
  if (!prop || !prop.length) return Promise.resolve('—');

  var val     = prop[0] && prop[0].value;
  if (!val) return Promise.resolve('—');

  var content = val.content;

  /* Escalar directo */
  if (typeof content === 'string') return Promise.resolve(content);

  /* Cantidad numérica */
  if (content && content.amount) return Promise.resolve(content.amount);

  /* Entity-id (QID) → resolver etiqueta */
  var qid = content && content.id;
  if (qid && typeof qid === 'string' && qid[0] === 'Q') {
    return fetch(WIKIDATA_API + '/entities/items/' + qid + '/labels')
      .then(function(r) { return r.ok ? r.json() : {}; })
      .then(function(lbls) {
        return (lbls.es && lbls.es.value) || (lbls.en && lbls.en.value) || qid;
      })
      .catch(function() { return qid; });
  }

  return Promise.resolve('—');
}

function resolvePopulation(statements) {
  var prop = statements[WIKIDATA_PROPS.population];
  if (!prop || !prop.length) return Promise.resolve('—');

  /* Ordenar por fecha del dato (P585) descendente */
  var sorted = prop.slice().sort(function(a, b) {
    var tA = (a.qualifiers && a.qualifiers.P585 &&
              a.qualifiers.P585[0] && a.qualifiers.P585[0].value &&
              a.qualifiers.P585[0].value.content &&
              a.qualifiers.P585[0].value.content.time) || '';
    var tB = (b.qualifiers && b.qualifiers.P585 &&
              b.qualifiers.P585[0] && b.qualifiers.P585[0].value &&
              b.qualifiers.P585[0].value.content &&
              b.qualifiers.P585[0].value.content.time) || '';
    return tB.localeCompare(tA);
  });

  var amount = sorted[0] && sorted[0].value && sorted[0].value.content && sorted[0].value.content.amount;
  if (amount !== undefined && amount !== null) {
    var n = parseInt(amount, 10);
    return Promise.resolve(isNaN(n) ? '—' : n.toLocaleString('es-AR'));
  }
  return Promise.resolve('—');
}

/* ══════════════════════════════════════════════
   HELPERS — UI
══════════════════════════════════════════════ */

function setPanelState(state) {
  document.getElementById('panel-loading').classList.toggle('d-none', state !== 'loading');
  document.getElementById('panel-content').classList.toggle('d-none', state !== 'content');
  document.getElementById('panel-error').classList.toggle('d-none',   state !== 'error');
}

function toFlagEmoji(iso2) {
  return iso2.toUpperCase().split('').map(function(c) {
    return String.fromCodePoint(c.charCodeAt(0) + 127397);
  }).join('');
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
