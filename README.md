# 🗺️ Mapa Político

Visualizador cartográfico interactivo de formas de gobierno y datos políticos por país, consumidos en tiempo real desde la **Wikibase REST API de Wikidata**.

---

## Stack Tecnológico

| Capa       | Tecnología                        |
|------------|-----------------------------------|
| Backend    | PHP 8+ (vanilla, sin frameworks)  |
| Frontend   | Bootstrap 5.3 + JavaScript ES6+   |
| Mapas      | Leaflet 1.9.4 (~42KB)             |
| Datos      | Wikibase REST API v1 (Wikidata)   |
| Tiles      | CartoDB Dark Matter (OSM base)    |

---

## Estructura del Proyecto

```
mapa_politico/
├── index.php              ← Entrada principal
├── php/
│   ├── navbar.php         ← Módulo navbar (independiente)
│   └── footer.php         ← Módulo footer (independiente)
├── css/
│   └── mapa_politico.css  ← Estilos del proyecto
├── js/
│   └── map.js             ← Lógica Leaflet + Wikidata
├── .gitignore
└── README.md
```

---

## Arquitectura de Layout (Modus Operandi v1.4)

```
┌─────────────────────────────────────────┐  ← fixed-top (56px)
│              NAVBAR                     │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│           MAPA (Leaflet)                │  ← position: fixed
│    top: 56px | bottom: 40px             │     cubre zona central
│                                         │
│                                         │
├─────────────────────────────────────────┤
│              FOOTER                     │  ← fixed-bottom (40px)
└─────────────────────────────────────────┘
```

El `div#map` hereda `width: 100%` y `height: 100%` de su wrapper `#map-wrapper`, que está posicionado de forma fija entre navbar y footer. Esto es **crítico** para que Leaflet renderice los tiles correctamente.

---

## Orden de Dependencias CSS/JS

El orden de carga es obligatorio:

```html
<!-- CSS: Leaflet primero, luego Bootstrap, luego estilos propios -->
<link rel="stylesheet" href="leaflet.css">
<link rel="stylesheet" href="bootstrap.min.css">
<link rel="stylesheet" href="css/mapa_politico.css">

<!-- JS: Bootstrap Bundle, luego Leaflet, luego map.js -->
<script src="bootstrap.bundle.min.js"></script>
<script src="leaflet.js"></script>        <!-- DESPUÉS de leaflet.css -->
<script src="js/map.js"></script>         <!-- Inicializa en DOMContentLoaded -->
```

> ⚠️ Leaflet CSS **debe** cargarse antes que Leaflet JS para evitar errores de renderizado de tiles.

---

## API de Wikidata utilizada

**Base URL:** `https://www.wikidata.org/w/rest.php/wikibase/v1`

| Endpoint                        | Uso                              |
|---------------------------------|----------------------------------|
| `GET /entities/items/{QID}`     | Datos completos de un país       |
| `GET /search/items?q={nombre}`  | Búsqueda de QID por nombre       |

### Propiedades Wikidata consultadas

| Propiedad | ID     |
|-----------|--------|
| Capital   | P36    |
| Jefe de Estado | P35 |
| Jefe de Gobierno | P6 |
| Forma de Gobierno | P122 |
| Población | P1082  |
| Superficie | P2046 |
| Moneda    | P38    |
| Idioma oficial | P37 |

---

## Niveles de Interacción

1. **Hover** → Tooltip con nombre del país y capital (Leaflet tooltip nativo)
2. **Click** → Offcanvas lateral izquierdo con datos de Wikidata (Bootstrap Offcanvas)

---

## Cómo ejecutar localmente

```bash
# Requiere PHP 8+ instalado
cd mapa_politico
php -S localhost:8000

# Abrir en el navegador:
# http://localhost:8000
```

---

## Repositorio

[github.com/XtnPaez/mapa_politico](https://github.com/XtnPaez/mapa_politico)
