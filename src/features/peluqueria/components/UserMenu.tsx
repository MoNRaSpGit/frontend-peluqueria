import { useEffect, useRef, useState } from "react";

// Logo del usuario arriba a la derecha: al tocarlo se abre un menu con
// Configuracion y Cerrar sesion.
export function UserMenu({ username, onConfig, onLogout }: { username: string; onConfig: () => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={rootRef}>
      <button type="button" className="user-menu-button" aria-haspopup="menu" aria-expanded={open} aria-label="Menú del usuario" onClick={() => setOpen((current) => !current)}>
        {username.charAt(0).toUpperCase()}
      </button>
      {open ? (
        <div className="user-menu-panel" role="menu">
          <span className="user-menu-name">{username}</span>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onConfig();
            }}
          >
            ⚙️ Configuración
          </button>
          <button
            type="button"
            role="menuitem"
            className="user-menu-danger"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            ↩ Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
