'use client';
// Botón "Anular": pide el motivo y confirma antes de anular. El remito no se borra, pero deja de contar
// en el stock.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { anularRemito } from '../../acciones';

export default function AnularRemito({ numero }: { numero: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [anulando, iniciar] = useTransition();

  function confirmar() {
    setError('');
    iniciar(async () => {
      const resultado = await anularRemito(numero, motivo);
      if (resultado.ok) {
        setAbierto(false);
        router.refresh();
      } else {
        setError(resultado.mensaje);
      }
    });
  }

  if (!abierto) {
    return (
      <button type="button" className="boton-peligro" onClick={() => setAbierto(true)}>
        Anular
      </button>
    );
  }

  return (
    <div className="anular-caja">
      <label htmlFor="motivo">¿Por qué se anula este remito?</label>
      <textarea
        id="motivo"
        rows={2}
        maxLength={200}
        placeholder="Ej.: se cargó dos veces, la entrega se canceló…"
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
        autoFocus
      />
      <p className="ayuda">
        El remito queda guardado con su número y la marca &quot;ANULADO&quot;, pero sus plantas dejan de contar en el
        stock. No se puede deshacer desde la app.
      </p>
      {error && <div className="mensaje error">{error}</div>}
      <div className="anular-botones">
        <button type="button" className="boton-peligro" disabled={anulando || !motivo.trim()} onClick={confirmar}>
          {anulando ? 'Anulando…' : 'Confirmar anulación'}
        </button>
        <button type="button" className="boton-texto" disabled={anulando} onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
