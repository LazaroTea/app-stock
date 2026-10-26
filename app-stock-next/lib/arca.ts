// Consulta del nombre de una persona o empresa a partir de su CUIT, en el padrón de ARCA (ex AFIP).
//
// Son dos pasos (servicios web oficiales de ARCA):
//   1. Ingreso (WSAA): se firma un pedido con el certificado de Native y ARCA devuelve un "ticket" (token y firma)
//      que vale 12 horas. Se guarda en la base (tabla arca_tickets) y se reusa: ARCA no deja pedir otro mientras
//      hay uno vigente.
//   2. Consulta (servicio ws_sr_constancia_inscripcion, método getPersona_v2): con el ticket se pide el CUIT.
//
// Necesita estas variables de entorno (ver README, "Buscar un CUIT en ARCA"). Si falta alguna, la búsqueda no está
// activada y la app sigue funcionando: el nombre se escribe a mano.
//   ARCA_CUIT      CUIT de Native (solo números): quien hace la consulta.
//   ARCA_CERT      El certificado (.crt) que dio ARCA, en texto (-----BEGIN CERTIFICATE----- ...).
//   ARCA_KEY       La clave privada (.key) con la que se pidió el certificado, en texto.
//   ARCA_ENTORNO   "produccion" (por defecto) o "homologacion" (pruebas de ARCA).
import 'server-only';
import forge from 'node-forge';
import { guardarTicketArca, leerTicketArca, type TicketArca } from './almacen';
import { cuitValido, soloNumeros } from './cuit';

const SERVICIO = 'ws_sr_constancia_inscripcion';

const DIRECCIONES = {
  produccion: {
    login: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    padron: 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5',
  },
  homologacion: {
    login: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    padron: 'https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5',
  },
} as const;

type Entorno = keyof typeof DIRECCIONES;

interface Configuracion {
  cuit: string;
  certificado: string;
  clave: string;
  entorno: Entorno;
}

// Los valores pegados en Vercel a veces traen los saltos de línea como "\n" escrito; se convierten en saltos reales.
const comoPem = (texto: string) => texto.replace(/\\n/g, '\n').trim();

/** La configuración, o null si la búsqueda no está activada (falta algo). */
export function configuracionArca(): Configuracion | null {
  const cuit = soloNumeros(process.env.ARCA_CUIT ?? '');
  const certificado = comoPem(process.env.ARCA_CERT ?? '');
  const clave = comoPem(process.env.ARCA_KEY ?? '');
  if (!cuitValido(cuit) || !certificado || !clave) return null;
  const entorno: Entorno = process.env.ARCA_ENTORNO === 'homologacion' ? 'homologacion' : 'produccion';
  return { cuit, certificado, clave, entorno };
}

// ---------- 1. Ingreso (WSAA) ----------

// ARCA pide la hora de Argentina con su diferencia: 2026-10-26T12:00:00-03:00.
function horaArgentina(fecha: Date): string {
  const local = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
  return local.toISOString().replace(/\.\d{3}Z$/, '-03:00');
}

/** El pedido de ingreso firmado (CMS en base64), listo para mandar a ARCA. */
export function armarPedidoDeIngreso(certificadoPem: string, clavePem: string, ahora = new Date()): string {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header>' +
    `<uniqueId>${Math.floor(ahora.getTime() / 1000)}</uniqueId>` +
    `<generationTime>${horaArgentina(new Date(ahora.getTime() - 10 * 60 * 1000))}</generationTime>` +
    `<expirationTime>${horaArgentina(new Date(ahora.getTime() + 10 * 60 * 1000))}</expirationTime>` +
    `</header><service>${SERVICIO}</service></loginTicketRequest>`;

  const certificado = forge.pki.certificateFromPem(certificadoPem);
  const clave = forge.pki.privateKeyFromPem(clavePem);
  const firmado = forge.pkcs7.createSignedData();
  firmado.content = forge.util.createBuffer(xml, 'utf8');
  firmado.addCertificate(certificado);
  firmado.addSigner({
    key: clave,
    certificate: certificado,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: ahora as unknown as string },
    ],
  });
  firmado.sign();
  return forge.util.encode64(forge.asn1.toDer(firmado.toAsn1()).getBytes());
}

// Lo que hay entre <etiqueta> y </etiqueta> (sin atributos), o ''.
function contenido(xml: string, etiqueta: string): string {
  const m = xml.match(new RegExp(`<(?:[\\w-]+:)?${etiqueta}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${etiqueta}>`));
  return m ? m[1].trim() : '';
}

