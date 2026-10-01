import { useEffect, useMemo, useState } from "react";
import { BookingModal } from "./components/BookingModal";
import { createReservation, fetchBusySlots, PeluqueriaSlotTakenError } from "./peluqueria.client";
import { buildDaySlots, buildUpcomingSalonDays, isSlotInThePast } from "./peluqueria.shared";

export function PeluqueriaHomePage() {
  const salonDays = useMemo(() => buildUpcomingSalonDays(), []);
  const daySlots = useMemo(() => buildDaySlots(), []);
  const [selectedDateKey, setSelectedDateKey] = useState(salonDays[0]?.dateKey ?? "");
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null);

  const firstDateKey = salonDays[0]?.dateKey;
  const lastDateKey = salonDays[salonDays.length - 1]?.dateKey;

  useEffect(() => {
    if (!firstDateKey || !lastDateKey) return;
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);

    fetchBusySlots(firstDateKey, lastDateKey)
      .then((slots) => {
        if (cancelled) return;
        setBusySlots(new Set(slots.map((slot) => `${slot.date} ${slot.time}`)));
      })
      .catch(() => {
        if (!cancelled) setLoadError("No se pudieron cargar los horarios. Recarga la pagina.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Se vuelve a cargar cada vez que se confirma una reserva (ver
    // handleConfirmBooking), via el cambio de confirmedMessage.
  }, [firstDateKey, lastDateKey, confirmedMessage]);

  const selectedDay = salonDays.find((day) => day.dateKey === selectedDateKey);

  function handleOpenBooking(time: string) {
    setBookingError(null);
    setConfirmedMessage(null);
    setBookingSlot(time);
  }

  async function handleConfirmBooking(clientName: string, clientPhone: string) {
    if (!selectedDay || !bookingSlot) return;
    setIsSubmitting(true);
    setBookingError(null);

    try {
      await createReservation({ date: selectedDay.dateKey, time: bookingSlot, clientName, clientPhone });
      setConfirmedMessage(`Listo, ${clientName}! Tu turno quedo reservado para el ${selectedDay.dayNumber} de ${selectedDay.monthLabel} a las ${bookingSlot}.`);
      setBookingSlot(null);
    } catch (error) {
      if (error instanceof PeluqueriaSlotTakenError) {
        setBookingError(error.message);
      } else {
        setBookingError("No se pudo guardar la reserva. Proba de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="peluqueria-page">
      <header className="peluqueria-header">
        <h1>Reservar turno</h1>
        <p>Elegi un dia y un horario libre.</p>
      </header>

      {confirmedMessage ? <p className="confirmed-banner">{confirmedMessage}</p> : null}

      <div className="day-picker">
        {salonDays.map((day) => (
          <button
            key={day.dateKey}
            type="button"
            className={day.dateKey === selectedDateKey ? "day-chip day-chip-active" : "day-chip"}
            onClick={() => setSelectedDateKey(day.dateKey)}
          >
            <span className="day-chip-weekday">{day.weekdayLabel.slice(0, 3)}</span>
            <span className="day-chip-number">{day.dayNumber}</span>
            <span className="day-chip-month">{day.monthLabel.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="status-text">Cargando horarios...</p>
      ) : loadError ? (
        <p className="status-text status-error">{loadError}</p>
      ) : (
        <div className="slots-grid">
          {daySlots.map((time) => {
            const isPast = selectedDay ? isSlotInThePast(selectedDay.dateKey, time) : false;
            const isBusy = selectedDay ? busySlots.has(`${selectedDay.dateKey} ${time}`) : false;
            const isDisabled = isPast || isBusy;

            return (
              <button
                key={time}
                type="button"
                className={isDisabled ? "slot-button slot-button-disabled" : "slot-button"}
                disabled={isDisabled}
                onClick={() => handleOpenBooking(time)}
              >
                {time}
                {isBusy && !isPast ? <span className="slot-busy-label">Ocupado</span> : null}
              </button>
            );
          })}
        </div>
      )}

      {bookingSlot && selectedDay ? (
        <BookingModal
          dateLabel={`${selectedDay.weekdayLabel} ${selectedDay.dayNumber} de ${selectedDay.monthLabel}`}
          time={bookingSlot}
          isSubmitting={isSubmitting}
          errorMessage={bookingError}
          onCancel={() => setBookingSlot(null)}
          onConfirm={handleConfirmBooking}
        />
      ) : null}
    </div>
  );
}
