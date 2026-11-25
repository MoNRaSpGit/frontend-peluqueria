import type { ReactNode } from "react";
import type { PeluqueriaSalon } from "../peluqueria.types";

// Cabecera con el logo del local, arriba de todas las pantallas de la clienta.
// Chica y centrada para que se vea sin molestar (el protagonista es el turno).
// Si el local todavia no tiene logo cargado, se ve el icono generico de la app (calendario con reloj).
export function SalonHeader({ salon, menu }: { salon: Pick<PeluqueriaSalon, "name" | "logoUrl">; menu?: ReactNode }) {
  return (
    <div className="salon-header">
      <div className="salon-header-inner">
      <div className="salon-brand">
      {salon.logoUrl ? (
        <img className="salon-logo" src={salon.logoUrl} alt={salon.name} />
      ) : (
        <img className="salon-logo" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
      )}
      <span className="salon-name">{salon.name}</span>
      </div>
      {menu ?? null}
      </div>
    </div>
  );
}
