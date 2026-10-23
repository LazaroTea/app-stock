'use client';

// Abre la ventana de impresión del navegador; desde ahí se imprime o se elige "Guardar como PDF".
export default function BotonImprimir() {
  return (
    <button type="button" className="principal" onClick={() => window.print()}>
      Imprimir / Guardar PDF
    </button>
  );
}
