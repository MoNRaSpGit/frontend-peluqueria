import { useCallback, useEffect, useState } from "react";
import { fetchReservations } from "./peluqueria.client";
import type { PeluqueriaReservation } from "./peluqueria.types";

// Panel del dueño de la peluqueria (version de demostracion, sin login).
// 17/11/2026: avisos DENTRO de la app -- un circulito rojo con la cantidad de
// reservas nuevas desde la ultima vez que las vio. No depende del permiso de
// notificaciones del navegador: lo que se "vio" se guarda en este celular.
const LAST_SEEN_KEY = "peluqueria.lastSeenReservationId";
const REFRESH_MS = 15_000;

function readLastSeen(): number {
  try {
    return Number(window.localStorage.getItem(LAST_SEEN_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function saveLastSeen(id: number) {
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, String(id));
  } catch {
    // sin almacenamiento: los avisos vuelven a aparecer, no pasa nada grave.
  }
}

export function PeluqueriaAdminPage() {
  const [reservations, setReservations] = useState<PeluqueriaReservation[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Lo "nuevo" se calcula contra lo ultimo que vio ANTES de entrar a esta visita:
  // durante la visita sigue resaltado, y apenas carga se guarda como visto, asi
  // la proxima vez que entre ya no aparece.
  const [lastSeenId] = useState(readLastSeen);

  const load = useCallback(() => {
    fetchReservations()
      .then((items) => {
        setReservations(items);
        const maxId = items.reduce((max, item) => Math.max(max, item.id), 0);
        if (maxId > readLastSeen()) saveLastSeen(maxId);
        setErrorMessage(null);
      })
      .catch(() => setErrorMessage("No se pudieron cargar las reservas."));
  }, []);

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
    <div className="peluqueria-page">
      <header className="peluqueria-header admin-header">
        <div>
          <h1>Reservas</h1>
          <p>Tu agenda de turnos.</p>
        </div>
        <div className="bell" aria-label={`${fresh.length} reservas nuevas`}>
          <span className="bell-icon" aria-hidden="true">
            🔔
          </span>
          {fresh.length > 0 ? <span className="bell-badge">{fresh.length > 99 ? "99+" : fresh.length}</span> : null}
        </div>
      </header>

      {fresh.length > 0 ? (
        <section className="fresh-card">
          <div className="fresh-card-head">
            <strong>
              {fresh.length === 1 ? "1 reserva nueva" : `${fresh.length} reservas nuevas`}
            </strong>
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
          <th>Peluquero</th>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Nombre</th>
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
              {freshIds.has(reservation.id) ? <span className="new-pill">NUEVA</span> : null}
            </td>
            <td>{reservation.clientPhone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
