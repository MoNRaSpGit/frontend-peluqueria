import { useEffect, useState } from "react";
import { PeluqueriaAdminPage } from "./PeluqueriaAdminPage";
import { PeluqueriaHomePage } from "./PeluqueriaHomePage";

// Ruteo por hash en vez de rutas de verdad (ej. react-router): GitHub
// Pages no sabe servir /admin directo (404 al refrescar), pero #admin
// siempre cae en el mismo index.html. Solo dos pantallas por ahora.
function readRoute(): "home" | "admin" {
  return window.location.hash === "#admin" ? "admin" : "home";
}

export function PeluqueriaApp() {
  const [route, setRoute] = useState(readRoute());

  useEffect(() => {
    function handleHashChange() {
      setRoute(readRoute());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route === "admin" ? <PeluqueriaAdminPage /> : <PeluqueriaHomePage />;
}
