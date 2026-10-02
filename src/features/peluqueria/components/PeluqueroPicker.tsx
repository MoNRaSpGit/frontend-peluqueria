import { PELUQUEROS } from "../peluqueria.types";

type PeluqueroPickerProps = {
  onSelect: (peluquero: string) => void;
};

// Paso 1 del flujo (02/10/2026, pedido explicito: "primero seleccionamos
// el peluquero... despues va al turno de ese peluquero"). Lista fija por
// ahora -- cada uno tiene su propia agenda independiente, ver
// peluqueria.client.ts#fetchBusySlots.
export function PeluqueroPicker({ onSelect }: PeluqueroPickerProps) {
  return (
    <div className="peluqueria-page">
      <header className="peluqueria-header">
        <h1>¿Con quién querés el turno?</h1>
        <p>Elegí un peluquero para ver sus horarios libres.</p>
      </header>

      <div className="peluquero-picker-list">
        {PELUQUEROS.map((peluquero) => (
          <button key={peluquero} type="button" className="peluquero-card" onClick={() => onSelect(peluquero)}>
            <span className="peluquero-card-avatar">{peluquero.charAt(0)}</span>
            <span className="peluquero-card-nombre">{peluquero}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
