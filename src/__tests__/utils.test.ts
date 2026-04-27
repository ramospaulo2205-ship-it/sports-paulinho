import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (classnames utility)", () => {
  it("combina classes simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("remove classes duplicadas do Tailwind (merge)", () => {
    // tailwind-merge deve manter apenas a última declaração de padding
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("ignora valores falsy", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("suporta objetos condicionais", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("retorna string vazia quando sem argumentos", () => {
    expect(cn()).toBe("");
  });

  it("suporta arrays de classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});
