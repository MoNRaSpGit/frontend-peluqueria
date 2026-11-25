// Horario semanal de una peluqueria. days: clave = dia de la semana
// (0 = domingo ... 6 = sabado); un dia sin clave esta cerrado y puede tener
// varios tramos (turno cortado). Lo edita el dueño (proximamente).
export type PeluqueriaSchedule = {
  slotMinutes: number;
  days: Record<string, Array<[string, string]>>;
};

export type PeluqueriaBarber = { id: number; name: string };

export type PeluqueriaSalon = {
  slug: string;
  name: string;
  logoUrl: string | null;
  barbers: PeluqueriaBarber[];
  schedule: PeluqueriaSchedule;
};

export type PeluqueriaReservation = {
  id: number;
  barberId: number | null;
  peluquero: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientVisits: number;
  createdAt: string;
};

export type PeluqueriaBusySlot = {
  date: string;
  time: string;
};

export type PeluqueriaOwner = {
  id: number;
  username: string;
  salonId: number;
  salonSlug: string;
  salonName: string;
};

export type PeluqueriaAdminSettings = {
  schedule: PeluqueriaSchedule;
  barbers: Array<{ id: number; name: string; active: boolean }>;
};
