import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import BannerCarrossel from '@/components/BannerCarrossel'
import VitrineOfertas from '@/components/VitrineOfertas'
import Card from '@/components/ui/Card'

// Antes essa tela também tinha o painel de categorias e a busca inteligente misturados
// aqui — usuário achou poluído. Agora a home é só a "vitrine" (banner + ofertas + stats) e
// components/ProdutosView.tsx (rota /produtos) é onde a navegação/busca de verdade
// acontece — ver aba "Produtos" no NavBar.
export default function HomeView() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Banner promocional */}
      <BannerCarrossel />

      {/* Chamada pra tela de produtos */}
      <Link
        href="/produtos"
        className="flex items-center gap-4 bg-lm-green text-white rounded-card px-6 py-5 mb-8 hover:bg-lm-green/90 transition-colors shadow-soft"
      >
        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Search size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold">Encontre o que você precisa</p>
          <p className="text-sm text-white/80">Navegue por categoria ou descreva com suas palavras — a IA encontra o produto certo</p>
        </div>
        <ArrowRight size={20} className="flex-shrink-0" />
      </Link>

      {/* Ofertas em destaque */}
      <VitrineOfertas />

      {/* Info bar */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">5.000+</p>
          <p>produtos disponíveis</p>
        </Card>
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">45</p>
          <p>lojas no Brasil</p>
        </Card>
        <Card padding="sm">
          <p className="font-bold text-lm-dark text-base">IA</p>
          <p>busca por linguagem natural</p>
        </Card>
      </div>
    </div>
  )
}
