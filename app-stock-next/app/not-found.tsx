import Link from 'next/link';

// Lo que se ve cuando se entra a una dirección que no existe (por ejemplo, un remito que no está).
export default function NoEncontrado() {
  return (
    <section className="tarjeta">
      <h2 className="seccion">No encontrado</h2>
      <p>Lo que buscás no existe o fue borrado.</p>
      <p>
        <Link href="/">Volver al stock</Link>
      </p>
    </section>
  );
}
