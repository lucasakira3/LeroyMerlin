import { Fragment } from 'react'

function renderInline(texto: string, keyPrefix: string) {
  const partes = texto.split(/(\*\*.+?\*\*|\*.+?\*)/g).filter(Boolean)
  return partes.map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{parte.slice(2, -2)}</strong>
    }
    if (parte.startsWith('*') && parte.endsWith('*')) {
      return <em key={`${keyPrefix}-${i}`}>{parte.slice(1, -1)}</em>
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{parte}</Fragment>
  })
}

interface FormattedTextProps {
  text: string
  className?: string
}

export default function FormattedText({ text, className = '' }: FormattedTextProps) {
  const linhas = text.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <div className={`space-y-1.5 ${className}`}>
      {linhas.map((linha, i) => {
        const numerada = linha.match(/^(\d+)[.)]\s+(.*)/)
        if (numerada) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="font-semibold flex-shrink-0">{numerada[1]}.</span>
              <span>{renderInline(numerada[2], `${i}`)}</span>
            </div>
          )
        }
        const marcada = linha.match(/^[-*]\s+(.*)/)
        if (marcada) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="flex-shrink-0">•</span>
              <span>{renderInline(marcada[1], `${i}`)}</span>
            </div>
          )
        }
        return <p key={i}>{renderInline(linha, `${i}`)}</p>
      })}
    </div>
  )
}