function sinEscapar(texto: string): string {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Saca el token, la firma y el vencimiento de la respuesta de ARCA a loginCms. */
export function leerRespuestaDeIngreso(xml: string): { ticket: TicketArca; vence: Date } {
  const falla = contenido(xml, 'faultstring');
  if (falla) throw new Error(`ARCA rechazó el ingreso: ${sinEscapar(falla)}`);
  const ticket = sinEscapar(contenido(xml, 'loginCmsReturn'));
  const token = contenido(ticket, 'token');
  const firma = contenido(ticket, 'sign');
  const vence = new Date(contenido(ticket, 'expirationTime'));
  if (!token || !firma || Number.isNaN(vence.getTime())) throw new Error('La respuesta de ARCA al ingreso no se entiende.');
  return { ticket: { token: sinEscapar(token), firma: sinEscapar(firma) }, vence };
}

async function mandar(direccion: string, cuerpo: string): Promise<string> {
  const respuesta = await fetch(direccion, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '' },
    body: cuerpo,
    signal: AbortSignal.timeout(20_000),
  });
  // ARCA contesta con error HTTP 500 y el detalle en el cuerpo: se lee igual.
  return respuesta.text();
}

async function ticketVigente(config: Configuracion): Promise<TicketArca> {
  const guardado = await leerTicketArca(SERVICIO, config.entorno);
  if (guardado) return guardado;
  const pedido = armarPedidoDeIngreso(config.certificado, config.clave);
  const sobre =
    '<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
    'xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov"><soapenv:Header/><soapenv:Body>' +
    `<wsaa:loginCms><wsaa:in0>${pedido}</wsaa:in0></wsaa:loginCms></soapenv:Body></soapenv:Envelope>`;
  const { ticket, vence } = leerRespuestaDeIngreso(await mandar(DIRECCIONES[config.entorno].login, sobre));
  await guardarTicketArca(SERVICIO, config.entorno, ticket, vence);
  return ticket;
}

// ---------- 2. Consulta del padrón ----------

export interface PersonaArca {
  cuit: string;
  /** Razón social de una empresa, o "Apellido Nombre" de una persona. */
  nombre: string;
  tipoPersona: string;
  /** "ACTIVO" o el estado que informe ARCA. */
  estado: string;
}

/** Saca la persona de la respuesta de getPersona_v2. Devuelve un texto si ARCA informó un error (ej. no existe). */
export function leerRespuestaDePersona(xml: string, cuit: string): PersonaArca | string {
  const falla = contenido(xml, 'faultstring');
  if (falla) return sinEscapar(falla);
  const error = contenido(contenido(xml, 'errorConstancia'), 'error');
  const datos = contenido(xml, 'datosGenerales');
  if (!datos) return error ? sinEscapar(error) : 'ARCA no devolvió datos de ese CUIT.';
  const razonSocial = sinEscapar(contenido(datos, 'razonSocial'));
  const persona = [contenido(datos, 'apellido'), contenido(datos, 'nombre')].map(sinEscapar).filter(Boolean).join(' ');
  const nombre = razonSocial || persona;
  if (!nombre) return 'ARCA no informó el nombre de ese CUIT.';
  return { cuit, nombre, tipoPersona: contenido(datos, 'tipoPersona'), estado: contenido(datos, 'estadoClave') };
}

export type ResultadoBusqueda =
  | { ok: true; persona: PersonaArca }
  | { ok: false; motivo: 'no-activada' | 'cuit-invalido' | 'no-encontrado' | 'error'; mensaje: string };

/** Busca un CUIT en ARCA. Nunca tira error: si algo falla, devuelve el motivo para mostrarlo en pantalla. */
export async function buscarCuit(texto: string): Promise<ResultadoBusqueda> {
  const cuit = soloNumeros(texto);
  if (!cuitValido(cuit)) {
    return { ok: false, motivo: 'cuit-invalido', mensaje: 'El CUIT no es válido: revisá los números.' };
  }
  const config = configuracionArca();
  if (!config) {
    return {
      ok: false,
      motivo: 'no-activada',
      mensaje: 'La búsqueda en ARCA todavía no está activada: escribí el nombre a mano.',
    };
  }
  try {
    const { token, firma } = await ticketVigente(config);
    const sobre =
      '<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
      'xmlns:a5="http://a5.soap.ws.server.puc.sr/"><soapenv:Header/><soapenv:Body><a5:getPersona_v2>' +
      `<token>${token}</token><sign>${firma}</sign><cuitRepresentada>${config.cuit}</cuitRepresentada>` +
      `<idPersona>${cuit}</idPersona></a5:getPersona_v2></soapenv:Body></soapenv:Envelope>`;
    const resultado = leerRespuestaDePersona(await mandar(DIRECCIONES[config.entorno].padron, sobre), cuit);
    if (typeof resultado === 'string') {
      return { ok: false, motivo: 'no-encontrado', mensaje: `ARCA no encontró ese CUIT (${resultado}).` };
    }
    return { ok: true, persona: resultado };
  } catch (e) {
    console.error('Error al consultar ARCA:', e);
    return {
      ok: false,
      motivo: 'error',
      mensaje: 'No se pudo consultar a ARCA en este momento: escribí el nombre a mano.',
    };
  }
}
