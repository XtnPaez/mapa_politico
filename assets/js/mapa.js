'use strict';

/* ── Configuración ── */
const WIKIDATA_API = 'https://www.wikidata.org/w/rest.php/wikibase/v1';

// Fuentes GeoJSON en cascada (la primera que responda bien se usa)
const GEOJSON_SOURCES = [
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
  'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
];

/* ── Paleta y etiquetas por forma de gobierno ── */
const GOV_STYLES = {
  republica_presidencial:  { color: '#a1cfdd', label: 'República presidencial'  },
  republica_parlamentaria: { color: '#cddc49', label: 'República parlamentaria' },
  republica_federal:       { color: '#efce97', label: 'República federal'        },
  monarquia_constitucional:{ color: '#cb7e94', label: 'Monarquía constitucional' },
  monarquia_absoluta:      { color: '#e94b30', label: 'Monarquía absoluta'       },
  partido_unico:           { color: '#5e0032', label: 'Estado partido único'     },
  teocracia:               { color: '#fee659', label: 'Teocracia'                },
  sin_datos:               { color: '#6f6456', label: 'Sin datos'                },
};

/* ── Estado ── */
const State = {
  map:           null,
  geojsonLayer:  null,
  selectedLayer: null,
  offcanvas:     null,
  govForms:      {},   // ISO → categoria cargado desde gov_forms.json
};

/* ══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  // 1. Mapa base (igual que antes, probado y funcionando)
  State.map = L.map('map', {
    center: [20, 10],
    zoom: 2,
    minZoom: 2,
    maxZoom: 10,
    zoomControl: true,
    worldCopyJump: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(State.map);

  State.map.zoomControl.setPosition('topright');

  // 2. Offcanvas Bootstrap
  State.offcanvas = new bootstrap.Offcanvas(
    document.getElementById('country-panel'),
    { backdrop: false, scroll: true }
  );

  // 3. Cargar paleta de gobiernos y luego el GeoJSON
  fetch('assets/data/gov_forms.json')
    .then(function(r) { return r.json(); })
    .then(function(data) { State.govForms = data; loadGeoJSON(); })
    .catch(function() { loadGeoJSON(); });

});

/* ══════════════════════════════════════════
   GEOJSON — carga con fallback en cascada
═══════════════════════════════════════════ */
async function loadGeoJSON() {
  setStatus('Cargando países…');

  let data = null;

  for (const url of GEOJSON_SOURCES) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.features && json.features.length) {
        data = json;
        break;
      }
    } catch (e) {
      console.warn('[GeoJSON] falló:', url, e.message);
    }
  }

  if (!data) {
    setStatus('Error al cargar países.');
    return;
  }

  State.geojsonLayer = L.geoJSON(data, {
    style: styleNormal,
    onEachFeature: bindFeature,
  }).addTo(State.map);

  setStatus(data.features.length + ' países cargados');
  buildLegend();
}

/* ══════════════════════════════════════════
   LEYENDA
═══════════════════════════════════════════ */
function buildLegend() {
  var legend = L.control({ position: 'bottomright' });

  legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'map-legend');
    var html = '<div class="legend-title">Forma de gobierno</div>';

    Object.keys(GOV_STYLES).forEach(function (key) {
      var s = GOV_STYLES[key];
      html += '<div class="legend-item">' +
        '<span class="legend-dot" style="background:' + s.color + '"></span>' +
        '<span class="legend-label">' + s.label + '</span>' +
        '</div>';
    });

    div.innerHTML = html;

    // Evitar que clicks en la leyenda afecten el mapa
    L.DomEvent.disableClickPropagation(div);
    return div;
  };

  legend.addTo(State.map);
}

/* ══════════════════════════════════════════
   ESTILOS GEOJSON
═══════════════════════════════════════════ */
function getGovStyle(iso) {
  var cat = State.govForms[iso ? iso.toUpperCase() : ''] || 'sin_datos';
  var style = GOV_STYLES[cat] || GOV_STYLES.sin_datos;
  return style;
}

