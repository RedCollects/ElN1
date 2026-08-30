// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { initials } from "./Avatar";
import { Badge, Tag } from "./Tag";

afterEach(cleanup);

describe("Tag", () => {
  it("la posición #1 va en azul y lo ocupado en tinta", () => {
    render(<Tag tone="first">Posición #1</Tag>);
    render(<Tag tone="taken">Ocupada</Tag>);
    expect(screen.getByText("Posición #1").className).toContain("bg-accent");
    expect(screen.getByText("Ocupada").className).toContain("bg-ink");
  });

  it("los tonos semánticos viejos no producen verde, ámbar ni rojo", () => {
    render(<Badge tone="success">Publicado</Badge>);
    render(<Badge tone="error">Error</Badge>);
    for (const text of ["Publicado", "Error"]) {
      expect(screen.getByText(text).className).not.toMatch(
        /emerald|amber|red-/,
      );
    }
  });
});

describe("initials", () => {
  it("toma la primera y la última palabra", () => {
    expect(initials("Tacos El Regio")).toBe("TR");
    expect(initials("Estética Marisol")).toBe("EM");
    expect(initials("Café")).toBe("C");
    expect(initials("")).toBe("");
  });
});
