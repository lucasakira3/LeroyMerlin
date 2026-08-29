// Redimensiona uma foto no próprio navegador antes de guardar em base64 no localStorage
// (usado pela avaliação com foto, ver components/AvaliacoesProduto.tsx) — sem isso, uma
// foto de celular (3-5MB) rapidamente estouraria a cota de localStorage (~5-10MB por
// origem) depois de poucas avaliações. Reduz pra no máx. 480px de largura e recomprime
// como JPEG qualidade 0.6, o que fica na faixa de 20-60KB por foto.
const LARGURA_MAX = 480
const QUALIDADE = 0.6

export function redimensionarImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Falha ao carregar a imagem'))
      img.onload = () => {
        const escala = Math.min(1, LARGURA_MAX / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * escala)
        canvas.height = Math.round(img.height * escala)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas não suportado'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', QUALIDADE))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
