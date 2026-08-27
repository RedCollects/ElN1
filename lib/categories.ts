export const BUSINESS_CATEGORIES = [
  "Bienes raíces",
  "Construcción",
  "Música",
  "Agricultura",
  "Alimentos y bebidas",
  "Belleza y bienestar",
  "Compras y servicios",
  "Hogar y construcción",
  "Moda y accesorios",
  "Profesionales y negocios",
  "Salud y fitness",
  "Tecnología y creatividad",
  "Turismo y experiencias",
  "Otro",
];

export function isValidBusinessCategory(value: string) {
  return value.length >= 2 && value.length <= 60;
}
