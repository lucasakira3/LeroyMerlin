import { getCorredorRowIndex } from './StoreMap'

const TOTAL_POR_LINHA = 25

// Miniatura de "você está aqui" pro card de produto — de propósito NÃO é uma versão
// reduzida do mapa completo (components/StoreMap.tsx): renderizar o SVG cheio (50
// prateleiras + rótulos) em miniatura em toda card de uma grade de 20 produtos seria caro
// e ilegível nesse tamanho. Em vez disso, é só uma barra de 2 linhas com 25 traços cada,
// destacando o traço do corredor do produto — mostra a posição relativa (perto da entrada
// vs. fundo, linha 1 ou 2) sem tentar reproduzir o layout real em escala.
export default function MiniMapaCorredor({ corredorNormalizado }: { corredorNormalizado: string }) {
  const pos = getCorredorRowIndex(corredorNormalizado)
  if (!pos) return null

  return (
    <div className="flex flex-col gap-0.5" aria-hidden="true">
      {([1, 2] as const).map(linha => (
        <div key={linha} className="flex gap-[1.5px]">
          {Array.from({ length: TOTAL_POR_LINHA }).map((_, i) => {
            const ativo = pos.row === linha && pos.idx === i
            return (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${ativo ? 'bg-lm-green' : 'bg-gray-200'}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
