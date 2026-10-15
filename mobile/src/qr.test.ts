import { describe, expect, it } from "vitest";
import { lerEtiqueta } from "./qr";
describe("etiquetas do estande", () => {
  it("aceita ID, link de produto e corredor válidos", () => {
    expect(lerEtiqueta("LM-0001")).toEqual({ tipo: "produto", id: "LM-0001" });
    expect(lerEtiqueta("leroynext://produto/LM-0001")).toEqual({
      tipo: "produto",
      id: "LM-0001",
    });
    expect(lerEtiqueta("https://exemplo.com/produto/LM-0001")).toEqual({
      tipo: "produto",
      id: "LM-0001",
    });
    expect(lerEtiqueta("corredor-3")).toEqual({
      tipo: "corredor",
      slug: "corredor-03",
    });
  });
  it("recusa URLs executáveis, conteúdo desconhecido e corredores fora do mapa", () => {
    for (const value of [
      "javascript:alert(1)",
      "https://exemplo.com",
      "corredor-00",
      "corredor-99",
      "qualquer coisa",
    ])
      expect(lerEtiqueta(value)).toBeNull();
  });
});
