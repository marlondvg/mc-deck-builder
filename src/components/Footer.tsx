/** Site footer with the unofficial fan site notice. */
export default function Footer() {
  return (
    <footer className="border-t-[3px] border-ink bg-white">
      <div className="mx-auto max-w-7xl space-y-1.5 px-4 py-6 text-sm text-muted sm:px-10">
        <p>
          <strong className="text-ink">Sitio fan no oficial.</strong> MC Deck Builder no está
          afiliado, respaldado ni patrocinado por Fantasy Flight Games ni por Marvel.
        </p>
        <p>
          Marvel Champions: The Card Game, sus cartas e imágenes son propiedad de Fantasy Flight
          Games y Marvel. Datos e imágenes de las cartas:{" "}
          <a
            href="https://marvelcdb.com"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-red hover:underline"
          >
            MarvelCDB
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
