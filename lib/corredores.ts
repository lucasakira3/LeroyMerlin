// Geometria compartilhada pelo mapa web e pelo app mobile, sem React/DOM.
function specialToNumeric(slug: string): number | null {
  const match = slug.match(/^([a-z])-(\d+)$/);
  if (!match) return null;
  const ranges: Record<string, [number, number]> = {
    e: [9, 15],
    c: [16, 22],
    d: [48, 50],
    t: [44, 47],
    p: [36, 43],
    s: [29, 35],
    x: [48, 50],
  };
  const range = ranges[match[1]];
  if (!range) return null;
  return Math.round(
    range[0] + Math.min((Number(match[2]) - 1) / 20, 1) * (range[1] - range[0]),
  );
}
export function getCorredorRowIndex(
  corridorNorm: string,
): { row: 1 | 2; idx: number } | null {
  const slug = corridorNorm.toLowerCase().trim();
  const match = slug.match(/^corredor-(\d+)$/);
  const n = match ? Number(match[1]) : specialToNumeric(slug);
  if (n === null || n < 1 || n > 50) return null;
  return { row: n <= 25 ? 1 : 2, idx: n <= 25 ? n - 1 : n - 26 };
}
