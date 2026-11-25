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

// MODO DEMO TEMPORAL (25/11/2026, pedido explicito): el panel muestra SOLO la
// proxima reserva de cada peluquero, aunque haya mas, para no llenar la
// pantalla de tarjetas mientras se muestra. NO toca la base ni la pantalla de
// reservar (ahi los horarios ocupados siguen todos tachados). Para volver a
// mostrar todo: poner DEMO_ONE_PER_BARBER en false (o borrar este bloque).
const DEMO_ONE_PER_BARBER = true;

function keepNextPerBarber(items: PeluqueriaReservation[]): PeluqueriaReservation[] {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const next = new Map<string, PeluqueriaReservation>();
  for (const item of items) {
    if (item.date < todayKey) continue;
    const current = next.get(item.peluquero);
    if (!current || `${item.date} ${item.time}` < `${current.date} ${current.time}`) next.set(item.peluquero, item);
  }
  return [...next.values()];
}

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

  const visibleReservations = reservations && DEMO_ONE_PER_BARBER ? keepNextPerBarber(reservations) : reservations;
  const fresh = (visibleReservations ?? []).filter((reservation) => reservation.id > lastSeenId);
  const freshIds = new Set(fresh.map((reservation) => reservation.id));

  const ownerName = session.user.username.charAt(0).toUpperCase() + session.user.username.slice(1);
  const nowDate = new Date();
  const todayKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}-${String(nowDate.getDate()).padStart(2, "0")}`;
  const todayCount = (reservations ?? []).filter((reservation) => reservation.date === todayKey).length;
  const todaySummary = !reservations ? "Cargando tu agenda…" : todayCount === 0 ? "Hoy no tenés turnos. ¡Buen momento para mandar tu link!" : todayCount === 1 ? "Hoy tenés 1 turno." : `Hoy tenés ${todayCount} turnos.`;

  return (
    <>
      <SalonHeader salon={salon} menu={<UserMenu username={session.user.username} onConfig={() => setTab("config")} onLogout={onLogout} />} />
      <div className="peluqueria-page">
        <header className={tab === "reservas" ? "peluqueria-header admin-header welcome-hero" : "peluqueria-header admin-header"}>
          {tab === "reservas" ? (
            <div className="welcome-text">
              <span className="welcome-hello">¡Hola, {ownerName}! 👋</span>
              <h1>
                Bienvenido a <span className="grad">{salon.name}</span>
              </h1>
              <p>{todaySummary}</p>
            </div>
          ) : (
            <div>
              <h1>{tab === "config" ? "Configuración" : "Link para clientes"}</h1>
              <p>{tab === "config" ? "Tus peluqueros y tu horario." : "Lo que le mandás a tus clientes."}</p>
            </div>
          )}
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
          <ReservationsView reservations={visibleReservations ?? reservations} freshIds={freshIds} salonName={salon.name} onGoToLink={() => setTab("link")} />
        ) : null}
      </div>
    </>
  );
}
