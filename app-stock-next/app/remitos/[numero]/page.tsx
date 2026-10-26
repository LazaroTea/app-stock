// Un remito guardado, listo para imprimir o guardar como PDF, con el formato de los presupuestos de Native.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { leerRemito } from '@/lib/almacen';
import { EMPRESA } from '@/lib/empresa';
import { puedeAnularRemitos, puedeModificarRemitos } from '@/lib/permisos';
import { exigirUsuario } from '@/lib/sesion';
import { etiquetaLugar, etiquetaTamano, fechaLegible, lugaresDelTipo, numeroRemito } from '@/lib/stock';
import AnularRemito from './AnularRemito';
import BotonImprimir from './BotonImprimir';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ numero: string }> };

// El título de la página es el nombre que el navegador propone al guardar el PDF.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Remito ${numeroRemito(Number(numero))} - Native` };
}

export default async function PaginaRemito({ params }: Props) {
  const usuario = await exigirUsuario();
  const numero = Number((await params).numero);
  const remito = Number.isInteger(numero) && numero > 0 ? await leerRemito(numero) : null;
  if (!remito) notFound();

  const total = remito.lineas.reduce((suma, l) => suma + l.cantidad, 0);
  // Los títulos dependen del tipo: "Procedencia" / "Depósito de destino" en una entrada, etc.
  const reglas = lugaresDelTipo(remito.tipo);

  // Modificar y anular: solo administradores (ver lib/permisos.ts); un remito anulado ya no se toca.
  const puedeModificar = !remito.anulado && puedeModificarRemitos(usuario);
  const puedeAnular = !remito.anulado && puedeAnularRemitos(usuario);

  return (
    <>
      <div className="acciones-remito no-imprimir">
        <Link href="/cargar">← Volver a Cargar</Link>
        <div className="acciones-botones">
          {puedeModificar && (
            <Link href={`/cargar?remito=${remito.numero}`} className="boton-secundario">
              Modificar
            </Link>
          )}
          {puedeAnular && <AnularRemito numero={remito.numero} />}
          <BotonImprimir />
        </div>
      </div>
      <p className="ayuda no-imprimir">
        Para descargarlo, elegí <b>Guardar como PDF</b> en la ventana de impresión.
        {remito.modificadoEn &&
          ` Modificado por última vez el ${remito.modificadoEn}${remito.modificadoPor ? ` por ${remito.modificadoPor}` : ""}.`}
      </p>

      <article className={remito.anulado ? 'documento anulado' : 'documento'}>
        {remito.anulado && (
          <div className="documento-anulado">
            <b>Remito anulado</b>
            {remito.anuladoEn && ` el ${remito.anuladoEn}`}
            {remito.anuladoPor && ` por ${remito.anuladoPor}`}. Sus plantas no cuentan en el stock.
            {remito.anuladoMotivo && (
              <div>
                <span>Motivo:</span> {remito.anuladoMotivo}
              </div>
            )}
          </div>
        )}
        <div className="documento-cabecera">
          <div>
            <img src="/logo-native-verde.png" alt="Native" className="documento-logo" width={713} height={212} />
            <div className="documento-lema">{EMPRESA.lema}</div>
          </div>
          <div className="documento-titulo">
            <h1>Remito</h1>
            <div>Número: {numeroRemito(remito.numero)}</div>
          </div>
        </div>

        <section className="documento-datos">
          <div className="documento-empresa">
            <div className="documento-razon">{EMPRESA.razonSocial}</div>
            <div>Cuit: {EMPRESA.cuit}</div>
            <div>Mail: {EMPRESA.mail}</div>
            <div>Teléfono: {EMPRESA.telefono}</div>
            <div>Dirección: {EMPRESA.direccion}</div>
          </div>
          <div className="documento-fecha">Fecha: {fechaLegible(remito.fecha)}</div>
        </section>

        <section className="documento-detalle">
          <div>
            <span>Tipo:</span> {remito.tipo}
          </div>
          {reglas.procedencia && remito.procedencia && (
            <div>
              <span>{reglas.procedencia.titulo}:</span> {etiquetaLugar(remito.procedencia, remito.procedenciaDetalle)}
            </div>
          )}
          {reglas.destino && remito.destino && (
            <div>
              <span>{reglas.destino.titulo}:</span> {etiquetaLugar(remito.destino, remito.destinoDetalle)}
              {/* Quién recibe va en el mismo renglón que el punto de llegada. */}
              {remito.destinatario && ` · recibe ${remito.destinatario}`}
            </div>
          )}
          {/* Remitos viejos con destinatario y sin punto de llegada: se muestra aparte. */}
          {remito.destinatario && !(reglas.destino && remito.destino) && (
            <div>
              <span>Destinatario:</span> {remito.destinatario}
            </div>
          )}
          {remito.responsable && (
            <div>
              <span>Responsable:</span> {remito.responsable}
            </div>
          )}
        </section>

        <div className="documento-barra">
          <span>Descripción</span>
          <span>Cantidad</span>
        </div>
        <table className="documento-tabla">
          <thead>
            <tr>
              <th>Especie</th>
              <th>Nombre científico</th>
              <th>Presentación</th>
              <th>Tamaño</th>
              <th className="num">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {remito.lineas.map((l, i) => (
              <tr key={i}>
                <td>{l.comun}</td>
                <td className="cientifico">{l.cientifico}</td>
                <td>{l.presentacion}</td>
                <td>{etiquetaTamano(l.tamano, l.tamanoDetalle)}</td>
                <td className="num">{l.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Las observaciones van debajo del detalle y antes del total. */}
        {remito.observaciones && (
          <div className="documento-observaciones">
            <span>Observaciones:</span> {remito.observaciones}
          </div>
        )}

        <div className="documento-total">
          <span>Total:</span>
          <b>
            {total} {Math.abs(total) === 1 ? 'planta' : 'plantas'}
          </b>
        </div>

        <section className="documento-firmas">
          <div>Entregó (firma y aclaración)</div>
          <div>Recibió (firma y aclaración)</div>
        </section>

        <footer className="documento-pie">*Remito interno de control de stock. Documento no válido como factura.</footer>
      </article>
    </>
  );
}
