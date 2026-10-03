// O logo é um PNG com as letras em preto fixo — some sobre qualquer superfície que escurece
// no modo escuro. Renderiza as duas versões e deixa o CSS escolher (sem depender de JS, então
// não pisca na troca de tema). O header verde NÃO usa este componente: ele é verde nos dois
// temas e o preto continua legível lá.
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/leroy-logo.png" alt="Leroy Merlin" className={`w-auto object-contain dark:hidden ${className}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/leroy-logo-dark.png" alt="Leroy Merlin" className={`w-auto object-contain hidden dark:block ${className}`} />
    </>
  )
}
