import { useCallback, useEffect, useState } from "react";
import { SalonHeader } from "./components/SalonHeader";
import { SettingsPanel } from "./components/SettingsPanel";
import { ReservationsView } from "./components/ReservationsView";
import { ShareLinkCard } from "./components/ShareLinkCard";
import { UserMenu } from "./components/UserMenu";
import { fetchAdminReservations, PeluqueriaUnauthorizedError } from "./peluqueria.client";
import { readLastSeen, saveLastSeen, type OwnerSession } from "./peluqueria.session";
import type { PeluqueriaReservation, PeluqueriaSalon } from "./peluqueria.types";

// Panel del dueño de UNA peluqueria (el servidor solo le devuelve las reservas
// de su local). Avisos DENTRO de la app: un circulito rojo con la cantidad de
// reservas nuevas desde la ultima vez que entró; apenas carga, quedan marcadas
// como vistas. No depende de permisos del navegador.
const REFRESH_MS = 15_000;

export function PeluqueriaAdminPage({ salon, session, onLogout }: { salon: PeluqueriaSalon; session: OwnerSession; onLogout: () => void }) {
  const [reservations, setReservations] = useState<PeluqueriaReservation[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"reservas" | "link" | "config">("reservas");
  // "Nuevo" se calcula contra lo ultimo visto ANTES de esta visita: durante la
  // visita sigue resaltado y la proxima vez que entre ya no aparece.
  const [lastSeenId] = useState(() => readLastSeen(salon.slug));

  const load = useCallback(() => {
    fetchAdminReservations(session.token)
      .then((items) => {
        setReservations(items);
        setErrorMessage(null);
        const maxId = items.reduce((max, item) => Math.max(max, item.id), 0);
        if (maxId > readLastSeen(salon.slug)) saveLastSeen(salon.slug, maxId);
      })
      .catch((error) => {
        if (error instanceof PeluqueriaUnauthorizedError) onLogout();
        else setErrorMessage("No se pudieron cargar las reservas.");
      });
  }, [session.token, salon.slug, onLogout]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  const fresh = (reservations ?? []).filter((reservation) => reservation.id > lastSeenId);
  const freshIds = new Set(fresh.map((reservation) => reservation.id));

  return (
    <>
      <SalonHeader salon={salon} menu={<UserMenu username={session.user.username} onConfig={() => setTab("config")} onLogout={onLogout} />} />
      <div className="peluqueria-page">
        <header className="peluqueria-header admin-header">
          <div>
            <h1>{tab === "config" ? "Configuración" : tab === "link" ? "Link para clientes" : "Reservas"}</h1>
            <p>{tab === "config" ? "Tus peluqueros y tu horario." : tab === "link" ? "Lo que le mandás a tus clientes." : "Tu agenda de turnos."}</p>
          </div>
          <div className="admin-header-actions">
            <div className="bell" aria-label={`${fresh.length} reservas nuevas`}>
              <span className="bell-icon" aria-hidden="true">
                🔔
              </span>
              {fresh.length > 0 ? <span className="bell-badge">{fresh.length > 99 ? "99+" : fresh.length}</span> : null}
            </div>
          </div>
        </header>

        <nav className="admin-tabs" aria-label="Secciones">
          <button type="button" className={tab === "reservas" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setTab("reservas")}>
            Reservas
          </button>
          <button type="button" className={tab === "link" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setTab("link")}>
            Link
          </button>
        </nav>

        {tab === "link" ? <ShareLinkCard slug={salon.slug} salonName={salon.name} /> : null}

        {tab === "config" ? <SettingsPanel token={session.token} onUnauthorized={onLogout} /> : null}

        {tab === "reservas" && fresh.length > 0 ? (
          <p className="fresh-banner">
            🔔 <strong>{fresh.length === 1 ? "1 reserva nueva" : `${fresh.length} reservas nuevas`}</strong> desde tu última visita
          </p>
        ) : tab === "reservas" && reservations ? (
          <p className="status-text fresh-empty">✔ Estás al día, no hay reservas nuevas.</p>
        ) : null}

        {tab === "reservas" && errorMessage ? <p className="status-text status-error">{errorMessage}</p> : null}
        {tab === "reservas" && !reservations && !errorMessage ? <p className="status-text">Cargando...</p> : null}

        {tab === "reservas" && reservations ? (
          <ReservationsView reservations={reservations} freshIds={freshIds} salonName={salon.name} onGoToLink={() => setTab("link")} />
        ) : null}
      </div>
    </>
  );
}
