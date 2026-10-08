import type { MetadataRoute } from 'next'

// O "cartão de visita" que deixa o site ser instalado como aplicativo (ícone na tela inicial,
// abre sem a barra do navegador). O Next serve este arquivo em /manifest.webmanifest e já põe
// o <link rel="manifest"> em todas as páginas.
// Os ícones são gerados a partir do logo e ficam em public/icons/. O "maskable" é a versão
// com mais margem, pro Android poder recortar em círculo sem cortar o logo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Leroy Merlin — Encontre na loja',
    short_name: 'Leroy Merlin',
    description: 'Busque produtos, veja o corredor no mapa da loja, tire dúvidas e monte seu projeto.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00843d',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Atalhos que aparecem ao segurar o dedo no ícone do aplicativo (Android).
    shortcuts: [
      { name: 'Buscar produto', short_name: 'Buscar', url: '/buscar' },
      { name: 'Projeto Guiado', short_name: 'Projeto', url: '/projeto' },
      { name: 'Carrinho', short_name: 'Carrinho', url: '/carrinho' },
    ],
  }
}
