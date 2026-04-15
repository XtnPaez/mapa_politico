<?php
/**
 * Mapa Político — index.php  (v2 — autocontenido, sin dependencias de layout externo)
 *
 * REGLA DE ORO — Orden de carga en <head>:
 *   1. Leaflet CSS (CDN)
 *   2. Bootstrap CSS (local)
 *   3. Estilos inline críticos del mapa
 *
 * REGLA DE ORO — Orden de scripts al final del <body>:
 *   4. Bootstrap JS (local)
 *   5. Leaflet JS (CDN)
 *   6. map.js (lógica propia)
 */
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mapa Político</title>

  <!-- 1. Leaflet CSS — PRIMERO, antes de Bootstrap -->
  <link rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossorigin="anonymous">

  <!-- 2. Bootstrap CSS (local) -->
  <link href="assets/css/bootstrap.min.css" rel="stylesheet">

  <!-- 3. Estilos críticos inline — no dependen de archivos externos -->
  <style>
    /* ── Reset base ── */
    *, *::before, *::after { box-sizing: border-box; }

    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;   /* Sin scroll global: el mapa ocupa todo */
    }

    /* ── Navbar fixed-top ocupa 56px; el <main> compensa ── */
    body {
      padding-top: 56px;  /* padding-top: 60px del template original, ajustado a 56px real */
      display: flex;
      flex-direction: column;
    }

    /* ── El mapa se extiende entre navbar y footer ── */
    /*    Altura = viewport - navbar(56px) - footer(40px)    */
    #map {
      width: 100%;
      height: calc(100vh - 56px - 40px);
      /* Fallback absoluto por si calc() falla */
      min-height: 300px;
      background: #b8cfe8;   /* Color mientras cargan los tiles */
      flex-shrink: 0;
    }

    /* ── Footer fijo al fondo ── */
    footer.footer {
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    /* ── Tooltip de país ── */
    .leaflet-tooltip.country-tooltip {
      background: rgba(15, 15, 30, 0.88);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 5px;
      color: #f4f4f4;
      font-size: 0.82rem;
      font-weight: 500;
      padding: 4px 10px;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      white-space: nowrap;
    }
    .leaflet-tooltip.country-tooltip::before { display: none; }

    /* ── Offcanvas ── */
    #countryPanel { width: 340px; max-width: 92vw; }
    #countryPanel .offcanvas-header {
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }
    #panel-data-list .list-group-item {
      padding: 0.6rem 0.25rem;
      border-left: none;
      border-right: none;
    }
    #panel-data-list .label {
      display: block;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6c757d;
    }
    #panel-data-list .value {
      font-size: 0.93rem;
      font-weight: 500;
    }

    @media (max-width: 576px) {
      #countryPanel { width: 100vw; max-width: 100vw; }
    }
  </style>
</head>

<body>

  <!-- NAVBAR -->
  <?php include 'navbar.php'; ?>

  <!-- MAPA: div con altura definida por CSS inline arriba -->
  <div id="map"></div>

  <!-- OFFCANVAS — Panel lateral de detalle -->
  <div class="offcanvas offcanvas-start" tabindex="-1"
       id="countryPanel" aria-labelledby="countryPanelLabel">
    <div class="offcanvas-header bg-dark text-white">
      <h5 class="offcanvas-title d-flex align-items-center gap-2"
          id="countryPanelLabel">
        <span id="panel-flag"></span>
        <span id="panel-country-name">País</span>
      </h5>
      <button type="button" class="btn-close btn-close-white"
              data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
    </div>
    <div class="offcanvas-body p-0">
      <!-- Spinner -->
      <div id="panel-loading" class="text-center py-5 px-3">
        <div class="spinner-border text-secondary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="text-muted mt-3 small">Consultando Wikidata…</p>
      </div>
      <!-- Datos -->
      <div id="panel-content" class="d-none px-3 py-2">
        <ul class="list-group list-group-flush" id="panel-data-list"></ul>
        <p class="text-muted small mt-3 mb-2 text-end px-1">
          Fuente: <a href="#" id="panel-wikidata-link"
                     target="_blank" rel="noopener">Wikidata</a>
        </p>
      </div>
      <!-- Error -->
      <div id="panel-error" class="d-none px-3 py-3">
        <div class="alert alert-warning mb-0">
          <strong>Sin datos disponibles</strong><br>
          <span class="small">No se encontró información en Wikidata.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <?php include 'footer.php'; ?>

  <!-- 4. Bootstrap JS (local) — antes de Leaflet JS -->
  <script src="assets/js/bootstrap.bundle.min.js"></script>

  <!-- 5. Leaflet JS (CDN) — después de Bootstrap, antes de map.js -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLcE="
          crossorigin="anonymous"></script>

  <!-- 6. Lógica propia — siempre al final -->
  <script src="assets/js/map.js"></script>

</body>
</html>
