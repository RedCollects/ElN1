/**
 * Logger mínimo sin dependencias.
 *
 * En producción escribe una línea JSON por evento (Vercel indexa los campos,
 * así se puede buscar por `paymentId`, `bidId`, etc.). En desarrollo y en
 * pruebas escribe texto legible. Un evento es un nombre corto con puntos
 * (`webhook.settled`, `checkout.preference_failed`) más campos planos.
 */

export type LogFields = Record<string, unknown>;

type Level = "info" | "warn" | "error";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
}

function emit(
  level: Level,
  event: string,
  fields?: LogFields,
  error?: unknown,
) {
  const writer =
    level === "info"
      ? console.log
      : level === "warn"
        ? console.warn
        : console.error;

  if (process.env.NODE_ENV === "production") {
    writer(
      JSON.stringify({
        level,
        event,
        time: new Date().toISOString(),
        ...fields,
        ...(error !== undefined ? { error: serializeError(error) } : {}),
      }),
    );
    return;
  }

  const parts: unknown[] = [`[${event}]`];
  if (fields && Object.keys(fields).length > 0) parts.push(fields);
  if (error !== undefined) parts.push(error);
  writer(...parts);
}

export const log = {
  info(event: string, fields?: LogFields) {
    emit("info", event, fields);
  },
  warn(event: string, fields?: LogFields, error?: unknown) {
    emit("warn", event, fields, error);
  },
  error(event: string, fields?: LogFields, error?: unknown) {
    emit("error", event, fields, error);
  },
};
