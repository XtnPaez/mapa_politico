# Mapa Político

![PHP](https://img.shields.io/badge/PHP-8%2B-777BB4?style=flat-square&logo=php&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=flat-square&logo=leaflet&logoColor=white)
![Wikidata](https://img.shields.io/badge/Wikidata-REST%20API-006699?style=flat-square&logo=wikidata&logoColor=white)

Visualizador cartográfico interactivo de formas de gobierno y datos políticos por país, consumidos en tiempo real desde la **Wikibase REST API de Wikidata**.

---

## Stack Tecnológico

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Backend    | PHP 8+ (vanilla, sin frameworks)    |
| Frontend   | Bootstrap 5.3 + JavaScript ES6+     |
| Mapas      | Leaflet 1.9.4 (~42KB)               |
| Datos      | Wikibase REST API v1 (Wikidata)     |
| Tiles      | OpenStreetMap                       |
| GeoJSON    | Natural Earth 110m (via CloudFront) |

---

## Estructura del Proyecto

```
mapa_politico/
├── index.php                  ← Entrada principal
├── php/
│   ├── navbar.php             ← Módulo navbar (independiente)
│   └── footer.php             ← Módulo footer (independiente)
├── assets/
│   ├── css/
│   │   └── mapa.css           ← Estilos del proyecto
│   ├── js/
│   │   └── mapa.js            ← Lógica Leaflet + Wikidata
│   └── data/
│       └── gov_forms.json     ← ISO A2 → categoría de gobierno (estático)
├── .gitignore
└── README.md
```

---

## Arquitectura de Layout

```
┌─────────────────────────────────────────┐  ← fixed-top (52px)
│              NAVBAR                     │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│           MAPA (Leaflet)                │  ← position: fixed
│    top: 52px | bottom: 36px             │     cubre zona central
│                                         │
│                                         │
├─────────────────────────────────────────┤
│              FOOTER                     │  ← fixed-bottom (36px)
└─────────────────────────────────────────┘
```

`#map` está `position: fixed` con `top` y `bottom` exactos. Sin wrappers intermedios.

---

## Orden de Dependencias CSS/JS

```html
<!-- CSS -->
<link rel="stylesheet" href="leaflet.css">       <!-- 1. Leaflet CSS siempre primero -->
<link rel="stylesheet" href="bootstrap.min.css"> <!-- 2. Bootstrap -->
<link rel="stylesheet" href="assets/css/mapa.css"> <!-- 3. Estilos propios -->

<!-- JS -->
<script src="bootstrap.bundle.min.js"></script>  <!-- 1. Bootstrap (incluye Popper) -->
<script src="leaflet.js"></script>               <!-- 2. Leaflet DESPUÉS de su CSS -->
<script src="assets/js/mapa.js"></script>        <!-- 3. Lógica propia -->
```

> ⚠️ Sin `integrity` en los tags `<script>` y `<link>` — los hashes causan bloqueo si no coinciden exactamente con la versión del CDN.

---

## Colores por Forma de Gobierno

Los polígonos se colorean al cargar desde `gov_forms.json` — sin requests a Wikidata.

| Categoría                | Color     |
|--------------------------|-----------|
| República presidencial   | `#a1cfdd` |
| República parlamentaria  | `#cddc49` |
| República federal        | `#efce97` |
| Monarquía constitucional | `#cb7e94` |
| Monarquía absoluta       | `#e94b30` |
| Estado partido único     | `#5e0032` |
| Teocracia                | `#fee659` |
| Sin datos                | `#6f6456` |

El color del badge en el panel lateral usa el mismo valor que el polígono en el mapa.

---

## API de Wikidata

**Base URL:** `https://www.wikidata.org/w/rest.php/wikibase/v1`

| Endpoint                          | Uso                            |
|-----------------------------------|--------------------------------|
| `GET /entities/items/{QID}`       | Datos completos de un país     |
| `GET /entities/items/{QID}?_fields=labels` | Resolver QID a etiqueta |

### Propiedades consultadas

| Propiedad         | ID     | Nota                                      |
|-------------------|--------|-------------------------------------------|
| Capital           | P36    | QID → se resuelve a etiqueta              |
| Jefe de Estado    | P35    | QID → se resuelve a etiqueta              |
| Jefe de Gobierno  | P6     | QID → se resuelve a etiqueta              |
| Forma de Gobierno | P122   | Referencial — se usa `gov_forms.json`     |
| Población         | P1082  | `content.amount` (objeto quantity)        |
| Superficie        | P2046  | `content.amount` (objeto quantity)        |
| Moneda            | P38    | QID → se resuelve a etiqueta              |
| Idioma oficial    | P37    | QID → se resuelve a etiqueta              |
| Partido político  | P102   | Del ítem del jefe de gobierno (2do fetch) |

### Criterio de valor vigente

Wikidata puede tener múltiples valores históricos por propiedad. Se usa:
1. Statement con `rank: "preferred"` si existe
2. Si no, el **último** de la lista (más recientemente agregado)

---

## Niveles de Interacción

1. **Hover** → Tooltip oscuro con nombre del país (sin borde — `outline: none` global)
2. **Click** → Offcanvas lateral izquierdo con datos de Wikidata + leyenda de colores

---

## Fix crítico: el recuadro de Leaflet

El SVG animado de Leaflet genera un `outline` visible al hacer hover/click sobre los polígonos. Se elimina con:

```css
*, *:focus, *:hover {
  outline: none;
}
```

---

## Cómo ejecutar localmente

```bash
# Requiere PHP 8+
cd mapa_politico
php -S localhost:8000

# Aplicación principal:
# http://localhost:8000

```

---

## Repositorio

[github.com/XtnPaez/mapa_politico](https://github.com/XtnPaez/mapa_politico)
