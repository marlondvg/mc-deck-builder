# MC Deck Builder: estado del proyecto y próximos pasos

Resumen para retomar el trabajo en Claude Code. Fecha: 10 de octubre de 2026.

## Qué es

Sitio fan para armar mazos de **Marvel Champions LCG**, inspirado en MarvelCDB, con un estilo más moderno tipo cómic. Usa la API pública de MarvelCDB, sin backend propio por ahora.

- **Repositorio:** https://github.com/marlondvg/mc-deck-builder (público, rama `main`)
- **Producción:** https://mc-deck-builder.vercel.app/ (Vercel despliega solo con cada push a `main`)
- **Local:** `~/Projects/mc-deck-builder` → `npm install && npm run dev`
- **Stack:** Vite + React 19 + TypeScript + Tailwind v4 (`@tailwindcss/vite`), React Router 7, TanStack Query 5
- **Diseño:** canvas "Deck Builder" en claude.ai con la paleta **Petróleo + ámbar**: barra petróleo `#0f4c5c`, ámbar `#ffb703`, fondo gris `#e2e6e8` con puntos, tinta `#141414`, bordes negros con sombra dura. Fuentes de UI: Anton (títulos) y Space Grotesk (texto). Textos de la interfaz en español.

## Estructura

```
src/
  api/         marvelcdb.ts (fetch), hooks.ts (TanStack Query, caché 1 día), types.ts (Card, Pack)
  components/  Header (menú de cuenta: "Mi colección" / "Salir"), CardTile, CardModal,
               CardDetails, CardText, Dropdown (+ CheckRow), MultiSelect
  lib/         auth.tsx (login simulado en localStorage), factions.ts (colores y orden de aspectos),
               reprints.ts (agrupar reimpresiones), sorting.ts (opciones de orden)
  pages/       CardsPage (lista principal), CardDetailPage (/card/:code), CollectionPage (placeholder),
               LoginPage (simulado)
vercel.json    rewrite SPA → /index.html
```

## Lo que ya está hecho (en `main`)

**Lista de cartas (`CardsPage`)**
- Grid con la imagen completa de cada carta, sin recorte ni márgenes.
- Al hacer clic se abre una **ventana emergente** con el detalle (`?card=CODE` en la URL) y se mantienen los filtros. Se cierra con Esc, con clic fuera o con Atrás, y las flechas pasan a la carta anterior o siguiente.
- Búsqueda por nombre, rasgos o texto.
- Filtros de **selección múltiple** para Aspectos (con color), Tipos y Packs (con buscador). En la URL van separados por comas, p. ej. `?faction=aggression,justice`.
- Menú **Opciones** con casillas, definido en la lista `OPTIONS` de `CardsPage.tsx`:
  - Incluir cartas de encuentro (`encounter=1`)
  - Mostrar cartas sin imagen (`noimg=1`); por defecto se ocultan
  - Mostrar reimpresiones con arte nuevo (`reprints=1`); por defecto solo se ve la primera versión publicada. Las reimpresiones se agrupan por nombre, subtítulo, tipo, aspecto y texto, y el orden de publicación sale de la fecha y posición de cada pack.
- Menú **Ordenar** igual al de MarvelCDB: tipo, nombre, número, coste, set y luego nombre/tipo/número, aspecto y luego nombre/tipo/coste/número. Por defecto ordena por **aspecto y luego tipo** (`?sort=…`).
- Orden de aspectos: Aggression, Justice, Protection, Leadership, Basic, Pool, Hero, Campaign, Encounter.
- Colores de aspecto: Aggression `#c8161d`, Justice `#f5e11a`, Leadership `#22a3cc`, Protection `#3fa535`, Basic `#a3a3a3`, Pool `#ff3d7f`, Hero naranja `#ff8a00`, Campaign morado `#7b3fe4`.
- "Limpiar filtros" no toca las Opciones ni el orden.

