import { useEffect, useState } from "react";
import { fetchReservations } from "./peluqueria.client";
import type { PeluqueriaReservation } from "./peluqueria.types";

// Vista de solo lectura para el dueno de la peluqueria (01/10/2026,
// pedido explicito: sin login por ahora). No se puede cancelar ni editar
// todavia -- "por ahora eso, luego lo vamos a ir mejorando".
export function PeluqueriaAdminPage() {
  const [reservations, setReservations] = useState<PeluqueriaReservation[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations()
      .then(setReservations)
      .catch(() => setErrorMessage("No se pudieron cargar las reservas."));
  }, []);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcoming = reservations?.filter((reservation) => reservation.date >= todayKey) ?? [];
  const past = reservations?.filter((reservation) => reservation.date < todayKey) ?? [];

  return (
    <div className="peluqueria-page">
      <header className="peluqueria-header">
        <h1>Reservas</h1>
        <p>Listado de turnos reservados.</p>
      </header>

      {errorMessage ? <p className="status-text status-error">{errorMessage}</p> : null}
      {!reservations && !errorMessage ? <p className="status-text">Cargando...</p> : null}

      {reservations ? (
        <>
          <h2 className="admin-section-title">Proximos ({upcoming.length})</h2>
          <ReservationTable reservations={upcoming} emptyText="No hay turnos reservados." />

          {past.length > 0 ? (
            <>
              <h2 className="admin-section-title">Pasados ({past.length})</h2>
              <ReservationTable reservations={past} emptyText="" />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ReservationTable({ reservations, emptyText }: { reservations: PeluqueriaReservation[]; emptyText: string }) {
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
          <tr key={reservation.id}>
            <td>{reservation.peluquero}</td>
            <td>{reservation.date}</td>
            <td>{reservation.time}</td>
            <td>{reservation.clientName}</td>
            <td>{reservation.clientPhone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
