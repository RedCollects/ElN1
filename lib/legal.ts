/**
 * Datos legales y fiscales de EL N1. Fuente de verdad para los Términos, el
 * Aviso de privacidad, el registro de aceptación y el desglose de IVA.
 * Los huecos "[…]" se llenan cuando el responsable entregue sus datos.
 */

/** Versión de los Términos que aceptan los usuarios; súbela al cambiar el texto. */
export const TERMS_VERSION = "1.0";
export const TERMS_DATE = "2026-08-30";

export const PRIVACY_VERSION = "1.0";
export const PRIVACY_DATE = "2026-08-30";

/** Responsable del sitio y del tratamiento de datos. */
export const RESPONSABLE = {
  nombre: "[Nombre completo del responsable]",
  regimen: "persona física con actividad empresarial",
  rfc: "[RFC]",
  domicilio: "[Calle y número, colonia, C.P.]",
  ciudad: "Nogales, Sonora, México",
  correo: "[correo de contacto]",
} as const;

/** IVA general vigente en México. */
export const IVA_RATE = 0.16;

/** Redondeo a centavos, sin flotantes raros (100 * 1.16 = 115.99999…). */
function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Desglose de un monto neto: subtotal, IVA y total, en pesos con centavos. */
export function taxBreakdown(net: number) {
  const subtotal = toCents(net);
  const iva = Math.round(subtotal * IVA_RATE);
  return {
    subtotal: subtotal / 100,
    iva: iva / 100,
    total: (subtotal + iva) / 100,
  };
}

/** Total con IVA que se cobra por una oferta neta. */
export function withTax(net: number): number {
  return taxBreakdown(net).total;
}