**Detalle de carta (`CardDetails`, `CardText`)**
- El texto de reglas se renderiza sin `dangerouslySetInnerHTML`:
  - `<b>`, `<i>` y `<br>` se convierten en negrilla, cursiva y saltos de línea.
  - `[[Rasgo]]` sale en la fuente de rasgos.
  - Los tokens `[energy]`, `[mental]`, `[physical]` y `[wild]` salen como **etiquetas de color**. `[star]` sale como estrella.
- Fuentes de la carta, que son comerciales: se usan si están instaladas y si no, alternativas gratuitas de Google Fonts.
  - Texto: Avenir Next → Nunito Sans
  - Rasgos: Komika Title → Bangers
  - Frase de ambientación: Komika Text → Comic Neue
  - Nombre: Exo 2 en versalitas
  - Números de las estadísticas: Elektra → Exo 2
  - Etiquetas de las estadísticas: Futura → Jost
- Estrella de **única** antes del nombre (campo `is_unique`).
- Etiquetas en fila: aspecto, tipo, "Recurso:" con los recursos que genera la carta (`resource_*`) y "Pack:".
- Estadísticas en recuadros de color como en la carta: coste con el color del aspecto, THW azul, ATK rojo, DEF verde y HP naranja. Número blanco con borde y sombra dura abajo a la izquierda; etiqueta en un recuadro negro inclinado con borde blanco abajo y a la derecha (clase `.stat-label-box` en `index.css`).
- **Daño consecuente** (`thwart_cost`, `attack_cost`): estrellas negras con borde blanco dentro de la etiqueta de THW y ATK.
- **Estrella de estadística** (`cost_star`, `thwart_star`, `attack_star`, `defense_star`, `health_star`) junto al número, como el "3★" de Bombshell.
- El texto de ambientación va dentro del mismo recuadro que el texto de reglas.

## Forma de trabajo acordada con Marlon

- Commits a nombre de **Marlon Vera <marlondvg@gmail.com>**.
- Cambios en una rama `feature/...`. Se pasa a `main` solo cuando Marlon lo aprueba, y antes se le muestran los cambios.
- **Borrar las ramas `feature/*` cuando ya estén en `main`.**
- Antes de proponer un commit, correr `npx tsc --noEmit` (o `npm run build`).

## Decisiones y límites

- **Íconos oficiales (recursos y sets):** son diseños de FFG. MarvelCDB no tiene licencia visible y la política de FFG de 2024 prohíbe su propiedad intelectual en "software applications". Por eso se usan **etiquetas de color** y no hay ícono de set. Si se quieren los íconos exactos: extraer la fuente de iconos de MarvelCDB (DevTools o `git clone github.com/zzorba/marvelsdb`), pedir permiso a sus autores, alojarla en `/public/fonts` y añadir un aviso de "sitio fan no oficial".
- **Fuente Komika:** sus autores la ofrecen gratis, pero falta verificar la licencia para web antes de alojarla.
- Los nombres de campo `is_unique`, `attack_cost`, `thwart_cost` y `*_star` están verificados contra el JSON real de la API.

## Próximos pasos

1. **Mi colección:** página para marcar los packs que tiene el usuario, guardados primero en `localStorage` y luego en el backend.
2. **Filtro "Solo mi colección"** en la lista de cartas, como una opción más en `OPTIONS`.
3. **Constructor de mazos:**
   - Elegir héroe y aspecto, y agregar o quitar cartas.
   - Validar las reglas del mazo: 40–50 cartas, límites por carta y cartas del héroe obligatorias.
   - Mostrar contadores por tipo y coste, y guardar el mazo.
4. **Mis mazos:** lista de los mazos guardados.
5. **Backend y login real:** Spring Boot es el stack principal de Marlon. Usuario y contraseña, colección y mazos por usuario. Reemplazar `lib/auth.tsx`.
6. Pendientes menores:
   - Aviso de "sitio fan no oficial, no afiliado a FFG" en el pie de página.
