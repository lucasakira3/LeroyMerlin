export type Etiqueta =
  { tipo: "produto"; id: string } | { tipo: "corredor"; slug: string };
export function lerEtiqueta(raw: string): Etiqueta | null {
  const value = raw.trim();
  if (/^LM-\d{4,8}$/.test(value)) return { tipo: "produto", id: value };
  const corredor = value.match(/^corredor-(\d{1,2})$/);
  if (corredor && Number(corredor[1]) >= 1 && Number(corredor[1]) <= 50)
    return {
      tipo: "corredor",
      slug: `corredor-${corredor[1].padStart(2, "0")}`,
    };
  try {
    const url = new URL(value);
    if (!["https:", "leroynext:"].includes(url.protocol)) return null;
    const path =
      url.protocol === "leroynext:"
        ? `/${url.hostname}${url.pathname}`
        : url.pathname;
    const produto = path.match(/^\/produto\/(LM-\d{4,8})\/?$/);
    if (produto) return { tipo: "produto", id: produto[1] };
    const slug = url.searchParams.get("corredor");
    return slug && /^corredor-\d{1,2}$/.test(slug) ? lerEtiqueta(slug) : null;
  } catch {
    return null;
  }
}