function styleNormal(feature) {
  var props = feature ? (feature.properties || {}) : {};
  var iso   = props.ISO_A2 || props.iso_a2 || props.ISO2 || '';
  var color = getGovStyle(iso).color;
  return { fillColor: color, fillOpacity: 0.55, color: '#1a2530', weight: 0.6 };
}
function styleHover(layer) {
  var props = layer.feature ? (layer.feature.properties || {}) : {};
  var iso   = props.ISO_A2 || props.iso_a2 || props.ISO2 || '';
  var color = getGovStyle(iso).color;
  layer.setStyle({ fillColor: color, fillOpacity: 0.72, color: '#1a2530', weight: 1.2 });
}
function styleSelected(layer) {
  var props = layer.feature ? (layer.feature.properties || {}) : {};
  var iso   = props.ISO_A2 || props.iso_a2 || props.ISO2 || '';
  var color = getGovStyle(iso).color;
  layer.setStyle({ fillColor: color, fillOpacity: 0.88, color: '#1a2530', weight: 0.6 });
}
function styleReset(layer) {
  State.geojsonLayer.resetStyle(layer);
}

/* ══════════════════════════════════════════
   EVENTOS POR FEATURE
═══════════════════════════════════════════ */
function bindFeature(feature, layer) {
  const p    = feature.properties || {};
  const name = p.ADMIN || p.NAME || p.name || p.NAME_EN || 'País desconocido';
  const iso  = p.ISO_A2 || p.iso_a2 || p.ISO2 || '';

  // Tooltip hover
  layer.bindTooltip(
    '<div class="tt-name">' + esc(name) + '</div>',
    { className: 'country-tooltip', sticky: true, direction: 'top', offset: [0, -4] }
  );

  layer.on('mouseover', function () {
    if (State.selectedLayer !== layer) styleHover(layer);
  });
  layer.on('mouseout', function () {
    if (State.selectedLayer !== layer) styleReset(layer);
  });
  layer.on('click', function () {
    layer.closeTooltip();
    selectCountry(layer, name, iso);
  });
}

/* ══════════════════════════════════════════
   SELECCIÓN DE PAÍS
═══════════════════════════════════════════ */
function selectCountry(layer, name, iso) {
  // Resetear selección anterior
  if (State.selectedLayer && State.selectedLayer !== layer) {
    styleReset(State.selectedLayer);
  }
  State.selectedLayer = layer;
  styleSelected(layer);

  // Centrar en el país con flyTo — sin ningún frame de bounding box
  var bounds  = layer.getBounds();
  var center  = bounds.getCenter();
  var mapSize = State.map.getSize();
  var zoom    = State.map.getBoundsZoom(bounds, false, L.point(mapSize.x - 380, mapSize.y));
  State.map.flyTo(center, Math.min(zoom, 6), { animate: true, duration: 0.6 });

  // Abrir panel con loading
  document.getElementById('panel-title').textContent = name;
  document.getElementById('panel-body').innerHTML =
    '<div id="panel-loading">' +
    '<div class="spinner-border spinner-border-sm text-info" role="status"></div>' +
    'Consultando Wikidata…</div>';
  State.offcanvas.show();

  // Buscar datos
  fetchWikidata(name, iso).then(function (data) {
    renderPanel(data, name, iso);
  });
}

/* ══════════════════════════════════════════
   WIKIDATA
═══════════════════════════════════════════ */

