import { useEffect, useRef, type ReactNode } from "react";
import { useCard } from "../api/hooks";
import type { Card } from "../api/types";
import CardDetails from "./CardDetails";

interface Props {
  code: string;
  /** Card from the already-loaded list; when missing, it is fetched by code. */
  card?: Card;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function IconButton(props: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      onClick={props.onClick}
      className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-white shadow-comic-sm hover:bg-amber"
    >
      {props.children}
    </button>
  );
}

const icon = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "#141414",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export default function CardModal({ code, card: listCard, onClose, onPrev, onNext }: Props) {
  // Only hit the API when the card isn't in the loaded list.
  const { data: fetched, isLoading, isError } = useCard(listCard ? undefined : code);
  const card = listCard ?? fetched;
  const closeRef = useRef<HTMLButtonElement>(null);

  // Keyboard: Esc closes, arrows move between cards of the current results.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // Lock page scroll behind the modal and move focus into it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        className="panel relative my-auto w-full max-w-5xl rounded-[20px] p-5 shadow-[8px_8px_0_#141414] sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {onPrev && (
              <IconButton label="Carta anterior" onClick={onPrev}>
                <svg {...icon}><path d="M15 18l-6-6 6-6" /></svg>
              </IconButton>
            )}
            {onNext && (
              <IconButton label="Carta siguiente" onClick={onNext}>
                <svg {...icon}><path d="M9 18l6-6-6-6" /></svg>
              </IconButton>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar"
            title="Cerrar (Esc)"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-amber shadow-comic-sm hover:brightness-95"
          >
            <svg {...icon}><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {card ? (
          <CardDetails card={card} titleId="card-modal-title" />
        ) : isLoading ? (
          <p id="card-modal-title" className="py-16 text-center text-muted">Cargando carta…</p>
        ) : (
          isError && (
            <p id="card-modal-title" className="py-16 text-center text-muted">
              No se encontró esa carta.
            </p>
          )
        )}
      </div>
    </div>
  );
}
