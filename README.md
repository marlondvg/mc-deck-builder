# MC Deck Builder

Marvel Champions LCG deck builder front end. React + TypeScript + Vite + Tailwind,
using the public [MarvelCDB API](https://marvelcdb.com/api/doc).

## Run

```bash
npm install
npm run dev
```

## Structure

- `src/api/` — typed MarvelCDB client and TanStack Query hooks (cards cached for a day)
- `src/pages/` — Browse cards, card detail, collection (placeholder), login (mock)
- `src/components/` — header with user dropdown ("Mi colección" / "Salir"), card tile
- `src/lib/` — mock auth context, aspect colors

## Roadmap

1. Collection page: choose owned packs (localStorage, then backend)
2. Filter browsing by owned packs
3. Deck builder (hero selection, deck-rule validation, save)
4. Backend + real authentication

All card texts and images are copyrighted by Fantasy Flight Games.
