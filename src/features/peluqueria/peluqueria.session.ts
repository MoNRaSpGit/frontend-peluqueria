import type { PeluqueriaOwner } from "./peluqueria.types";

// Todo lo que se guarda en el celular, en un solo lugar. Cada lectura/escritura
// va con try/catch: sin almacenamiento (modo privado) la app sigue andando.

// --- Sesion del dueño (token de su login) ---
const OWNER_KEY = "peluqueria.owner";
export type OwnerSession = { token: string; user: PeluqueriaOwner };

export function loadOwnerSession(): OwnerSession | null {
  try {
    const raw = window.localStorage.getItem(OWNER_KEY);
    return raw ? (JSON.parse(raw) as OwnerSession) : null;
  } catch {
    return null;
  }
}

export function saveOwnerSession(session: OwnerSession) {
  try {
    window.localStorage.setItem(OWNER_KEY, JSON.stringify(session));
  } catch {
    // sin almacenamiento
  }
}

export function clearOwnerSession() {
  try {
    window.localStorage.removeItem(OWNER_KEY);
  } catch {
    // sin almacenamiento
  }
}

// --- Cliente recordado en ESTE celular (nombre + celular, sin contraseña) ---
// Solo se usa para rellenar el formulario y preguntar "¿sos vos?": nunca para
// mostrar datos de nadie. Cada persona recuerda unicamente lo suyo.
const CLIENT_KEY = "peluqueria.client";
export type RememberedClient = { name: string; phone: string };

export function loadRememberedClient(): RememberedClient | null {
  try {
    const raw = window.localStorage.getItem(CLIENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<RememberedClient>;
    return data.name && data.phone ? { name: data.name, phone: data.phone } : null;
  } catch {
    return null;
  }
}

export function saveRememberedClient(client: RememberedClient) {
  try {
    window.localStorage.setItem(CLIENT_KEY, JSON.stringify(client));
  } catch {
    // sin almacenamiento
  }
}

export function clearRememberedClient() {
  try {
    window.localStorage.removeItem(CLIENT_KEY);
  } catch {
    // sin almacenamiento
  }
}

// --- Reservas nuevas ya vistas por el dueño (por peluqueria) ---
export function readLastSeen(salonSlug: string): number {
  try {
    return Number(window.localStorage.getItem(`peluqueria.lastSeen.${salonSlug}`) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function saveLastSeen(salonSlug: string, id: number) {
  try {
    window.localStorage.setItem(`peluqueria.lastSeen.${salonSlug}`, String(id));
  } catch {
    // sin almacenamiento
  }
}
