import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PeluqueriaApp } from "./features/peluqueria/PeluqueriaApp";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PeluqueriaApp />
  </StrictMode>
);
