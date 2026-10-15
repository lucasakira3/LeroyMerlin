import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";

// Acrescenta apenas configurações ausentes, preservando as chaves e opções existentes.
async function read(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return "";
  }
}
async function addMissing(file, values) {
  let contents = await read(file);
  let changed = false;
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`^${key}=(.*)$`, "m");
    const match = contents.match(pattern);
    if (match && match[1].trim()) continue;
    if (match) contents = contents.replace(pattern, `${key}=${value}`);
    else
      contents += `${contents.endsWith("\n") || !contents ? "" : "\n"}${key}=${value}\n`;
    changed = true;
  }
  if (changed) await writeFile(file, contents, "utf8");
}
const hostArgument = process.argv[2];
const addresses = Object.entries(networkInterfaces()).flatMap(
  ([name, addresses]) =>
    (addresses ?? [])
      .filter((a) => a.family === "IPv4" && !a.internal)
      .map((a) => ({ name, address: a.address })),
);
const preferred =
  addresses.find((a) => /wi-?fi|wireless|wlan/i.test(a.name)) ??
  addresses.find(
    (a) => !/virtual|vethernet|wsl|vpn|docker|host.only|radmin/i.test(a.name),
  ) ??
  addresses[0];
const url = new URL(
  hostArgument ?? `http://${preferred?.address ?? "127.0.0.1"}:3000`,
);
if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
  throw new Error("Informe um endereço HTTP(S) válido, sem credenciais.");
await addMissing(".env.local", {
  MOBILE_SESSION_SECRET: randomBytes(32).toString("hex"),
  MOBILE_ADMIN_KEY: randomBytes(32).toString("hex"),
  MOBILE_STORAGE: "file",
});
await addMissing("mobile/.env", { EXPO_PUBLIC_API_URL: url.origin });
console.log(
  "Configuração local pronta. Segredos mantidos em .env.local, sem exibição no terminal.",
);
console.log(`Endereço sugerido do backend: ${url.origin}`);
console.log(
  "Confira mobile/.env. Notebook e celular precisam estar na mesma rede durante o desenvolvimento.",
);
console.log(
  "Para a feira, use backend HTTPS hospedado e banco Supabase; o armazenamento em arquivo é só para desenvolvimento.",
);
