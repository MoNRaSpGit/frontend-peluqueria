import { API_BASE_URL } from "../../shared/config/api";
import type { PeluqueriaBusySlot, PeluqueriaReservation } from "./peluqueria.types";

export class PeluqueriaSlotTakenError extends Error {}

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function fetchBusySlots(peluquero: string, from: string, to: string): Promise<PeluqueriaBusySlot[]> {
  const response = await fetch(
    buildUrl(`/peluqueria/busy-slots?peluquero=${encodeURIComponent(peluquero)}&from=${from}&to=${to}`)
  );
  if (!response.ok) throw new Error("No se pudieron cargar los horarios ocupados.");
  return readJson<PeluqueriaBusySlot[]>(response);
}

export async function fetchReservations(): Promise<PeluqueriaReservation[]> {
  const response = await fetch(buildUrl("/peluqueria/reservations"));
  if (!response.ok) throw new Error("No se pudieron cargar las reservas.");
  return readJson<PeluqueriaReservation[]>(response);
}

export async function createReservation(input: {
  peluquero: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
}): Promise<PeluqueriaReservation> {
  const response = await fetch(buildUrl("/peluqueria/reservations"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (response.status === 409) {
    throw new PeluqueriaSlotTakenError("Ese horario ya fue reservado. Elegi otro.");
  }
  if (!response.ok) {
    throw new Error("No se pudo guardar la reserva. Proba de nuevo.");
  }

  return readJson<PeluqueriaReservation>(response);
}
