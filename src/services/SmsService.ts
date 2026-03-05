/**
 * Servicio de SMS con Twilio
 */

import twilio from 'twilio';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE = process.env.TWILIO_PHONE || '';

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

export interface DatosReservaSms {
  codigo: string;
  fecha: string;
  hora: string;
  comensales: number;
  nombreCliente: string;
  telefono: string;
}

function formatearTelefono(telefono: string): string {
  // Limpiar el teléfono de espacios y caracteres
  let limpio = telefono.replace(/\s+/g, '').replace(/-/g, '');
  
  // Si ya tiene prefijo internacional, devolverlo tal cual
  if (limpio.startsWith('+')) {
    return limpio;
  }
  
  // Si es un número español sin prefijo, agregar +34
  if (limpio.match(/^[67]\d{8}$/)) {
    limpio = '+34' + limpio;
  } else {
    // Si no tiene +, agregarlo
    limpio = '+' + limpio;
  }
  
  return limpio;
}

export async function enviarSmsConfirmacion(datos: DatosReservaSms): Promise<boolean> {
  try {
    const mensaje = `🍽️ El Rinconcito de Anaga\n\n✅ ¡Reserva CONFIRMADA!\n\n🗓️ ${datos.fecha}\n⏰ ${datos.hora}\n👥 ${datos.comensales} personas\n🙋 ${datos.nombreCliente}\n\n🎫 Código: ${datos.codigo}\n\n¡Te esperamos! 🌟`;
    
    await client.messages.create({
      body: mensaje,
      from: TWILIO_PHONE,
      to: formatearTelefono(datos.telefono)
    });
    
    console.log(`SMS de confirmación enviado a ${datos.telefono}`);
    return true;
  } catch (error) {
    console.error('Error enviando SMS de confirmación:', error);
    return false;
  }
}

export async function enviarSmsCancelacion(datos: DatosReservaSms, motivo?: string): Promise<boolean> {
  try {
    let mensaje = `🍽️ El Rinconcito de Anaga\n\n🚫 Reserva NO CONFIRMADA\n\n🗓️ ${datos.fecha}\n⏰ ${datos.hora}\n🙋 ${datos.nombreCliente}\n\n🎫 Código: ${datos.codigo}`;
    
    if (motivo) {
      mensaje += `\n\n📝 Motivo: ${motivo}`;
    }
    
    mensaje += `\n\nPuedes hacer otra reserva cuando quieras. 📱`;
    
    await client.messages.create({
      body: mensaje,
      from: TWILIO_PHONE,
      to: formatearTelefono(datos.telefono)
    });
    
    console.log(`SMS de cancelación enviado a ${datos.telefono}`);
    return true;
  } catch (error) {
    console.error('Error enviando SMS de cancelación:', error);
    return false;
  }
}
