import { useState, type FormEvent } from "react";
import { SalonHeader } from "./components/SalonHeader";
import { loginOwner } from "./peluqueria.client";
import type { OwnerSession } from "./peluqueria.session";
import type { PeluqueriaSalon } from "./peluqueria.types";

// Entrada al panel del dueño. El usuario y la contraseña los crea Logic Lab al
// dar de alta la peluqueria; cada usuario ve solo las reservas de su local.
export function PeluqueriaLoginPage({ salon, onLoggedIn }: { salon: Pick<PeluqueriaSalon, "name" | "logoUrl">; onLoggedIn: (session: OwnerSession) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !username.trim() || !password.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await loginOwner(username.trim(), password.trim());
      onLoggedIn(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SalonHeader salon={salon} />
      <div className="peluqueria-page">
        <header className="peluqueria-header">
          <h1>
            Iniciar <span className="grad">sesión</span>
          </h1>
          <p>Ingresá con tu usuario y contraseña.</p>
        </header>

        <form className="login-card" onSubmit={handleSubmit}>
          <label className="modal-field">
            <span>Usuario</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={isSubmitting}
            />
          </label>
          <label className="modal-field">
            <span>Contraseña</span>
            <span className="password-row">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={isSubmitting}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </span>
          </label>

          {errorMessage ? <p className="modal-error">{errorMessage}</p> : null}

          <button type="submit" className="primary-button login-button" disabled={isSubmitting || !username.trim() || !password.trim()}>
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </>
  );
}
