import { useEffect, useState } from "react";
import { disablePush, enablePush, getCurrentSubscription, isPushSupported, sendTestPush } from "../peluqueria.push";

// Tarjeta "Avisos en este celular" del panel del dueño: activa/desactiva las
// notificaciones de reservas nuevas y permite mandar una de prueba.
export function PushAlertsCard() {
  const [supported] = useState(isPushSupported());
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [permission, setPermission] = useState<string>(isPushSupported() ? Notification.permission : "no disponible");

  useEffect(() => {
    if (!supported) return;
    getCurrentSubscription()
      .then((subscription) => setActive(Boolean(subscription) && Notification.permission === "granted"))
      .catch(() => undefined);
  }, [supported]);

  async function handleEnable() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await enablePush();
      if (result === "ok") {
        setActive(true);
        setMessage("¡Listo! Mandamos una notificación de prueba.");
        await sendTestPush();
      } else if (result === "denied") {
        setMessage("El navegador tiene bloqueadas las notificaciones de este sitio. Para permitirlas: tocá el ícono a la izquierda de la dirección → Permisos → Notificaciones → Permitir. Después recargá la página y tocá Activar avisos de nuevo.");
      } else if (result === "unavailable") {
        setMessage("Los avisos todavía no están disponibles en el servidor.");
      } else {
        setMessage("Este navegador no permite notificaciones.");
      }
    } catch {
      setMessage("No se pudieron activar los avisos. Probá de nuevo.");
    } finally {
      if (isPushSupported()) setPermission(Notification.permission);
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setMessage(null);
    try {
      await disablePush();
      setActive(false);
      setMessage("Avisos desactivados en este celular.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    setMessage((await sendTestPush()) ? "Te mandamos una notificación de prueba." : "No se pudo mandar la prueba.");
    setBusy(false);
  }

  return (
    <section className="push-card">
      <div>
        <h2 className="push-card-title">🔔 Avisos en este celular</h2>
        <p className="push-card-text">
          {!supported
            ? "Este navegador no permite notificaciones. En iPhone, agregá la app a la pantalla de inicio."
            : active
              ? "Activados: te llega una notificación por cada reserva nueva."
              : "Activalos y te llega una notificación cada vez que alguien reserva un turno."}
        </p>
        {message ? <p className="push-card-message">{message}</p> : null}
        <p className="push-card-text">
          Permiso del navegador: {permission === "granted" ? "permitido" : permission === "denied" ? "bloqueado" : permission === "default" ? "sin elegir (te va a preguntar)" : permission}
        </p>
      </div>
      {supported ? (
        <div className="push-card-actions">
          {active ? (
            <>
              <button type="button" className="ghost-button" onClick={() => void handleTest()} disabled={busy}>
                Probar
              </button>
              <button type="button" className="ghost-button" onClick={() => void handleDisable()} disabled={busy}>
                Desactivar
              </button>
            </>
          ) : (
            <button type="button" className="primary-button" onClick={() => void handleEnable()} disabled={busy}>
              {busy ? "Activando…" : "Activar avisos"}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
