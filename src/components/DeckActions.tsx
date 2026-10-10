import { useEffect, useRef, useState } from "react";

const BASE = "inline-flex min-h-9 items-center rounded-lg border-2 border-ink px-3 text-sm font-bold";
const BUTTON = `${BASE} bg-white hover:bg-amber-soft`;

/** Dialog with the deck as text, to copy or download. */
function ExportDialog({ name, text, onClose }: { name: string; text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    areaRef.current?.select();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard blocked: leave the text selected so the user can copy it.
      areaRef.current?.select();
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[\\/:*?"<>|]+/g, "").trim() || "mazo"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="panel flex max-h-full w-full max-w-xl flex-col gap-3 p-5"
      >
        <h2 id="export-title" className="font-display text-3xl uppercase tracking-wide">
          Exportar mazo
        </h2>
        <textarea
          ref={areaRef}
          readOnly
          value={text}
          aria-label="Mazo en texto"
          className="field h-80 min-h-40 resize-y py-2 font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="btn-primary bg-red text-white">
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
          <button type="button" onClick={download} className="btn-secondary">
            Descargar .txt
          </button>
          <button type="button" onClick={onClose} className="btn-secondary ml-auto">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Export / duplicate / delete buttons for a deck. Delete asks for
 * confirmation in place before doing anything.
 */
export default function DeckActions(props: {
  name: string;
  /** Builds the export text; when missing there is no export button. */
  exportText?: () => string;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2" role="alert">
        <span className="text-sm font-bold">¿Borrar "{props.name}"? No se puede deshacer.</span>
        <button
          type="button"
          onClick={props.onDelete}
          className={`${BASE} bg-red text-white hover:brightness-95`}
        >
          Sí, borrar
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={BUTTON}>
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {props.exportText && (
        <button type="button" onClick={() => setExporting(props.exportText!())} className={BUTTON}>
          Exportar
        </button>
      )}
      <button type="button" onClick={props.onDuplicate} className={BUTTON}>
        Duplicar
      </button>
      <button type="button" onClick={() => setConfirming(true)} className={`${BUTTON} text-danger`}>
        Borrar
      </button>
      {exporting !== null && (
        <ExportDialog name={props.name} text={exporting} onClose={() => setExporting(null)} />
      )}
    </div>
  );
}
