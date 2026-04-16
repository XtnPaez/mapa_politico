<?php ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mapa Político</title>

  <!-- Leaflet CSS (antes que leaflet.js, siempre) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

  <!-- Bootstrap 5 CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">

  <!-- Estilos propios -->
  <link rel="stylesheet" href="assets/css/mapa.css">
</head>
<body>

  <?php include 'php/navbar.php'; ?>

  <div id="map"></div>

  <!-- Offcanvas: panel lateral de detalle -->
  <div class="offcanvas offcanvas-start" tabindex="-1"
       id="country-panel" aria-labelledby="panel-title">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="panel-title">País</h5>
      <button type="button" class="btn-close btn-close-white"
              data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
    </div>
    <div class="offcanvas-body" id="panel-body"></div>
  </div>

  <?php include 'php/footer.php'; ?>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Leaflet JS (después del CSS) -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <!-- Lógica del mapa -->
  <script src="assets/js/mapa.js"></script>

</body>
</html>
