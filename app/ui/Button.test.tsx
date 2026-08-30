// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button, IconButton } from "./Button";

afterEach(cleanup);

describe("Button", () => {
  it("renderiza un <button> por defecto y un enlace con href", () => {
    render(<Button>Ocupar</Button>);
    expect(screen.getByRole("button", { name: "Ocupar" })).toBeTruthy();

    render(<Button href="/registro">Registro</Button>);
    const link = screen.getByRole("link", { name: "Registro" });
    expect(link.getAttribute("href")).toBe("/registro");
  });

  it("el label va al ras izquierdo, también con block", () => {
    render(
      <Button block variant="primary">
        Pagar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Pagar" });
    expect(button.className).toContain("text-left");
    expect(button.className).toContain("justify-start");
    expect(button.className).toContain("w-full");
    expect(button.className).not.toMatch(/rounded/);
  });

  it("traduce los alias accent → primary y outline → secondary", () => {
    render(<Button variant="accent">A</Button>);
    render(<Button variant="outline">B</Button>);
    expect(screen.getByRole("button", { name: "A" }).className).toContain(
      "bg-accent",
    );
    expect(screen.getByRole("button", { name: "B" }).className).toContain(
      "border-rule",
    );
  });

  it("IconButton exige un nombre accesible", () => {
    render(
      <IconButton label="Cerrar">
        <svg />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeTruthy();
  });
});
