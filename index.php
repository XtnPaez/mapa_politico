<?php
/**
 * Mapa Político — index.php
 * Punto de entrada principal de la aplicación.
 * Ensambla navbar, mapa Leaflet y footer.
 */
?>
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Visualizador cartográfico interactivo de formas de gobierno mundiales.">
  <title>Mapa Político</title>

  <!-- Bootstrap 5 CSS (local) -->
  <link href="assets/css/bootstrap.min.css" rel="stylesheet">

  <!-- Leaflet CSS (CDN) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossorigin="anonymous">

  <!-- Estilos propios de la aplicación -->
  <link href="assets/css/app.css" rel="stylesheet">
</head>

<body class="d-flex flex-column h-100">

  <?php include 'navbar.php'; ?>

  <!-- ═══════════════════════════════════════
       ZONA CENTRAL: Contenedor del mapa
  ════════════════════════════════════════ -->
  <main class="flex-grow-1 d-flex flex-column" style="margin-top: 56px;">
    <div id="map"></div>
  </main>

  <!-- ═══════════════════════════════════════
       OFFCANVAS: Panel lateral de detalle
  ════════════════════════════════════════ -->
  <div class="offcanvas offcanvas-start" tabindex="-1"
       id="countryPanel" aria-labelledby="countryPanelLabel">

    <div class="offcanvas-header bg-dark text-white">
      <h5 class="offcanvas-title" id="countryPanelLabel">
        <span id="panel-flag" class="me-2"></span>
        <span id="panel-country-name">País</span>
      </h5>
      <button type="button" class="btn-close btn-close-white"
              data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
    </div>

    <div class="offcanvas-body">
      <!-- Estado de carga -->
      <div id="panel-loading" class="text-center py-5">
        <div class="spinner-border text-secondary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="text-muted mt-3 small">Consultando Wikidata…</p>
      </div>

      <!-- Contenido dinámico (se inyecta via JS) -->
      <div id="panel-content" class="d-none">
        <ul class="list-group list-group-flush" id="panel-data-list">
          <!-- Ítems generados dinámicamente -->
        </ul>
        <p class="text-muted small mt-3 text-end">
          Fuente: <a href="#" id="panel-wikidata-link" target="_blank">Wikidata</a>
        </p>
      </div>

      <!-- Error -->
      <div id="panel-error" class="d-none">
        <div class="alert alert-warning" role="alert">
          <strong>Sin datos disponibles</strong><br>
          <span class="small">No se pudo obtener información de Wikidata para este país.</span>
        </div>
      </div>
    </div>

  </div><!-- /offcanvas -->

  <?php include 'footer.php'; ?>

  <!-- Bootstrap 5 JS Bundle (local) -->
  <script src="assets/js/bootstrap.bundle.min.js"></script>

  <!-- Leaflet JS (CDN) -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLcE="
          crossorigin="anonymous"></script>

  <!-- Lógica principal del mapa -->
  <script src="assets/js/map.js"></script>

</body>
</html>
