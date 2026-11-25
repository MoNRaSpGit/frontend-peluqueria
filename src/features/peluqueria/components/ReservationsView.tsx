import type { PeluqueriaReservation } from "../peluqueria.types";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function dateKeyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "Hoy", "Mañana" o "Jue 26 nov": como lo diria el dueño.
function dayTitle(key: string, todayKey: string, tomorrowKey: string) {
  const date = parseKey(key);
  const long = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  if (key === todayKey) return { main: "Hoy", sub: long };
  if (key === tomorrowKey) return { main: "Mañana", sub: long };
  return { main: long, sub: "" };
}

// Celular uruguayo -> formato de wa.me: "099123456" => "59899123456".
function whatsappNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `598${digits.slice(1)}`;
  else if (digits.length === 8 && digits.startsWith("9")) digits = `598${digits}`;
  return digits;
}

function groupByDay(items: PeluqueriaReservation[]) {
  const groups = new Map<string, PeluqueriaReservation[]>();
  for (const item of items) {
    const list = groups.get(item.date) ?? [];
    list.push(item);
    groups.set(item.date, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function ReservationCard({ reservation, salonName, isFresh, showBarber }: { reservation: PeluqueriaReservation; salonName: string; isFresh: boolean; showBarber: boolean }) {
  const date = parseKey(reservation.date);
  const label = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  const message = `Hola ${reservation.clientName}, te escribimos de ${salonName} por tu turno del ${label} a las ${reservation.time}.`;
  const whatsappUrl = `https://wa.me/${whatsappNumber(reservation.clientPhone)}?text=${encodeURIComponent(message)}`;

  return (
    <li className={isFresh ? "res-card res-card-fresh" : "res-card"}>
      <div className="res-time">{reservation.time}</div>
      <div className="res-info">
        <strong className="res-name">
          {reservation.clientName}
          {isFresh ? <span className="new-pill">NUEVA</span> : null}
        </strong>
        <span className="res-meta">
          {reservation.clientPhone}
          {showBarber ? ` · con ${reservation.peluquero}` : ""}
          {reservation.clientVisits > 1 ? ` · ${reservation.clientVisits}ª visita` : ""}
        </span>
      </div>
      <div className="res-actions">
        <a className="res-btn res-btn-wa" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Escribirle a ${reservation.clientName} por WhatsApp`}>
          WhatsApp
        </a>
        <a className="res-btn" href={`tel:${reservation.clientPhone.replace(/[^\d+]/g, "")}`} aria-label={`Llamar a ${reservation.clientName}`}>
          Llamar
        </a>
      </div>
    </li>
  );
}

// Reservas del dueño pensadas para el celular: agrupadas por dia (Hoy, Mañana,
// ...), una tarjeta por turno con la hora bien grande y botones para escribirle
// o llamarle al cliente. Los dias pasados quedan plegados al final.
export function ReservationsView({
  reservations,
  freshIds,
  salonName,
  onGoToLink
}: {
  reservations: PeluqueriaReservation[];
  freshIds: Set<number>;
  salonName: string;
  onGoToLink: () => void;
}) {
  const now = new Date();
  const todayKey = dateKeyOf(now);
  const tomorrowKey = dateKeyOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const barbers = new Set(reservations.map((reservation) => reservation.peluquero));
  const showBarber = barbers.size > 1;

  const upcoming = reservations.filter((reservation) => reservation.date >= todayKey);
  const past = reservations.filter((reservation) => reservation.date < todayKey);
  const upcomingGroups = groupByDay(upcoming).map(([key, items]) => [key, items.sort((a, b) => a.time.localeCompare(b.time))] as const);
  const pastGroups = groupByDay(past).reverse();

  if (reservations.length === 0) {
    return (
      <div className="res-empty">
        <strong>Todavía no hay turnos</strong>
        <span>Cuando tus clientes reserven, los vas a ver acá. Mandales tu link para que empiecen.</span>
        <button type="button" className="settings-btn settings-btn-primary" onClick={onGoToLink}>
          Ver mi link
        </button>
      </div>
    );
  }

  return (
    <div className="res-view">
      {upcomingGroups.length === 0 ? <p className="status-text">No hay turnos próximos.</p> : null}
      {upcomingGroups.map(([key, items]) => {
        const title = dayTitle(key, todayKey, tomorrowKey);
        return (
          <section key={key} className="res-day">
            <h2 className="res-day-title">
              <span>{title.main}</span>
              {title.sub ? <small>{title.sub}</small> : null}
              <em>{items.length === 1 ? "1 turno" : `${items.length} turnos`}</em>
            </h2>
            <ul className="res-list">
              {items.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} salonName={salonName} isFresh={freshIds.has(reservation.id)} showBarber={showBarber} />
              ))}
            </ul>
          </section>
        );
      })}

      {past.length > 0 ? (
        <details className="res-past">
          <summary>Pasados ({past.length})</summary>
          {pastGroups.map(([key, items]) => {
            const title = dayTitle(key, todayKey, tomorrowKey);
            return (
              <section key={key} className="res-day">
                <h2 className="res-day-title">
                  <span>{title.main}</span>
                  <em>{items.length === 1 ? "1 turno" : `${items.length} turnos`}</em>
                </h2>
                <ul className="res-list">
                  {items
                    .slice()
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((reservation) => (
                      <ReservationCard key={reservation.id} reservation={reservation} salonName={salonName} isFresh={false} showBarber={showBarber} />
                    ))}
                </ul>
              </section>
            );
          })}
        </details>
      ) : null}
    </div>
  );
}
