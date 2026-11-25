import { useState } from "react";

// Link que el dueño le manda a sus clientes para que reserven. Se arma con la
// direccion real de la app + el codigo de su local, y se puede copiar o
// mandar directo por WhatsApp.
export function ShareLinkCard({ slug, salonName }: { slug: string; salonName: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${import.meta.env.BASE_URL}#/${slug}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Reservá tu turno en ${salonName} desde acá: ${link}`)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Sin permiso de portapapeles: se selecciona el texto para copiarlo a mano.
      const range = document.createRange();
      const node = document.getElementById("share-link-text");
      if (node) {
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <section className="share-card">
      <strong>Link para tus clientes</strong>
      <p className="share-hint">Mandáselo por WhatsApp o ponelo en tu Instagram: ahí reservan solos.</p>
      <code id="share-link-text" className="share-link">
        {link}
      </code>
      <div className="share-actions">
        <button type="button" className="settings-btn" onClick={() => void copyLink()}>
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
        <a className="settings-btn settings-btn-primary share-wa" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          Mandar por WhatsApp
        </a>
      </div>
    </section>
  );
}
