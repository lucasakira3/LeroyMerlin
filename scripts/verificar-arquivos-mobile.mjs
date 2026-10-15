import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { parse } from "dotenv";

// Verifica o conteúdo que pode entrar em um commit; nunca imprime valores de chaves.
const candidates = [
  ...new Set(
    execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { encoding: "utf8" },
    )
      .split("\0")
      .filter(Boolean),
  ),
];
const problems = [];
const protectedPaths = [
  ".env",
  ".env.local",
  ".env.production",
  "mobile/.env",
  "mobile/.env.production",
  "mobile/node_modules/package.json",
  "mobile/.expo/settings.json",
  "mobile/google-services.json",
  "mobile/firebase-service-account.json",
  "mobile/android/app/google-services.json",
  "mobile/credentials.json",
  "mobile/build.apk",
  "mobile/dist/metadata.json",
  ".mobile-data/atendimento.json",
  ".vercel/project.json",
];
const ignored = new Set(
  execFileSync("git", ["check-ignore", "--no-index", "--stdin", "-z"], {
    input: `${protectedPaths.join("\0")}\0`,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean),
);
for (const file of protectedPaths)
  if (!ignored.has(file))
    problems.push(`${file}: falta proteção no .gitignore.`);
for (const file of [".env.example", "mobile/.env.example"])
  if (!candidates.includes(file))
    problems.push(`${file}: o modelo deve estar disponível para o commit.`);

let env = {};
try {
  env = parse(await readFile(".env.local", "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const names = [
  "GEMINI_API_KEY",
  "ANTHROPIC_API_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "MOBILE_SESSION_SECRET",
  "MOBILE_ADMIN_KEY",
  "EXPO_ACCESS_TOKEN",
];
const secrets = names
  .map((name) => env[name])
  .filter(
    (value) =>
      value &&
      value.length >= 12 &&
      !/^(sua_|your_|<|changeme|example)/i.test(value),
  );
const staged = new Set(
  execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    { encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean),
);
function checkContent(file, content) {
  if (content.includes(0)) return;
  const text = content.toString("utf8");
  if (secrets.some((secret) => text.includes(secret)))
    problems.push(`${file}: contém uma chave do ambiente local.`);
  if (
    /sb_secret_[A-Za-z0-9_-]{32,}|sk-ant-api\d+-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{35}/.test(
      text,
    )
  )
    problems.push(`${file}: contém um formato de chave privada de serviço.`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))
    problems.push(`${file}: contém uma chave privada.`);
}
for (const file of candidates) {
  if (
    (/(^|\/)\.env[^/]*$/.test(file) &&
      !file.endsWith("/.env.example") &&
      file !== ".env.example") ||
    /(?:^|\/)(?:google-services\.json|credentials\.json)$|\.(?:apk|aab|ipa|pem|p8|p12|jks|keystore)$/i.test(
      file,
    )
  ) {
    problems.push(
      `${file}: arquivo privado ou gerado está entre os candidatos ao commit.`,
    );
  }
  if (staged.has(file))
    checkContent(
      `${file} (índice Git)`,
      execFileSync("git", ["show", `:${file}`], {
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
  try {
    checkContent(file, await readFile(file));
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
}

for (const file of ["mobile/.env", "mobile/.env.example"]) {
  let contents;
  try {
    contents = parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  if (
    Object.keys(contents).some(
      (name) =>
        /^EXPO_PUBLIC_/.test(name) && /SECRET|PRIVATE|ADMIN|API_KEY/.test(name),
    )
  )
    problems.push(`${file}: há uma variável privada com prefixo público.`);
}

if (problems.length) {
  console.error(
    "Revise antes de enviar ao GitHub:\n" +
      problems.map((problem) => `- ${problem}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    `OK: ${candidates.length} arquivos verificados; nenhum segredo local encontrado nos candidatos ao commit.`,
  );
  console.log(
    "Ambientes, credenciais, dependências, APKs e builds locais estão protegidos pelo .gitignore.",
  );
}
