// Horario de atencion por defecto (facil de ajustar mas adelante, pedido
// explicito: "por ahora eso, luego lo vamos a ir mejorando"): lunes a
// sabado, turnos de una hora, de 9 a 19 (el ultimo turno arranca a las
// 18, termina a las 19).
export const SALON_OPEN_HOUR = 9;
export const SALON_CLOSE_HOUR = 19;
export const SALON_CLOSED_WEEKDAY = 0; // domingo (Date#getDay(): 0 = domingo)
export const DAYS_AHEAD = 14;

export const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
export const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTimeSlot(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export type SalonDay = {
  dateKey: string;
  weekdayLabel: string;
  dayNumber: number;
  monthLabel: string;
};

// Arma los proximos DAYS_AHEAD dias habiles (sin domingos) a partir de
// hoy, para que el cliente elija uno y vea los turnos de esa fecha.
export function buildUpcomingSalonDays(from: Date = new Date()): SalonDay[] {
  const days: SalonDay[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  while (days.length < DAYS_AHEAD) {
    if (cursor.getDay() !== SALON_CLOSED_WEEKDAY) {
      days.push({
        dateKey: formatDateKey(cursor),
        weekdayLabel: WEEKDAY_LABELS[cursor.getDay()],
        dayNumber: cursor.getDate(),
        monthLabel: MONTH_LABELS[cursor.getMonth()]
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function buildDaySlots(): string[] {
  const slots: string[] = [];
  for (let hour = SALON_OPEN_HOUR; hour < SALON_CLOSE_HOUR; hour++) {
    slots.push(formatTimeSlot(hour));
  }
  return slots;
}

// Un turno de hoy que ya paso no se puede reservar (pedido implicito: no
// tiene sentido mostrar como "libre" las 9 de la manana si ya son las 3
// de la tarde).
export function isSlotInThePast(dateKey: string, time: string, now: Date = new Date()): boolean {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const slotDate = new Date(year, month - 1, day, hour, minute);
  return slotDate.getTime() <= now.getTime();
}
