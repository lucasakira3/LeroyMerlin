import QRCode from "qrcode";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const url = process.argv[2];
if (url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password)
    throw new Error(
      "Use uma URL HTTPS pública, sem credenciais, para a instalação.",
    );
}
const products = JSON.parse(
  await readFile("mobile/src/data/catalogo-demo.json", "utf8"),
).slice(0, 4);
const labels = [
  ...(url
    ? [{ title: "Instale o app", detail: "Android · APK", value: url }]
    : []),
  ...products.map((p) => ({
    title: p.produto,
    detail: `${p.id} · ${p.corredor}`,
    value: p.id,
  })),
  {
    title: "Você está no corredor 03",
    detail: "Escaneie dentro do aplicativo",
    value: "corredor-03",
  },
];
const escape = (text) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const cards = await Promise.all(
  labels.map(
    async (label) =>
      `<article>${await QRCode.toString(label.value, { type: "svg", margin: 2, errorCorrectionLevel: "M" })}<h2>${escape(label.title)}</h2><p>${escape(label.detail)}</p><small>${escape(label.value)}</small></article>`,
  ),
);
await mkdir("docs/mobile", { recursive: true });
await writeFile(
  "docs/mobile/etiquetas.html",
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Etiquetas · Leroy NEXT</title><style>body{font:16px system-ui;color:#163c26;margin:32px}h1{font-size:26px}main{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}article{border:1px solid #b5c5b5;border-radius:16px;padding:20px;text-align:center;break-inside:avoid}svg{width:180px;height:180px}h2{font-size:18px}p,small{overflow-wrap:anywhere}button{padding:12px 24px;margin:20px 0}@media print{button{display:none}body{margin:0}article{border-radius:0}}</style><h1>Leroy • FIAP NEXT</h1><p>Use a câmera do app para ler etiquetas de produto e corredor.${url ? " O QR de instalação pode ser lido pela câmera do celular." : " Para incluir o QR de instalação, rode npm run mobile:qr -- https://seu-backend/instalar após publicar a build."}</p><button onclick="print()">Imprimir etiquetas</button><main>${cards.join("")}</main></html>`,
  "utf8",
);
console.log(
  `Folha pronta: docs/mobile/etiquetas.html (${labels.length} etiquetas).`,
);
