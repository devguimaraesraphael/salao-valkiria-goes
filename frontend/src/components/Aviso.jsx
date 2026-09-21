import { useEffect } from "react";

export default function Aviso({ aviso, aoFechar }) {
  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(aoFechar, 5000);
    return () => clearTimeout(temporizador);
  }, [aviso, aoFechar]);

  if (!aviso) return null;

  return (
    <div className={`aviso ${aviso.tipo}`} role="status">
      <span>{aviso.texto}</span>
      <button type="button" onClick={aoFechar} aria-label="Fechar aviso">
        ×
      </button>
    </div>
  );
}
