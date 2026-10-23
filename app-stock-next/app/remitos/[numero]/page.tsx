// Un remito guardado, listo para imprimir o guardar como PDF, con el formato de los presupuestos de Native.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { leerRemito } from '@/lib/almacen';
import { EMPRESA } from '@/lib/empresa';
import { etiquetaLugar, etiquetaTamano, fechaLegible, lugaresDelTipo, numeroRemito } from '@/lib/stock';
import BotonImprimir from './BotonImprimir';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ numero: string }> };

// El título de la página es el nombre que el navegador propone al guardar el PDF.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Remito ${numeroRemito(Number(numero))} - Native` };
}

export default async function PaginaRemito({ params }: Props) {
  const numero = Number((await params).numero);
  const remito = Number.isInteger(numero) && numero > 0 ? await leerRemito(numero) : null;
  if (!remito) notFound();

  const total = remito.lineas.reduce((suma, l) => suma + l.cantidad, 0);
  // Los títulos dependen del tipo: "Procedencia" / "Depósito de destino" en una entrada, etc.
  const reglas = lugaresDelTipo(remito.tipo);

  return (
    <>
      <div className="acciones-remito no-imprimir">
        <Link href="/cargar">← Volver a Cargar</Link>
        <BotonImprimir />
      </div>
      <p className="ayuda no-imprimir">
        Para descargarlo, elegí <b>Guardar como PDF</b> en la ventana de impresión.
      </p>

      <article className="documento">
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
            <span>Movimiento:</span> {remito.tipo}
          </div>
          {reglas.procedencia && remito.procedencia && (
            <div>
              <span>{reglas.procedencia.titulo}:</span> {etiquetaLugar(remito.procedencia, remito.procedenciaDetalle)}
            </div>
          )}
          {reglas.destino && remito.destino && (
            <div>
              <span>{reglas.destino.titulo}:</span> {etiquetaLugar(remito.destino, remito.destinoDetalle)}
            </div>
          )}
          {remito.destinatario && (
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
