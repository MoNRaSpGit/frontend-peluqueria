import type { PeluqueriaBarber } from "../peluqueria.types";

type PeluqueroPickerProps = {
  barbers: PeluqueriaBarber[];
  onSelect: (barber: PeluqueriaBarber) => void;
};

// Paso 1 del flujo: elegir peluquero. Cada uno tiene su propia agenda
// independiente (ver peluqueria.client.ts#fetchBusySlots).
export function PeluqueroPicker({ barbers, onSelect }: PeluqueroPickerProps) {
  return (
    <div className="peluqueria-page">
      <header className="peluqueria-header">
        <h1>
          ¿Con quién <span className="grad">te cortás</span> hoy?
        </h1>
        <p>Elegí con quién querés tu turno y mirá los horarios libres.</p>
      </header>

      {barbers.length === 0 ? <p className="status-text">Este local todavía no cargó a su equipo.</p> : null}

      <div className="peluquero-picker-list">
        {barbers.map((barber) => (
          <button key={barber.id} type="button" className="peluquero-card" onClick={() => onSelect(barber)}>
            <span className="peluquero-card-avatar">{barber.name.charAt(0)}</span>
            <span className="peluquero-card-nombre">{barber.name}</span>
            <span className="peluquero-card-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
