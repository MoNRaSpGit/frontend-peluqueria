import { useEffect, useRef, useState } from "react";
import { fetchPublishedFrontendBuildMeta, FRONTEND_BUILD_INFO } from "../config/build";

const UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 10 * 1000;
// Sin tocar nada durante este tiempo (y sin estar escribiendo) = "no la
// estan usando": la actualizacion se hace sola, sin pedir nada.
const IDLE_BEFORE_AUTO_UPDATE_MS = 45 * 1000;
const APP_CACHE_PREFIX = "reservas-";
const LEGACY_CACHE_PREFIX = "peluqueria-";
// Cuanto tarda la barra en llenarse. La limpieza real es mas rapida; la barra
// existe para que se VEA el cartel de Logic Lab y no parezca un parpadeo raro.
const PROGRESS_DURATION_MS = 2200;
const PROGRESS_TICK_MS = 40;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "input", "wheel"] as const;

// Desregistra el service worker y borra el cache de la app: el reload que
// sigue trae la version nueva.
async function clearAppCache() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const appBasePath = new URL(import.meta.env.BASE_URL, window.location.href).pathname;
      await Promise.all(registrations.filter((registration) => registration.scope.includes(appBasePath)).map((registration) => registration.unregister()));
    }
    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(APP_CACHE_PREFIX) || key.startsWith(LEGACY_CACHE_PREFIX)).map((key) => window.caches.delete(key)));
    }
  } catch {
    // Si la limpieza falla, igual se recarga: es lo que trae la version nueva.
  }
}

function isTyping() {
  const active = document.activeElement;
  return !!active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT");
}

// Actualizaciones (25/11/2026, pedido explicito):
// - Si hay version nueva y la estan USANDO (tocaron algo hace poco o estan
//   escribiendo): cartel "Hay una nueva actualizacion" y deciden ellos.
// - Si NO la estan usando: se actualiza sola, sin que nadie haga nada.
// - En los dos casos, mientras se actualiza sale la pantalla de Logic Lab
//   con la barra de progreso.
export function AppUpdateNotice() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const startedRef = useRef(false);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, markActivity, { passive: true });
    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, markActivity);
    };
  }, []);

  function runUpdate() {
    if (startedRef.current) return;
    startedRef.current = true;
    setProgress(0);

    const cleanup = clearAppCache();
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const next = Math.min(100, Math.round(((Date.now() - startedAt) / PROGRESS_DURATION_MS) * 100));
      setProgress(next);
      if (next >= 100) {
        window.clearInterval(intervalId);
        // Se recarga recien con la barra llena Y la limpieza terminada.
        void cleanup.then(() => window.location.reload());
      }
    }, PROGRESS_TICK_MS);
  }

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let mounted = true;

    const checkForUpdates = async () => {
      try {
        const published = await fetchPublishedFrontendBuildMeta();
        if (mounted && published.releaseSha && published.releaseSha !== FRONTEND_BUILD_INFO.releaseSha) {
          setUpdateAvailable(true);
        }
      } catch {
        // Silencioso: se reintenta solo en el proximo chequeo.
      }
    };

    void checkForUpdates();
    const intervalId = window.setInterval(() => void checkForUpdates(), UPDATE_CHECK_INTERVAL_MS);
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") void checkForUpdates();
    };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Con una version nueva esperando: si dejaron de usarla, se actualiza sola.
  useEffect(() => {
    if (!updateAvailable) return;
    const evaluate = () => {
      const idle = Date.now() - lastActivityRef.current >= IDLE_BEFORE_AUTO_UPDATE_MS && !isTyping();
      if (idle) runUpdate();
    };
    evaluate();
    const intervalId = window.setInterval(evaluate, IDLE_CHECK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAvailable]);

  if (progress !== null) {
    return (
      <div className="update-overlay" role="status" aria-live="polite">
        <div className="update-overlay-card">
          <img src={`${import.meta.env.BASE_URL}LogoLogicLab.png`} alt="Logic Lab" />
          <strong>{progress < 100 ? "Actualizando la aplicación…" : "¡Listo!"}</strong>
          <div className="update-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="update-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      </div>
    );
  }

  if (!updateAvailable) return null;

  return (
    <aside className="update-banner" role="status" aria-live="polite">
      <strong>Hay una nueva actualización</strong>
      <button type="button" className="update-banner-button" onClick={runUpdate}>
        Actualizar
      </button>
    </aside>
  );
}
