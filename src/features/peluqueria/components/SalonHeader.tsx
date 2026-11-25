import type { ReactNode } from "react";
import type { PeluqueriaSalon } from "../peluqueria.types";

// Cabecera con el logo del local, arriba de todas las pantallas de la clienta.
// Chica y centrada para que se vea sin molestar (el protagonista es el turno).
// Si el local todavia no tiene logo cargado, se ve un logo de ejemplo.
export function SalonHeader({ salon, menu }: { salon: Pick<PeluqueriaSalon, "name" | "logoUrl">; menu?: ReactNode }) {
  return (
    <div className="salon-header">
      <div className="salon-header-inner">
      <div className="salon-brand">
      {salon.logoUrl ? (
        <img className="salon-logo" src={salon.logoUrl} alt={salon.name} />
      ) : (
        <span className="salon-logo salon-logo--placeholder" aria-hidden="true">
          ✂️
        </span>
      )}
      <span className="salon-name">{salon.name}</span>
      </div>
      {menu ?? null}
      </div>
    </div>
  );
}
