/**
 * Servicio de SMS con Twilio
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';

export interface DatosReservaSms {
  codigo: string;
  fecha: string;
  hora: string;
  comensales: number;
  nombreCliente: string;
  telefono: string;
}

function formatearTelefono(telefono: string): string {
  let limpio = telefono.replace(/\s+/g, '').replace(/-/g, '');
  if (!limpio.startsWith('+')) {
    if (limpio.match(/^[67]\d{8}$/)) {
      limpio = '+34' + limpio;
    } else {
      limpio = '+' + limpio;
    }
  }
  return limpio;
}

async function enviarSms(telefono: string, mensaje: string): Promise<boolean> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', formatearTelefono(telefono));
    params.append('From', TWILIO_FROM);
    params.append('Body', mensaje);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json() as { sid?: string; status?: string; error_code?: number; error_message?: string };

    if (response.ok && data.sid) {
      console.log(`SMS enviado OK - SID: ${data.sid}`);
      return true;
    } else {
      console.error(`Twilio error [${data.error_code}]: ${data.error_message}`);
      return false;
    }
  } catch (error) {
    console.error('Error enviando SMS:', error);
    return false;
  }
}

export async function enviarSmsConfirmacion(datos: DatosReservaSms): Promise<boolean> {
  const mensaje = `Reserva\n\nSolicitud recibida. Para mas informacion escribir al correo: ofertadetrabajojh@proton.com\n\nTe necesito.`;
  const ok = await enviarSms(datos.telefono, mensaje);
  if (ok) console.log(`SMS confirmacion enviado a ${datos.telefono}`);
  return ok;
}

export async function enviarSmsCancelacion(datos: DatosReservaSms, motivo?: string): Promise<boolean> {
  let mensaje = `El Rinconcito de Anaga\n\nReserva no confirmada\n\nFecha: ${datos.fecha}\nHora: ${datos.hora}\nNombre: ${datos.nombreCliente}\nCodigo: ${datos.codigo}`;
  if (motivo) mensaje += `\n\nMotivo: ${motivo}`;
  mensaje += `\n\nPuedes hacer otra reserva cuando quieras.`;

  const ok = await enviarSms(datos.telefono, mensaje);
  if (ok) console.log(`SMS cancelacion enviado a ${datos.telefono}`);
  return ok;
}
