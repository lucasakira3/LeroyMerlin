// ViaCEP é uma API pública real, gratuita, sem chave e liberada pra chamada direta do
// navegador (sem problema de CORS) — padrão comum em formulários de endereço brasileiros.
// Preenche rua/bairro/cidade/UF a partir do CEP, o número e complemento o cliente ainda
// digita à mão (a API não sabe disso).
export interface EnderecoViaCep {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export function formatarCep(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 5) return digitos
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

export async function buscarCep(cep: string): Promise<EnderecoViaCep | null> {
  const digitos = cep.replace(/\D/g, '')
  if (digitos.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
    if (!res.ok) return null
    const dados = await res.json()
    if (dados.erro) return null
    return {
      logradouro: dados.logradouro ?? '',
      bairro: dados.bairro ?? '',
      localidade: dados.localidade ?? '',
      uf: dados.uf ?? '',
    }
  } catch {
    return null
  }
}
