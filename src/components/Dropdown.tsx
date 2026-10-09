import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface Props {
  /** Text on the trigger button. */
  label: ReactNode;
  /** Highlights the trigger when a value is selected. */
  active?: boolean;
  /** Panel alignment under the trigger. */
  align?: "left" | "right";
  /** Panel content, or a function that receives `close` (for menus that close on pick). */
  children: ReactNode | ((close: () => void) => ReactNode);
}

/** Button that opens a panel below it. Closes on outside click and Esc. */
export default function Dropdown({ label, active, align = "left", children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`field flex items-center gap-2 font-medium ${active ? "bg-amber-soft" : ""}`}
      >
        <span className="max-w-[200px] truncate">{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          id={panelId}
          className={`panel absolute top-[calc(100%+8px)] z-30 w-72 max-w-[calc(100vw-32px)] rounded-[14px] p-2 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

/** A checkbox row for use inside a Dropdown panel. */
export function CheckRow(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-[10px] px-3 text-[15px] hover:bg-amber-soft">
      <input
        type="checkbox"
        className="h-[18px] w-[18px] shrink-0 accent-petrol"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className="flex min-w-0 items-center gap-2">{props.children}</span>
    </label>
  );
}
