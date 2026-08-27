/** Formato de dinero de toda la app: `$1,500 MXN`. */
export function formatPrice(value: number | string | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("es-MX")} MXN`;
}
