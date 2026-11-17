import { API_BASE_URL } from "../../shared/config/api";

// Avisos push al celular del dueño (17/11/2026). Version de demostracion sin
// login: el celular que toca "Activar avisos" queda suscripto y recibe una
// notificacion por cada reserva nueva.
function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  // El service worker solo se registra en el build de produccion (main.tsx).
  return navigator.serviceWorker.ready;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await getRegistration();
  return registration.pushManager.getSubscription();
}

export type EnablePushResult = "ok" | "denied" | "unsupported" | "unavailable";

export async function enablePush(): Promise<EnablePushResult> {
  if (!isPushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const keyResponse = await fetch(buildUrl("/peluqueria/push/public-key"));
  const { publicKey } = (await keyResponse.json()) as { publicKey: string | null };
  if (!publicKey) return "unavailable";

  const registration = await getRegistration();
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));

  const json = subscription.toJSON();
  const response = await fetch(buildUrl("/peluqueria/push/subscribe"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys })
  });
  if (!response.ok) throw new Error("No se pudo guardar la suscripcion.");
  return "ok";
}

export async function disablePush(): Promise<void> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;
  await fetch(buildUrl("/peluqueria/push/unsubscribe"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  }).catch(() => undefined);
  await subscription.unsubscribe();
}

export async function sendTestPush(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return false;
  const response = await fetch(buildUrl("/peluqueria/push/test"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });
  if (!response.ok) return false;
  const data = (await response.json()) as { ok: boolean };
  return data.ok;
}
