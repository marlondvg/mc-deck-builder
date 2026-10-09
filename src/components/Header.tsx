import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive ? "bg-marvel text-white" : "text-ink/70 hover:bg-ink/5"
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
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="rounded bg-marvel px-2 py-0.5 font-display text-2xl leading-none tracking-wide text-white">
            MC
          </span>
          <span className="font-display text-2xl tracking-wide">Deck Builder</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>
            Cards
          </NavLink>
          {/* Decks link arrives with the deck builder */}
        </nav>

        <div className="ml-auto" ref={menuRef}>
          {username ? (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium hover:border-marvel"
              >
                {username}
                <span aria-hidden className="text-xs">▾</span>
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg"
                >
                  <Link
                    role="menuitem"
                    to="/collection"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-ink/5"
                  >
                    Mi colección
                  </Link>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-marvel-dark hover:bg-ink/5"
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-marvel px-4 py-1.5 text-sm font-semibold text-white hover:bg-marvel-dark"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
