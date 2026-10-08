// Service worker do aplicativo instalável. Faz UMA coisa só: quando o celular está sem
// internet (o sinal dentro da loja costuma falhar) e a pessoa tenta abrir uma página, mostra
// uma tela de "sem conexão" com a cara do site em vez do erro do navegador.
//
// De propósito NÃO guarda páginas nem arquivos do site: assim nunca existe o risco de alguém
// ficar vendo uma versão antiga depois de uma publicação. Tudo continua vindo da rede — o que
// está guardado aqui (a tela de "sem conexão" e o ícone dela) só é usado quando a rede falha.
// Registrado por lib/instalacaoApp.ts, só no site publicado.
const CACHE = 'lm-offline-v1'
const PAGINA_SEM_CONEXAO = '/offline.html'
const ICONE = '/icons/icon-192.png'

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll([PAGINA_SEM_CONEXAO, ICONE]))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome !== CACHE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request
  // Abertura de página: tenta a rede; se falhar, a tela de "sem conexão".
  if (pedido.mode === 'navigate') {
    evento.respondWith(fetch(pedido).catch(() => caches.match(PAGINA_SEM_CONEXAO)))
    return
  }
  // O ícone que aparece nessa tela: mesma regra (sem isto ele ficava quebrado, porque sem
  // rede a tela não consegue buscá-lo). Todo o resto passa direto, sem tocar aqui.
  if (pedido.method === 'GET' && new URL(pedido.url).pathname === ICONE) {
    evento.respondWith(fetch(pedido).catch(() => caches.match(ICONE)))
  }
})
