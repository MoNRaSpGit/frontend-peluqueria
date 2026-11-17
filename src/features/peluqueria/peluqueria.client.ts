import { API_BASE_URL } from "../../shared/config/api";
import type { PeluqueriaBusySlot, PeluqueriaOwner, PeluqueriaReservation, PeluqueriaSalon } from "./peluqueria.types";

export class PeluqueriaSlotTakenError extends Error {}
export class PeluqueriaSalonNotFoundError extends Error {}
export class PeluqueriaUnauthorizedError extends Error {}

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1/peluqueria${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function readMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    return (Array.isArray(data.message) ? data.message[0] : data.message) || fallback;
  } catch {
    return fallback;
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchSalon(slug: string): Promise<PeluqueriaSalon> {
  const response = await fetch(buildUrl(`/salons/${encodeURIComponent(slug)}`));
  if (response.status === 404) throw new PeluqueriaSalonNotFoundError("Peluquería no encontrada");
  if (!response.ok) throw new Error("No se pudo cargar la peluquería.");
  return readJson<PeluqueriaSalon>(response);
}

export async function fetchBusySlots(slug: string, barberId: number, from: string, to: string): Promise<PeluqueriaBusySlot[]> {
  const response = await fetch(buildUrl(`/salons/${encodeURIComponent(slug)}/busy-slots?barberId=${barberId}&from=${from}&to=${to}`));
  if (!response.ok) throw new Error("No se pudieron cargar los horarios ocupados.");
  return readJson<PeluqueriaBusySlot[]>(response);
}

export async function createReservation(
  slug: string,
  input: { barberId: number; date: string; time: string; clientName: string; clientPhone: string }
): Promise<void> {
  const response = await fetch(buildUrl(`/salons/${encodeURIComponent(slug)}/reservations`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (response.status === 409) {
    throw new PeluqueriaSlotTakenError("Ese horario ya fue reservado. Elegí otro.");
  }
  if (!response.ok) {
    throw new Error(await readMessage(response, "No se pudo guardar la reserva. Probá de nuevo."));
  }
}

export async function loginOwner(username: string, password: string): Promise<{ user: PeluqueriaOwner; token: string }> {
  const response = await fetch(buildUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    throw new Error(await readMessage(response, "No se pudo iniciar sesión."));
  }
  return readJson<{ user: PeluqueriaOwner; token: string }>(response);
}

export async function logoutOwner(token: string): Promise<void> {
  await fetch(buildUrl("/auth/logout"), { method: "POST", headers: authHeaders(token) }).catch(() => undefined);
}

export async function fetchAdminReservations(token: string): Promise<PeluqueriaReservation[]> {
  const response = await fetch(buildUrl("/admin/reservations"), { headers: authHeaders(token) });
  if (response.status === 401) throw new PeluqueriaUnauthorizedError("Sesión vencida");
  if (!response.ok) throw new Error("No se pudieron cargar las reservas.");
  return readJson<PeluqueriaReservation[]>(response);
}
