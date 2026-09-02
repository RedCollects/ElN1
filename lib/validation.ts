import { z } from "zod";

export type ParseResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

/** Primer mensaje legible de un error de Zod (los esquemas ya traen textos en español). */
export function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

/** Valida `input` contra `schema` y devuelve los datos limpios o el primer error. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ParseResult<z.output<S>> {
  const result = schema.safeParse(input);

  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, error: firstMessage(result.error) };
}

/** Lee un cuerpo JSON sin lanzar: un cuerpo vacío o malformado se valida como `{}`. */
export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => ({}));
}

/** Convierte un FormData en un objeto plano (solo valores de texto; los archivos se ignoran). */
export function formDataToObject(formData: FormData): Record<string, string> {
  const object: Record<string, string> = {};

  formData.forEach((value, key) => {
    if (typeof value === "string") {
      object[key] = value;
    }
  });

  return object;
}