// ISO A2 → QID
const ISO_QID = {
  AR:'Q414', BR:'Q155', US:'Q30',  MX:'Q96',  CL:'Q298', UY:'Q77',
  BO:'Q750', PY:'Q733', PE:'Q419', CO:'Q739', VE:'Q717', EC:'Q736',
  CN:'Q148', JP:'Q17',  IN:'Q668', RU:'Q159', DE:'Q183', FR:'Q142',
  GB:'Q145', IT:'Q38',  ES:'Q29',  PT:'Q45',  AU:'Q408', CA:'Q16',
  ZA:'Q258', NG:'Q1033',EG:'Q79',  KE:'Q114', ET:'Q115', GH:'Q117',
  SA:'Q851', IR:'Q794', TR:'Q43',  ID:'Q252', PK:'Q843', TH:'Q869',
  SE:'Q34',  NO:'Q20',  FI:'Q33',  DK:'Q35',  NL:'Q55',  BE:'Q31',
  CH:'Q39',  AT:'Q40',  PL:'Q36',  CZ:'Q213', HU:'Q28',  RO:'Q218',
  UA:'Q212', GR:'Q41',  IL:'Q801', AE:'Q878', KR:'Q884', VN:'Q881',
  AF:'Q889', IQ:'Q796', SY:'Q858', LY:'Q1016',SD:'Q1049',SO:'Q1045',
  CD:'Q974', AO:'Q916', TZ:'Q924', MZ:'Q1029',MG:'Q1019',CM:'Q1009',
  CI:'Q1008',SN:'Q1041',ML:'Q912', BF:'Q965', TN:'Q948', DZ:'Q262',
  MA:'Q1028',CG:'Q971', ZM:'Q953', ZW:'Q954', NA:'Q1030',
  NZ:'Q664', PG:'Q691', FJ:'Q712', PH:'Q928', MY:'Q833', SG:'Q334',
  MM:'Q836', KH:'Q424', LA:'Q819', BD:'Q902', LK:'Q854', NP:'Q837',
  MN:'Q711', KZ:'Q232', UZ:'Q265', TM:'Q874', AZ:'Q561',
  GE:'Q230', AM:'Q399', BY:'Q184', MD:'Q217', AL:'Q222', RS:'Q403',
  BA:'Q225', HR:'Q224', SI:'Q215', MK:'Q221', ME:'Q236',
  SK:'Q214', LT:'Q37',  LV:'Q211', EE:'Q191', IS:'Q189',
  NI:'Q811', HN:'Q783', GT:'Q774', SV:'Q792', CR:'Q800', PA:'Q804',
  CU:'Q241', DO:'Q786', HT:'Q790', JM:'Q766', TT:'Q754',
};

// Propiedades Wikidata
const P = {
  CAPITAL:    'P36',
  HEAD_STATE: 'P35',
  HEAD_GOVT:  'P6',
  GOV_FORM:   'P122',
  POPULATION: 'P1082',
  AREA:       'P2046',
  CURRENCY:   'P38',
  LANG:       'P37',
  PARTY:      'P102',   // partido político del jefe de gobierno
};

async function fetchWikidata(name, iso) {
  const qid = ISO_QID[iso ? iso.toUpperCase() : ''];
  const result = { name: name, iso: iso, qid: qid || null };

  if (!qid) return result;

  try {
    const res  = await fetch(WIKIDATA_API + '/entities/items/' + qid);
    const item = await res.json();
    const s    = item.statements || {};
    // Devuelve el statement activo: primero "preferred", si no el primer "normal"
    const getBest = function (p) {
      if (!s[p] || !s[p].length) return null;
      // "preferred" = valor vigente marcado explícitamente
      var preferred = s[p].find(function (st) { return st.rank === 'preferred'; });
      if (preferred) return preferred;
      // Sin preferred: el último de la lista es el más reciente
      return s[p][s[p].length - 1];
    };
    const getV = function (p) {
      var st = getBest(p);
      return st ? st.value.content : null;
    };
    // Para quantity: content = { amount: "+3954911", unit: "..." }
    const getQ = function (p) {
      var c = getV(p);
      return (c && c.amount) ? parseFloat(c.amount) : null;
    };

    result.capital  = getV(P.CAPITAL);
    result.hdState  = getV(P.HEAD_STATE);
    result.hdGovt   = getV(P.HEAD_GOVT);
    result.govForm  = getV(P.GOV_FORM);
    result.pop      = getQ(P.POPULATION);
    result.area     = getQ(P.AREA);
    result.currency = getV(P.CURRENCY);
    result.lang     = getV(P.LANG);

    // Partido: lo leemos del ítem del jefe de gobierno, no del país
    // Se resuelve en segundo paso si hdGovt es un QID
    result.party    = null; // se completa abajo si hay QID de jefe de gobierno

    // Recolectar QIDs para resolver a etiquetas
    var toResolve = [
      result.capital, result.hdState, result.hdGovt,
      result.govForm, result.currency, result.lang,
    ].filter(function (v) { return v && /^Q\d+$/.test(String(v)); });

    if (toResolve.length) {
      result.labels = await resolveQids(toResolve);
    }

    // Si hay QID de jefe de gobierno, buscar su partido (P102)
    var hdGovtQid = result.hdGovt && /^Q\d+$/.test(String(result.hdGovt)) ? result.hdGovt : null;
    if (hdGovtQid) {
      try {
        var pr = await fetch(WIKIDATA_API + '/entities/items/' + hdGovtQid + '?_fields=statements');
        var pd = await pr.json();
        var ps = pd.statements || {};
        // Tomar el partido más reciente (mismo criterio: preferred o último)
        var partyStmts = ps['P102'] || [];
        var bestParty = partyStmts.find(function(st){ return st.rank === 'preferred'; })
                        || partyStmts[partyStmts.length - 1];
        if (bestParty) {
          result.party = bestParty.value.content; // QID del partido
          // Agregar a labels para resolver
          if (/^Q\d+$/.test(String(result.party))) {
            var partyLabels = await resolveQids([result.party]);
            result.labels = Object.assign(result.labels || {}, partyLabels);
          }
        }
      } catch(e) {
        // partido no crítico, ignorar error
      }
    }
  } catch (e) {
    console.warn('[Wikidata]', e.message);
  }

  return result;
}

