# 🌐 Mapa Político

Visualizador cartográfico interactivo que muestra todos los países del mundo con sus **formas de gobierno**, **jefes de estado** y datos relevantes, consumidos en tiempo real desde la **Wikibase REST API de Wikidata**.

---

## ✨ Características

- 🗺️ **Mapa interactivo** basado en [Leaflet.js](https://leafletjs.com/) (~42 KB), optimizado para desktop y móvil.
- 🖱️ **Hover:** tooltip con el nombre y bandera del país.
- 📋 **Click:** panel lateral (Offcanvas Bootstrap 5) con información detallada:
  - Forma de gobierno
  - Jefe de Estado y de Gobierno
  - Capital
  - Idioma(s) oficial(es)
  - Población
- 📡 **Datos en tiempo real** desde la [Wikibase REST API de Wikidata](https://www.wikidata.org/w/rest.php/wikibase/v1).
- 📱 **Diseño responsive** — funciona en dispositivos móviles sin scroll innecesario.

---

## 🛠️ Stack Tecnológico

| Capa       | Tecnología                                      |
|------------|--------------------------------------------------|
| Backend    | PHP (vanilla, sin frameworks)                   |
| Frontend   | Bootstrap 5 + JavaScript ES6+                   |
| Cartografía| [Leaflet 1.9.4](https://leafletjs.com/)         |
| GeoJSON    | [geo-countries](https://github.com/datasets/geo-countries) |
| Datos      | [Wikibase REST API](https://www.wikidata.org/w/rest.php/wikibase/v1) |

---

## 📁 Estructura del Proyecto

```
mapa_politico/
├── index.php           # Punto de entrada principal
├── navbar.php          # Módulo: navegación superior (fixed-top)
├── footer.php          # Módulo: pie de página sticky
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css   # Bootstrap 5 (local)
│   │   └── app.css             # Estilos propios del mapa
│   └── js/
│       ├── bootstrap.bundle.min.js  # Bootstrap JS (local)
│       └── map.js              # Lógica Leaflet + Wikidata
├── .gitignore
└── README.md
```

---

## 🚀 Instalación y Uso

### Requisitos
- PHP 7.4+ (servidor local o remoto)
- Conexión a internet (Leaflet CDN + Wikidata API)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/XtnPaez/mapa_politico.git
cd mapa_politico

# 2. Colocar los assets de Bootstrap en assets/css/ y assets/js/
#    (bootstrap.min.css y bootstrap.bundle.min.js)

# 3. Iniciar servidor PHP local
php -S localhost:8000

# 4. Abrir en el navegador
http://localhost:8000
```

---

## 🌐 API Utilizada

Este proyecto consume la **Wikibase REST API** de Wikidata:

```
Base URL: https://www.wikidata.org/w/rest.php/wikibase/v1
```

### Endpoints principales

| Endpoint                         | Uso                                      |
|----------------------------------|------------------------------------------|
| `/items?search={name}`           | Buscar un país por nombre                |
| `/entities/items/{QID}`          | Obtener datos completos de un ítem       |
| `/entities/items/{QID}/labels`   | Obtener la etiqueta/nombre de un QID     |

### Propiedades consultadas

| Propiedad | QID   | Descripción             |
|-----------|-------|-------------------------|
| Forma de gobierno  | P122 | Tipo de régimen |
| Jefe de Estado     | P35  | Cargo principal |
| Jefe de Gobierno   | P6   | Primer Ministro / PM |
| Capital            | P36  | Ciudad capital |
| Idioma oficial     | P37  | Lengua(s) oficial(es) |
| Población          | P1082| Habitantes |

---

## 🗺️ GeoJSON

Los polígonos de países se cargan desde:
```
https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson
```

---

## 📋 Roadmap

- [x] Estructura PHP modular (navbar / footer / index)
- [x] Mapa Leaflet con tiles oscuros
- [x] Carga de GeoJSON con hover y click
- [x] Panel Offcanvas con datos de Wikidata
- [ ] Búsqueda de países por nombre
- [ ] Filtrado por forma de gobierno
- [ ] Estadísticas comparativas
- [ ] Caché PHP de respuestas Wikidata
- [ ] Soporte multiidioma

---

## 📄 Licencia

MIT — libre para usar, modificar y distribuir.

---

> **Datos:** [Wikidata](https://www.wikidata.org) · **Cartografía:** [Leaflet](https://leafletjs.com) · **UI:** [Bootstrap 5](https://getbootstrap.com)
