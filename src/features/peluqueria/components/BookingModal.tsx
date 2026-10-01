import { useState, type FormEvent } from "react";

type BookingModalProps = {
  dateLabel: string;
  time: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: (clientName: string, clientPhone: string) => void;
};

export function BookingModal({ dateLabel, time, isSubmitting, errorMessage, onCancel, onConfirm }: BookingModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || isSubmitting) return;
    onConfirm(clientName.trim(), clientPhone.trim());
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
        <h2 id="booking-modal-title">Reservar turno</h2>
        <p className="modal-slot-summary">
          {dateLabel} a las <strong>{time}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <label className="modal-field">
            <span>Nombre</span>
            <input
              type="text"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Tu nombre"
              autoFocus
              disabled={isSubmitting}
            />
          </label>

          <label className="modal-field">
            <span>Celular</span>
            <input
              type="tel"
              value={clientPhone}
              onChange={(event) => setClientPhone(event.target.value)}
              placeholder="099123456"
              disabled={isSubmitting}
            />
          </label>

          {errorMessage ? <p className="modal-error">{errorMessage}</p> : null}

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting || !clientName.trim() || !clientPhone.trim()}>
              {isSubmitting ? "Reservando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
