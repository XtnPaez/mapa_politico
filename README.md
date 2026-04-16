# 🌍 Mapa Político Mundial

Visualizador cartográfico interactivo que muestra formas de gobierno, jefes de estado y datos relevantes de todos los países del mundo, consumidos en tiempo real desde la **Wikidata REST API**.

**Demo:** [https://xtnpaez.github.io/mapa_politico](https://xtnpaez.github.io/mapa_politico)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Mapas | [Leaflet 1.9](https://leafletjs.com/) |
| UI / Layout | [Bootstrap 5.3](https://getbootstrap.com/) + Bootstrap Icons |
| Datos | [Wikidata REST API](https://www.wikidata.org/wiki/Wikidata:REST_API) |
| GeoJSON | [Natural Earth via datasets/geo-countries](https://github.com/datasets/geo-countries) |
| Hosting | GitHub Pages (100% estático) |
| Lenguaje | JavaScript ES6+ (módulos nativos) |

---

## Arquitectura

```
mapa_politico/
├── index.html                  # Punto de entrada
├── css/
│   └── main.css                # Estilos globales
├── js/
│   ├── app.js                  # Bootstrap de la app (entry point)
│   ├── map.js                  # Inicialización Leaflet + eventos
│   ├── wikidata.js             # Servicio Wikidata REST API
│   └── ui.js                  # Renderizado del panel lateral
└── components/
    ├── navbar.html             # Navbar (módulo independiente)
    └── footer.html             # Footer (módulo independiente)
```

### Modularización sin PHP

Los componentes `navbar.html` y `footer.html` son módulos independientes cargados dinámicamente mediante `fetch()` en `app.js`. Esto replica la modularidad del `include()` de PHP sin necesitar servidor.

```js
await loadComponent('navbar-placeholder', 'components/navbar.html');
```

---

## Funcionalidades

### Hover — Tooltip
Al pasar el cursor sobre un país se muestra un tooltip con:
- Bandera emoji
- Nombre del país
- Indicación de que se puede hacer clic

### Click — Panel lateral (Offcanvas)
Al seleccionar un país se despliega un panel desde la izquierda con:
- Forma de gobierno
- Jefe de Estado
- Jefe de Gobierno
- Capital
- Población y superficie
- Moneda
- Idioma(s) oficial(es)
- Enlace directo a Wikidata

---

## API de Wikidata

Se usa la **Wikibase REST API** (no la API legacy):

```
Base URL: https://www.wikidata.org/w/rest.php/wikibase/v1
```

Flujo de consulta por país:
1. El GeoJSON provee el código ISO A2 del país (ej: `AR`)
2. Se ejecuta una consulta SPARQL para obtener el QID (ej: `Q414`)
3. Se llama a `/entities/items/{QID}` para obtener el ítem completo
4. Se resuelven en paralelo las labels de entidades relacionadas (jefe de estado, capital, etc.)

---

## Deploy en GitHub Pages

1. Hacer fork o clonar el repositorio
2. Ir a **Settings → Pages**
3. Source: `Deploy from a branch` → `main` → `/ (root)`
4. GitHub Pages servirá `index.html` automáticamente

No se necesita configuración adicional. No hay backend, no hay build step.

---

## Desarrollo local

Al usar ES Modules (`type="module"`), los navegadores requieren un servidor HTTP para cargar los archivos. Opciones:

```bash
# Python (incluido en macOS/Linux)
python3 -m http.server 8080

# Node.js
npx serve .

# VS Code
# Instalar extensión "Live Server" y hacer clic en "Go Live"
```

Luego abrir `http://localhost:8080`.

> ⚠️ No abrir `index.html` directamente con `file://` — los módulos JS fallarán por política CORS del navegador.

---

## Roadmap

- [ ] Colorización del mapa por forma de gobierno (república, monarquía, etc.)
- [ ] Búsqueda de países en la navbar
- [ ] Filtros por región o tipo de gobierno
- [ ] Modal "Acerca de" con información del proyecto
- [ ] Caché local con `sessionStorage` para reducir llamadas a la API
- [ ] Soporte offline con Service Worker

---

## Licencia

MIT © [XtnPaez](https://github.com/XtnPaez)

Datos: [Wikidata](https://www.wikidata.org) (CC0) · GeoJSON: [Natural Earth](https://www.naturalearthdata.com/) (dominio público)
