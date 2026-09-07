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
        // Math.min(1, ...) trava a escala em no máx. 1 — uma foto já menor que 480px de
        // largura não é esticada (ampliar só pioraria a qualidade sem ganhar nada de espaço).
        const escala = Math.min(1, LARGURA_MAX / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * escala)
        canvas.height = Math.round(img.height * escala)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas não suportado'))
          return
        }
        // Desenhar no canvas e reexportar via toDataURL é o único jeito de recomprimir uma
        // imagem no navegador sem depender de nenhuma lib — o canvas descarta os metadados
        // e reencoda como JPEG na qualidade pedida.
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', QUALIDADE))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
