import { LOGO_SRC, SALON_NAME } from "../peluqueria.brand";

// Cabecera con el logo del local, arriba de todas las pantallas del cliente.
// Chica y centrada para que se vea sin molestar (el protagonista es el turno).
export function SalonHeader() {
  return (
    <div className="salon-header">
      {LOGO_SRC ? (
        <img className="salon-logo" src={`${import.meta.env.BASE_URL}${LOGO_SRC}`} alt={SALON_NAME} />
      ) : (
        <span className="salon-logo salon-logo--placeholder" aria-hidden="true">
          ✂️
        </span>
      )}
      <span className="salon-name">{SALON_NAME}</span>
    </div>
  );
}
