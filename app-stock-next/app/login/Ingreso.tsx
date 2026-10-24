'use client';
import { startTransition, useActionState, useState } from 'react';
import { iniciarSesion } from '../sesion';

export default function Ingreso({ nombres }: { nombres: string[] }) {
  const [resultado, ingresar, ingresando] = useActionState(iniciarSesion, null);
  // Se envía con onSubmit (no con action=) para que React no vacíe el formulario si la clave estaba mal.
  const [nombre, setNombre] = useState('');
  return (
    <section className="tarjeta ingreso">
      <h2 className="seccion">Ingresar</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          const datos = new FormData(e.currentTarget);
          startTransition(() => ingresar(datos));
        }}
      >
        <label htmlFor="nombre">Nombre</label>
        <select id="nombre" name="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required>
          <option value="" disabled>
            Elegí tu nombre
          </option>
          {nombres.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <label htmlFor="clave">Clave</label>
        <input id="clave" name="clave" type="password" autoComplete="current-password" required />
        {resultado && <p className="mensaje error">{resultado.mensaje}</p>}
        <button type="submit" className="principal" disabled={ingresando}>
          {ingresando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </section>
  );
}
