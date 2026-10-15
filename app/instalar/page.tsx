import Link from "next/link";

export const dynamic = "force-dynamic";
function installUrl(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
export default function Instalar() {
  const android = installUrl(process.env.MOBILE_ANDROID_URL);
  return (
    <main className="max-w-xl w-full mx-auto px-6 py-14">
      <p className="text-lm-green font-bold mb-3">
        FIAP NEXT · PROTÓTIPO ACADÊMICO
      </p>
      <h1 className="text-4xl font-bold mb-5">
        Leve o projeto para o seu Android.
      </h1>
      <p className="text-gray-600 mb-8">
        Encontre produtos com a câmera, organize sua lista e peça ajuda no
        corredor.
      </p>
      <div className="space-y-5">
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-bold mb-3">Android</h2>
          {android ? (
            <>
              <a
                href={android}
                className="block text-center bg-lm-green text-white rounded-xl p-4 font-bold"
              >
                Instalar app Android
              </a>
              <p className="text-sm text-gray-600 mt-3">
                Baixe o APK e permita a instalação por este navegador quando o
                Android solicitar.
              </p>
            </>
          ) : (
            <p>
              A instalação Android estará disponível aqui quando a build estiver
              pronta. Enquanto isso, experimente no aparelho do estande.
            </p>
          )}
        </section>
      </div>
      <p className="text-sm text-gray-600 mt-7">
        Demonstração acadêmica: preços e estoque do catálogo são dados de
        exemplo. Não há compra ou pagamento real.
      </p>
      <Link href="/" className="inline-block text-lm-green underline mt-5">
        Conhecer a versão web
      </Link>
    </main>
  );
}
