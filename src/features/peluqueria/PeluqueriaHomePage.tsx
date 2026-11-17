import { useEffect, useMemo, useState } from "react";
import { BookingModal } from "./components/BookingModal";
import { PeluqueroPicker } from "./components/PeluqueroPicker";
import { createReservation, fetchBusySlots, PeluqueriaSlotTakenError } from "./peluqueria.client";
import { saveRememberedClient } from "./peluqueria.session";
import { buildSlotsForWeekday, buildUpcomingSalonDays, isSlotInThePast } from "./peluqueria.shared";
import type { PeluqueriaBarber, PeluqueriaSalon } from "./peluqueria.types";

export function PeluqueriaHomePage({ salon }: { salon: PeluqueriaSalon }) {
  // Paso 1: elegir peluquero (null = todavia no eligio, se muestra el
  // picker). Paso 2: calendario de ESE peluquero. Paso 3 (BookingModal):
  // confirmar nombre y celular (si el celular ya la conoce, solo pregunta
  // "¿sos vos?").
  const [selectedBarber, setSelectedBarber] = useState<PeluqueriaBarber | null>(null);

  const salonDays = useMemo(() => buildUpcomingSalonDays(salon.schedule), [salon.schedule]);
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
    if (!selectedBarber || !firstDateKey || !lastDateKey) return;
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);

    fetchBusySlots(salon.slug, selectedBarber.id, firstDateKey, lastDateKey)
      .then((slots) => {
        if (cancelled) return;
        setBusySlots(new Set(slots.map((slot) => `${slot.date} ${slot.time}`)));
      })
      .catch(() => {
        if (!cancelled) setLoadError("No se pudieron cargar los horarios. Recargá la página.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Se vuelve a cargar al elegir peluquero y cada vez que se confirma
    // una reserva (ver handleConfirmBooking), via confirmedMessage.
  }, [salon.slug, selectedBarber, firstDateKey, lastDateKey, confirmedMessage]);

  const selectedDay = salonDays.find((day) => day.dateKey === selectedDateKey);
  const daySlots = useMemo(() => (selectedDay ? buildSlotsForWeekday(salon.schedule, selectedDay.weekday) : []), [salon.schedule, selectedDay]);

  function handleOpenBooking(time: string) {
    setBookingError(null);
    setConfirmedMessage(null);
    setBookingSlot(time);
  }

  async function handleConfirmBooking(clientName: string, clientPhone: string) {
    if (!selectedBarber || !selectedDay || !bookingSlot) return;
    setIsSubmitting(true);
    setBookingError(null);

    try {
      await createReservation(salon.slug, {
        barberId: selectedBarber.id,
        date: selectedDay.dateKey,
        time: bookingSlot,
        clientName,
        clientPhone
      });
      // El celular se acuerda de ella/el para la proxima vez.
      saveRememberedClient({ name: clientName, phone: clientPhone });
      setConfirmedMessage(
        `🎉 ¡Listo, ${clientName}! Tu turno con ${selectedBarber.name} quedó para el ${selectedDay.dayNumber} de ${selectedDay.monthLabel} a las ${bookingSlot}. ¡Te esperamos!`
      );
      setBookingSlot(null);
    } catch (error) {
      setBookingError(error instanceof PeluqueriaSlotTakenError || error instanceof Error ? error.message : "No se pudo guardar la reserva. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!selectedBarber) {
    return <PeluqueroPicker barbers={salon.barbers} onSelect={setSelectedBarber} />;
  }

  return (
    <div className="peluqueria-page">
      <button type="button" className="back-link" onClick={() => setSelectedBarber(null)}>
        ← Cambiar peluquero
      </button>

      <header className="peluqueria-header">
        <h1>
          Turno con <span className="grad">{selectedBarber.name}</span>
        </h1>
        <p>Elegí el día y tocá un horario libre.</p>
      </header>

      {confirmedMessage ? <p className="confirmed-banner">{confirmedMessage}</p> : null}

      {salonDays.length === 0 ? <p className="status-text">Esta peluquería todavía no cargó sus horarios.</p> : null}

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
        <p className="status-text">Cargando horarios…</p>
      ) : loadError ? (
        <p className="status-text status-error">{loadError}</p>
      ) : (
        <>
          <p className="slots-title">
            Horarios del {selectedDay?.weekdayLabel.toLowerCase()} {selectedDay?.dayNumber}
          </p>
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
        </>
      )}

      {bookingSlot && selectedDay ? (
        <BookingModal
          dateLabel={`${selectedDay.weekdayLabel} ${selectedDay.dayNumber} de ${selectedDay.monthLabel}`}
          time={bookingSlot}
          barberName={selectedBarber.name}
          isSubmitting={isSubmitting}
          errorMessage={bookingError}
          onCancel={() => setBookingSlot(null)}
          onConfirm={handleConfirmBooking}
        />
      ) : null}
    </div>
  );
}
