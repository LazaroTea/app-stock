import { LARGO_MINIMO } from '@/lib/claves';
import { exigirUsuario } from '@/lib/sesion';
import CambiarClave from './CambiarClave';

export const dynamic = 'force-dynamic';

// Cambiar la clave propia. Si la clave es provisoria, la app trae acá y no deja seguir hasta cambiarla.
export default async function PaginaClave() {
  const usuario = await exigirUsuario({ aceptarProvisoria: true });
  return <CambiarClave obligatoria={usuario.cambiarClave} largoMinimo={LARGO_MINIMO} />;
}
