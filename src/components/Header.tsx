import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-[10px] px-2.5 py-2.5 text-[14px] font-bold transition sm:px-4 sm:text-[15px] ${
    isActive ? "bg-red text-white" : "text-ink hover:text-red"
  }`;

export default function Header() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-7 gap-y-3 px-4 py-3.5 sm:px-10">
        <Link to="/" className="no-underline">
          <span className="font-display text-[28px] tracking-wide text-red sm:text-[32px]">
            MC DECK BUILDER
          </span>
        </Link>

        <nav className="order-last flex w-full gap-1.5 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
          <NavLink to="/decks" end className={navClass}>
            Mazos
          </NavLink>
          <NavLink to="/decks/new" className={navClass}>
            Crear mazo
          </NavLink>
          <NavLink to="/" end className={navClass}>
            Cartas
          </NavLink>
          <NavLink to="/collection" className={navClass}>
            Colección
          </NavLink>
        </nav>

        <div ref={menuRef} className="ml-auto">
          {username ? (
            <div className="relative border-l-2 border-ink/15 pl-5">
              <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Menú de cuenta"
                className="flex min-h-12 items-center gap-2.5 rounded-full border-2 border-red bg-white py-1 pl-1 pr-3.5 shadow-comic-sm"
              >
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-ink bg-red">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                  </svg>
                </span>
                <span className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold tracking-[0.14em] text-red">MI CUENTA</span>
                  <span className="text-[15px] font-bold text-ink">{username}</span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {open && (
                <div
                  role="menu"
                  className="panel absolute right-0 top-[calc(100%+8px)] z-30 flex min-w-[220px] flex-col gap-1 rounded-[14px] p-2"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="flex min-h-11 items-center rounded-[10px] px-3.5 text-left text-[15px] font-bold text-danger hover:bg-amber-soft"
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary bg-red text-white">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
