import { generarCodigoReserva } from './codigoReserva';

describe('generarCodigoReserva', () => {
  // Requirements: 1.2
  
  it('debe generar un código de exactamente 8 caracteres', () => {
    const codigo = generarCodigoReserva();
    expect(codigo).toHaveLength(8);
  });

  it('debe generar códigos con solo caracteres alfanuméricos válidos', () => {
    const caracteresValidos = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codigo = generarCodigoReserva();
    
    for (const char of codigo) {
      expect(caracteresValidos).toContain(char);
    }
  });

  it('no debe incluir caracteres confusos (0, O, 1, I, L)', () => {
    const caracteresConfusos = '0O1IL';
    
    // Generar varios códigos para aumentar la confianza
    for (let i = 0; i < 100; i++) {
      const codigo = generarCodigoReserva();
      for (const char of codigo) {
        expect(caracteresConfusos.includes(char)).toBe(false);
      }
    }
  });

  it('debe generar códigos únicos (alta probabilidad)', () => {
    const codigos = new Set<string>();
    const numCodigos = 1000;
    
    for (let i = 0; i < numCodigos; i++) {
      codigos.add(generarCodigoReserva());
    }
    
    // Con 31 caracteres posibles y 8 posiciones, hay 31^8 combinaciones
    // La probabilidad de colisión en 1000 intentos es muy baja
    expect(codigos.size).toBe(numCodigos);
  });
});
