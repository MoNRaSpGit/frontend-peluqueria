import { useEffect, useState } from "react";
import {
  addBarber,
  fetchAdminSettings,
  PeluqueriaUnauthorizedError,
  saveSchedule,
  updateBarber
} from "../peluqueria.client";
import type { PeluqueriaAdminSettings, PeluqueriaSchedule } from "../peluqueria.types";

// Lunes primero (como se lee una semana); la clave es el dia JS (0 = domingo).
const WEEK: Array<{ key: string; label: string }> = [
  { key: "1", label: "Lunes" },
  { key: "2", label: "Martes" },
  { key: "3", label: "Miércoles" },
  { key: "4", label: "Jueves" },
  { key: "5", label: "Viernes" },
  { key: "6", label: "Sábado" },
  { key: "0", label: "Domingo" }
];

const SLOT_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

// Configuracion del dueño: peluqueros (alta, nombre, activar/desactivar; no
// se borran para no perder el historial) y horario semanal con turnos de
// duracion elegible y hasta 2 tramos por dia (ej. 9-13 y 15-19).
export function SettingsPanel({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [settings, setSettings] = useState<PeluqueriaAdminSettings | null>(null);
  const [schedule, setSchedule] = useState<PeluqueriaSchedule | null>(null);
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const [newBarber, setNewBarber] = useState("");
  const [editNames, setEditNames] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function apply(next: PeluqueriaAdminSettings, keepSchedule = false) {
    setSettings(next);
    if (!keepSchedule) {
      setSchedule(next.schedule);
      setScheduleDirty(false);
    }
  }

  useEffect(() => {
    fetchAdminSettings(token)
      .then((data) => apply(data))
      .catch((error) => {
        if (error instanceof PeluqueriaUnauthorizedError) onUnauthorized();
        else setMessage({ kind: "error", text: "No se pudo cargar la configuración." });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function run(action: () => Promise<PeluqueriaAdminSettings>, okText: string, keepSchedule = false) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      apply(await action(), keepSchedule);
      setMessage({ kind: "ok", text: okText });
    } catch (error) {
      if (error instanceof PeluqueriaUnauthorizedError) onUnauthorized();
      else setMessage({ kind: "error", text: error instanceof Error ? error.message : "No se pudo guardar." });
    } finally {
      setBusy(false);
    }
  }

  function changeRange(day: string, index: number, position: 0 | 1, value: string) {
    setSchedule((current) => {
      if (!current) return current;
      const ranges = (current.days[day] ?? []).map((range) => [...range] as [string, string]);
      ranges[index][position] = value;
      return { ...current, days: { ...current.days, [day]: ranges } };
    });
    setScheduleDirty(true);
  }

  function toggleDay(day: string) {
    setSchedule((current) => {
      if (!current) return current;
      const days = { ...current.days };
      if (days[day]?.length) delete days[day];
      else days[day] = [["09:00", "19:00"]];
      return { ...current, days };
    });
    setScheduleDirty(true);
  }

  function addRange(day: string) {
    setSchedule((current) => {
      if (!current) return current;
      const ranges = [...(current.days[day] ?? [])];
      if (ranges.length >= 2) return current;
      ranges.push(["15:00", "19:00"]);
      return { ...current, days: { ...current.days, [day]: ranges } };
    });
    setScheduleDirty(true);
  }

  function removeRange(day: string, index: number) {
    setSchedule((current) => {
      if (!current) return current;
      const ranges = (current.days[day] ?? []).filter((_, position) => position !== index);
      const days = { ...current.days };
      if (ranges.length === 0) delete days[day];
      else days[day] = ranges;
      return { ...current, days };
    });
    setScheduleDirty(true);
  }

  if (!settings || !schedule) {
    return message ? <p className="status-text status-error">{message.text}</p> : <p className="status-text">Cargando...</p>;
  }

  return (
    <div className="settings-panel">
      {message ? <p className={`status-text ${message.kind === "error" ? "status-error" : "settings-ok"}`}>{message.text}</p> : null}

      <h2 className="admin-section-title">Peluqueros</h2>
      <ul className="settings-barbers">
        {settings.barbers.map((barber) => {
          const value = editNames[barber.id] ?? barber.name;
          const changed = value.trim() !== barber.name;
          return (
            <li key={barber.id} className={barber.active ? undefined : "settings-barber-off"}>
              <input
                type="text"
                value={value}
                maxLength={60}
                aria-label={`Nombre de ${barber.name}`}
                onChange={(event) => setEditNames((current) => ({ ...current, [barber.id]: event.target.value }))}
              />
              {changed ? (
                <button
                  type="button"
                  className="settings-btn"
                  disabled={busy}
                  onClick={() =>
                    run(() => updateBarber(token, barber.id, { name: value }), "Nombre guardado.", true).then(() =>
                      setEditNames((current) => {
                        const next = { ...current };
                        delete next[barber.id];
                        return next;
                      })
                    )
                  }
                >
                  Guardar
                </button>
              ) : null}
              <button
                type="button"
                className={`settings-btn ${barber.active ? "" : "settings-btn-on"}`}
                disabled={busy}
                onClick={() =>
                  run(
                    () => updateBarber(token, barber.id, { active: !barber.active }),
                    barber.active ? "Desactivado: ya no aparece para reservar." : "Activado: ya aparece para reservar.",
                    true
                  )
                }
              >
                {barber.active ? "Desactivar" : "Activar"}
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="settings-add"
        onSubmit={(event) => {
          event.preventDefault();
          if (!newBarber.trim()) return;
          void run(() => addBarber(token, newBarber), "Peluquero agregado.", true).then(() => setNewBarber(""));
        }}
      >
        <input type="text" value={newBarber} maxLength={60} placeholder="Nuevo peluquero (ej: Mati)" onChange={(event) => setNewBarber(event.target.value)} />
        <button type="submit" className="settings-btn settings-btn-primary" disabled={busy || !newBarber.trim()}>
          Agregar
        </button>
      </form>
      <p className="settings-hint">Los peluqueros no se borran: desactivarlos los saca del link pero conserva el historial de reservas.</p>

      <h2 className="admin-section-title">Horario</h2>
      <label className="settings-slot">
        <span>Cada turno dura</span>
        <select
          value={schedule.slotMinutes}
          onChange={(event) => {
            setSchedule({ ...schedule, slotMinutes: Number(event.target.value) });
            setScheduleDirty(true);
          }}
        >
          {SLOT_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} min
            </option>
          ))}
        </select>
      </label>

      <ul className="settings-days">
        {WEEK.map((day) => {
          const ranges = schedule.days[day.key] ?? [];
          const open = ranges.length > 0;
          return (
            <li key={day.key} className={open ? undefined : "settings-day-closed"}>
              <label className="settings-day-toggle">
                <input type="checkbox" checked={open} onChange={() => toggleDay(day.key)} />
                <span>{day.label}</span>
              </label>
              {open ? (
                <div className="settings-ranges">
                  {ranges.map((range, index) => (
                    <div className="settings-range" key={index}>
                      <input type="time" value={range[0]} aria-label={`${day.label} desde`} onChange={(event) => changeRange(day.key, index, 0, event.target.value)} />
                      <span>a</span>
                      <input type="time" value={range[1]} aria-label={`${day.label} hasta`} onChange={(event) => changeRange(day.key, index, 1, event.target.value)} />
                      {ranges.length > 1 ? (
                        <button type="button" className="settings-x" aria-label="Quitar tramo" onClick={() => removeRange(day.key, index)}>
                          ✕
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {ranges.length < 2 ? (
                    <button type="button" className="settings-link" onClick={() => addRange(day.key)}>
                      + Agregar otro tramo
                    </button>
                  ) : null}
                </div>
              ) : (
                <span className="settings-closed-text">Cerrado</span>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="settings-btn settings-btn-primary settings-save"
        disabled={busy || !scheduleDirty}
        onClick={() => run(() => saveSchedule(token, schedule), "Horario guardado. Ya lo ven tus clientes.")}
      >
        Guardar horario
      </button>
      <p className="settings-hint">Los turnos que ya están reservados no se tocan, aunque cambies el horario.</p>
    </div>
  );
}
