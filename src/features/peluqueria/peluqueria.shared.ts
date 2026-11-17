import type { PeluqueriaSchedule } from "./peluqueria.types";

// Cuantos dias hacia adelante se puede reservar (igual en el backend).
export const DAYS_AHEAD = 14;

export const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
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

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// Horarios de turno de un dia de la semana segun el horario de la peluqueria
// (varios tramos = turno cortado, ej. 9 a 14 y 16 a 22).
export function buildSlotsForWeekday(schedule: PeluqueriaSchedule, weekday: number): string[] {
  const slots: string[] = [];
  for (const [start, end] of schedule.days[String(weekday)] ?? []) {
    for (let minute = toMinutes(start); minute + schedule.slotMinutes <= toMinutes(end); minute += schedule.slotMinutes) {
      slots.push(toTime(minute));
    }
  }
  return slots;
}

export type SalonDay = {
  dateKey: string;
  weekday: number;
  weekdayLabel: string;
  dayNumber: number;
  monthLabel: string;
};

// Arma los proximos DAYS_AHEAD dias abiertos a partir de hoy (los dias sin
// tramos en el horario no se ofrecen).
export function buildUpcomingSalonDays(schedule: PeluqueriaSchedule, from: Date = new Date()): SalonDay[] {
  const days: SalonDay[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const openDays = Object.keys(schedule.days).length;
  if (openDays === 0) return days;

  for (let guard = 0; days.length < DAYS_AHEAD && guard < 60; guard++) {
    if (buildSlotsForWeekday(schedule, cursor.getDay()).length > 0) {
      days.push({
        dateKey: formatDateKey(cursor),
        weekday: cursor.getDay(),
        weekdayLabel: WEEKDAY_LABELS[cursor.getDay()],
        dayNumber: cursor.getDate(),
        monthLabel: MONTH_LABELS[cursor.getMonth()]
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

// Un turno de hoy que ya paso no se puede reservar.
export function isSlotInThePast(dateKey: string, time: string, now: Date = new Date()): boolean {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const slotDate = new Date(year, month - 1, day, hour, minute);
  return slotDate.getTime() <= now.getTime();
}
