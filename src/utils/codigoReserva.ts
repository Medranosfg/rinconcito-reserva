/**
 * Genera un código único de reserva de 8 caracteres alfanuméricos.
 * Se excluyen caracteres confusos (0, O, 1, I, L) para facilitar la lectura.
 * 
 * @returns Código de reserva de 8 caracteres
 * 
 * Requirements: 1.2
 */
export function generarCodigoReserva(): string {
  const caracteres = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}