async function resolveQids(qids) {
  const unique = [...new Set(qids)].slice(0, 8);
  const map    = {};

  await Promise.allSettled(unique.map(async function (qid) {
    try {
      const res  = await fetch(WIKIDATA_API + '/entities/items/' + qid + '?_fields=labels');
      const data = await res.json();
      map[qid] = (data.labels && (data.labels.es || data.labels.en)) || qid;
    } catch (e) {
      map[qid] = qid;
    }
  }));

  return map;
}

/* ══════════════════════════════════════════
   RENDER DEL PANEL
═══════════════════════════════════════════ */
function renderPanel(d, name, iso) {
  const lbl = d.labels || {};

  // Resolver un valor: si es QID, buscar en labels; si no es QID, usar directo
  function r(v) {
    if (!v) return '—';
    var s = String(v);
    if (lbl[s]) return lbl[s];
    if (/^Q\d+$/.test(s)) return '—';
    return s;
  }

  function fmt(n) {
    return n ? Number(n).toLocaleString('es-AR') : '—';
  }

  // Usar categoría y color del JSON local (coherente con leyenda y polígonos)
  var govStyle = getGovStyle(d.iso);
  var gc       = govStyle.color;
  var govText  = govStyle.label;   // etiqueta canónica, no la de Wikidata

  document.getElementById('panel-body').innerHTML =
    '<div class="mb-3">' +
      '<span class="gov-badge" style="color:' + gc + ';background:' + gc + '22;border-color:' + gc + '55">' +
        esc(govText) +
      '</span>' +
    '</div>' +
    row('Capital',          r(d.capital))  +
    row('Jefe de Estado',   r(d.hdState))  +
    row('Jefe de Gobierno', r(d.hdGovt))   +
    (d.party ? row('Partido', r(d.party)) : '') +
    row('Idioma oficial',   r(d.lang))     +
    row('Moneda',           r(d.currency)) +
    row('Población',        fmt(d.pop))    +
    row('Superficie',       d.area ? fmt(d.area) + ' km²' : '—') +
    row('Código ISO',       iso || '—')    +
    (d.qid
      ? row('Wikidata', '<a href="https://www.wikidata.org/wiki/' + d.qid + '" target="_blank" rel="noopener">' + d.qid + ' ↗</a>')
      : '');
}

function row(label, value) {
  return '<div class="data-row">' +
    '<span class="data-label">' + label + '</span>' +
    '<span class="data-value">' + value + '</span>' +
    '</div>';
}



/* ── Helpers ── */
function setStatus(msg) {
  var el = document.getElementById('footer-status');
  if (el) el.textContent = msg;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
