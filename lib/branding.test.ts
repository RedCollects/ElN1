import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reglas de la marca v2 Azul que no se pueden romper por descuido:
 * radio 0, sin emojis, sin colores semánticos ni paleta de Tailwind fuera de
 * los tokens. Ver app/ui/README.md.
 */

const ROOT = join(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(tsx|ts)$/.test(name) && !/\.test\.tsx?$/.test(name)
      ? [full]
      : [];
  });
}

const FILES = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "lib"))];

const FORBIDDEN: Array<{ name: string; pattern: RegExp; allow?: RegExp }> = [
  {
    name: "rounded-* (radio 0 en todo)",
    pattern: /\brounded(-[a-z0-9]+)?\b/,
    allow: /Logo\.tsx$/,
  },
  {
    name: "colores semánticos (emerald/amber/red/yellow/green)",
    pattern: /\b(emerald|amber|red|yellow|green)-\d{2,3}\b/,
  },
  {
    name: "paleta sky/brand (usar accent-*)",
    pattern:
      /\b(bg|text|border|from|to|ring|outline|divide)-(sky|brand)(-\d{2,3})?\b/,
  },
  {
    name: "bg-white / neutral de Tailwind (usar tokens)",
    pattern: /\b(bg-white|text-white|bg-neutral-50)\b/,
  },
  {
    name: "emojis (usar Icon)",
    pattern:
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B06}\u{1F900}-\u{1F9FF}]/u,
  },
  {
    name: "sombras fuera del diálogo",
    pattern: /\bshadow-(sm|md|lg|xl|2xl)\b/,
  },
];

describe("marca v2 Azul", () => {
  for (const rule of FORBIDDEN) {
    it(`no usa ${rule.name}`, () => {
      const offenders = FILES.filter((file) => !rule.allow?.test(file))
        .map((file) => {
          const lines = readFileSync(file, "utf-8").split("\n");
          const hits = lines
            .map((line, index) =>
              rule.pattern.test(line) ? `${index + 1}: ${line.trim()}` : null,
            )
            .filter(Boolean);
          return hits.length
            ? `${file.replace(ROOT, "")}\n  ${hits.join("\n  ")}`
            : null;
        })
        .filter(Boolean);
      expect(offenders, offenders.join("\n")).toEqual([]);
    });
  }
});
