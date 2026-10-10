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

**Mi colección (`CollectionPage`, `lib/collection.ts`)**
- Página para marcar los packs que tiene el usuario, agrupados por año de publicación, con buscador y "Marcar/Desmarcar todos" (o solo los mostrados).
- Se guarda en `localStorage` por usuario (`mcdb:collection:<usuario>`) con el hook `useCollection()`, y se sincroniza entre pestañas.
- Opción "Solo cartas de mi colección" en el menú Opciones de la lista (`mine=1`), visible solo con sesión iniciada. Una reimpresión en un pack propio cuenta como tener la carta.

**Constructor de mazos, fase 1 (`NewDeckPage`, `DeckEditorPage`, `DecksPage`, `lib/deckRules.ts`, `lib/decks.ts`)**
- Crear mazo (`/decks/new`): elegir héroe (por defecto solo los de la colección, con casilla para ver todos) y aspecto. Pool lo puede elegir cualquier héroe.
- Editor (`/decks/:id`): buscador con solo las cartas legales para el mazo (aspecto + Basic), por defecto solo las de la colección con casilla "Mostrar todas las cartas"; +/− por carta con su límite (`deck_limit`); cartas del héroe fijas; contador 40–50; avisos de reglas. Se guarda solo. En móvil, pestañas Cartas / Mazo.
- Mis mazos (`/decks`): lista con héroe, aspecto, cartas y marca "Inválido". Los mazos inválidos se pueden guardar.
- Se guarda en `localStorage` por usuario (`mcdb:decks:<usuario>`) con el formato de MarvelCDB (`heroCode`, `slots`). Hace falta iniciar sesión.
- El campo de reimpresiones de la API es `duplicate_of_code` (no `duplicate_of`).

**Constructor de mazos, fase 2 (`lib/deckRules.ts`, `components/CostCurve.tsx`)**
- Héroes especiales, según `deck_requirements` y `deck_options` de la carta de héroe: Spider-Woman (2 aspectos con el mismo número de cartas), Adam Warlock (los 4 aspectos, mismo número de cartas, 1 copia de cada carta), Gamora (hasta 6 eventos Attack/Thwart de otros aspectos), Cyclops (aliados X-Men), Cable (planes secundarios de jugador), Maria Hill (3 apoyos S.H.I.E.L.D. distintos) y Wonder Man (eventos con recurso de energía). Las cartas permitidas por el héroe salen marcadas "Extra".
- Límite de copias por título (nombre), no por código.
- Curva de coste y, si el usuario marcó packs, "Tienes N" en cada carta y un aviso cuando el mazo usa más copias de las que tiene (no invalida el mazo).

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

1. **Constructor de mazos, fase 3:** Mis mazos con duplicar y borrar, y exportar el mazo como texto.
2. **Backend y login real:** Spring Boot es el stack principal de Marlon. Usuario y contraseña, colección y mazos por usuario. Reemplazar `lib/auth.tsx` y pasar la colección y los mazos (`lib/userStore.ts`) al backend.
