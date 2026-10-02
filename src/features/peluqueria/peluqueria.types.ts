// Lista fija por ahora (02/10/2026, pedido explicito: "por ahora eso") --
// mismo listado en el backend (peluqueria.types.ts).
export const PELUQUEROS = ["Brian", "María", "Juan"] as const;
export type Peluquero = (typeof PELUQUEROS)[number];

export type PeluqueriaReservation = {
  id: number;
  peluquero: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  createdAt: string;
};

export type PeluqueriaBusySlot = {
  date: string;
  time: string;
};
