import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PeluqueriaApp } from "./features/peluqueria/PeluqueriaApp";
import "./styles/global.css";

// PWA (02/10/2026): solo en produccion -- en dev el service worker viejo
// quedaria cacheando contra el propio servidor de Vite y daria mas
// problemas que soluciones (mismo criterio que frontend-gym).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PeluqueriaApp />
  </StrictMode>
);
