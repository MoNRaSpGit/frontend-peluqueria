import { useCallback, useEffect, useState } from "react";
import { SalonHeader } from "./components/SalonHeader";
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

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcoming = reservations?.filter((reservation) => reservation.date >= todayKey) ?? [];
  const past = reservations?.filter((reservation) => reservation.date < todayKey) ?? [];

  return (
    <>
      <SalonHeader salon={salon} />
      <div className="peluqueria-page">
        <header className="peluqueria-header admin-header">
          <div>
            <h1>Reservas</h1>
            <p>Tu agenda de turnos.</p>
          </div>
          <div className="admin-header-actions">
            <div className="bell" aria-label={`${fresh.length} reservas nuevas`}>
              <span className="bell-icon" aria-hidden="true">
                🔔
              </span>
              {fresh.length > 0 ? <span className="bell-badge">{fresh.length > 99 ? "99+" : fresh.length}</span> : null}
            </div>
            <button type="button" className="logout-button" onClick={onLogout}>
              Salir
            </button>
          </div>
        </header>

        {fresh.length > 0 ? (
          <section className="fresh-card">
            <div className="fresh-card-head">
              <strong>{fresh.length === 1 ? "1 reserva nueva" : `${fresh.length} reservas nuevas`}</strong>
            </div>
            <ul className="fresh-list">
              {fresh.map((reservation) => (
                <li key={reservation.id}>
                  <span className="fresh-time">
                    {reservation.date.slice(8, 10)}/{reservation.date.slice(5, 7)} · {reservation.time}
                  </span>
                  <span>
                    <strong>{reservation.clientName}</strong> con {reservation.peluquero}
                  </span>
                  <span className="fresh-phone">{reservation.clientPhone}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : reservations ? (
          <p className="status-text fresh-empty">✔ Estás al día, no hay reservas nuevas.</p>
        ) : null}

        {errorMessage ? <p className="status-text status-error">{errorMessage}</p> : null}
        {!reservations && !errorMessage ? <p className="status-text">Cargando...</p> : null}

        {reservations ? (
          <>
            <h2 className="admin-section-title">Próximos ({upcoming.length})</h2>
            <ReservationTable reservations={upcoming} emptyText="No hay turnos reservados." freshIds={freshIds} />

            {past.length > 0 ? (
              <>
                <h2 className="admin-section-title">Pasados ({past.length})</h2>
                <ReservationTable reservations={past} emptyText="" freshIds={freshIds} />
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}

function ReservationTable({
  reservations,
  emptyText,
  freshIds
}: {
  reservations: PeluqueriaReservation[];
  emptyText: string;
  freshIds: Set<number>;
}) {
  if (reservations.length === 0) {
    return <p className="status-text">{emptyText}</p>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Profesional</th>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Cliente</th>
          <th>Celular</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((reservation) => (
          <tr key={reservation.id} className={freshIds.has(reservation.id) ? "row-fresh" : undefined}>
            <td>{reservation.peluquero}</td>
            <td>{reservation.date}</td>
            <td>{reservation.time}</td>
            <td>
              {reservation.clientName}
              {reservation.clientVisits > 1 ? <span className="visits-pill">{reservation.clientVisits}ª visita</span> : null}
              {freshIds.has(reservation.id) ? <span className="new-pill">NUEVA</span> : null}
            </td>
            <td>{reservation.clientPhone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
