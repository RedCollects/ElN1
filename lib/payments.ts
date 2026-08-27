/** Minutos que dura una reserva de posición (y la preferencia de Mercado Pago). */
export const RESERVATION_MINUTES = 5;

/**
 * Efectivo (OXXO) y transferencias lentas se confirman horas o días después
 * de pagar, fuera de la ventana de reserva. Desactivados salvo que
 * ALLOW_CASH_PAYMENTS=true (entonces se aceptan sin reserva: si el importe
 * ya no alcanza al confirmarse, se reembolsa).
 */
export function allowCashPayments(): boolean {
  return process.env.ALLOW_CASH_PAYMENTS === "true";
}

/** Reembolso automático de pagos que llegan cuando la oferta ya no alcanza. */
export function autoRefundOutbid(): boolean {
  return process.env.AUTO_REFUND_OUTBID !== "false";
}

export type Reservation = {
  position: number;
  amount: number;
  expiresAt: string;
};

/** Fecha en el formato ISO con desfase horario que espera Mercado Pago. */
export function mercadoPagoDate(date: Date): string {
  return date.toISOString().replace("Z", "+00:00");
}
