import { useEffect, useState } from "react";
import { PeluqueriaAdminPage } from "./PeluqueriaAdminPage";
import { PeluqueriaHomePage } from "./PeluqueriaHomePage";
import { PeluqueriaLoginPage } from "./PeluqueriaLoginPage";
import { SalonHeader } from "./components/SalonHeader";
import { fetchSalon, logoutOwner, PeluqueriaSalonNotFoundError } from "./peluqueria.client";
import { clearOwnerSession, loadOwnerSession, saveOwnerSession, type OwnerSession } from "./peluqueria.session";
import type { PeluqueriaSalon } from "./peluqueria.types";

// Ruteo por hash (GitHub Pages no sirve rutas de verdad):
//   #/<local>          -> la clienta reserva su turno en ese local
//   #/<local>/admin    -> panel del dueño de ese local (con login)
// Sin hash se abre el local de demostracion, asi el link de siempre sigue
// funcionando. "#admin" (el link viejo) tambien cae en el demo.
const DEFAULT_SLUG = "demo";

type Route = { slug: string; admin: boolean };

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash === "admin") return { slug: DEFAULT_SLUG, admin: true };
  const [slug, section] = hash.split("/");
  return { slug: slug?.trim().toLowerCase() || DEFAULT_SLUG, admin: section === "admin" };
}

type SalonState = { status: "loading" } | { status: "notFound" } | { status: "error" } | { status: "ready"; salon: PeluqueriaSalon };

export function PeluqueriaApp() {
  const [route, setRoute] = useState(readRoute());
  const [salonState, setSalonState] = useState<SalonState>({ status: "loading" });
  const [session, setSession] = useState<OwnerSession | null>(loadOwnerSession);

  useEffect(() => {
    function handleHashChange() {
      setRoute(readRoute());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSalonState({ status: "loading" });
    fetchSalon(route.slug)
      .then((salon) => {
        if (!cancelled) setSalonState({ status: "ready", salon });
      })
      .catch((error) => {
        if (!cancelled) setSalonState({ status: error instanceof PeluqueriaSalonNotFoundError ? "notFound" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [route.slug]);

  function handleLoggedIn(next: OwnerSession) {
    saveOwnerSession(next);
    setSession(next);
    // Si el usuario es de OTRA peluqueria, se lo manda a la suya.
    if (next.user.salonSlug !== route.slug) window.location.hash = `#/${next.user.salonSlug}/admin`;
  }

  function handleLogout() {
    if (session) void logoutOwner(session.token);
    clearOwnerSession();
    setSession(null);
  }

  if (salonState.status === "loading") {
    return (
      <div className="peluqueria-page">
        <p className="status-text">Cargando…</p>
      </div>
    );
  }
  if (salonState.status === "notFound" || salonState.status === "error") {
    return (
      <div className="peluqueria-page">
        <header className="peluqueria-header">
          <h1>{salonState.status === "notFound" ? "No encontramos esa peluquería" : "No se pudo cargar"}</h1>
          <p>
            {salonState.status === "notFound"
              ? "Revisá que el link esté bien escrito."
              : "Revisá tu conexión y recargá la página."}
          </p>
        </header>
      </div>
    );
  }

  const { salon } = salonState;

  if (route.admin) {
    const isOwnerOfThisSalon = session && session.user.salonSlug === salon.slug;
    return isOwnerOfThisSalon ? (
      <PeluqueriaAdminPage salon={salon} session={session} onLogout={handleLogout} />
    ) : (
      <PeluqueriaLoginPage salon={salon} onLoggedIn={handleLoggedIn} />
    );
  }

  return (
    <>
      <SalonHeader salon={salon} />
      <PeluqueriaHomePage salon={salon} />
    </>
  );
}
