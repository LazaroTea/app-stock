'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { cambiarMiClave } from '../sesion';

export default function CambiarClave({ obligatoria, largoMinimo }: { obligatoria: boolean; largoMinimo: number }) {
  const [resultado, cambiar, cambiando] = useActionState(cambiarMiClave, null);

  if (resultado?.ok) {
    return (
      <section className="tarjeta ingreso">
        <h2 className="seccion">Mi clave</h2>
        <p className="mensaje ok">{resultado.mensaje}</p>
        <p>
          <Link href="/">Ir al stock</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="tarjeta ingreso">
      <h2 className="seccion">{obligatoria ? 'Elegí tu clave' : 'Cambiar mi clave'}</h2>
      {obligatoria && (
        <p className="aviso-modificando">
          Estás usando una clave provisoria. Antes de seguir, elegí una clave nueva que solo sepas vos.
        </p>
      )}
      <ul className="ayuda reglas-clave">
        <li>Al menos {largoMinimo} letras o números (mejor si mezclás los dos).</li>
        <li>Que no tenga tu nombre ni sea una clave muy común (como 12345678).</li>
        <li>No la compartas: lo que se carga queda a tu nombre.</li>
      </ul>
      {/* Los campos se vacían después de cada intento (es lo más seguro con claves). */}
      <form action={cambiar}>
        <label htmlFor="actual">{obligatoria ? 'Clave provisoria (la que usaste para entrar)' : 'Clave actual'}</label>
        <input id="actual" name="actual" type="password" autoComplete="current-password" required />
        <label htmlFor="nueva">Clave nueva</label>
        <input id="nueva" name="nueva" type="password" autoComplete="new-password" minLength={largoMinimo} required />
        <label htmlFor="repetida">Repetí la clave nueva</label>
        <input id="repetida" name="repetida" type="password" autoComplete="new-password" required />
        {resultado && <p className="mensaje error">{resultado.mensaje}</p>}
        <button type="submit" className="principal" disabled={cambiando}>
          {cambiando ? 'Guardando…' : 'Guardar clave nueva'}
        </button>
      </form>
    </section>
  );
}
