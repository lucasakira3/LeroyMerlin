import Link from 'next/link'
import { Search, LayoutGrid, ArrowRight } from 'lucide-react'
import BannerCarrossel from '@/components/BannerCarrossel'
import VitrineOfertas from '@/components/VitrineOfertas'
import Card from '@/components/ui/Card'

// Antes essa tela também tinha o painel de categorias e a busca inteligente misturados
// aqui — usuário achou poluído. Agora a home é só a "vitrine" (banner + ofertas + stats) e
// duas abas próprias no NavBar levam pra cada jeito de achar produto: "Buscar"
// (components/BuscarView.tsx, texto/foto) e "Produtos" (components/ProdutosView.tsx,
// categorias).
export default function HomeView() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Banner promocional */}
      <BannerCarrossel />

      {/* Chamadas pras telas de busca e produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/buscar"
          className="flex items-center gap-4 bg-lm-green text-white rounded-card px-6 py-5 hover:bg-lm-green/90 transition-colors shadow-soft"
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Search size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">Buscar produto</p>
            <p className="text-sm text-white/80">Descreva com suas palavras — a IA encontra o produto certo</p>
          </div>
          <ArrowRight size={20} className="flex-shrink-0" />
        </Link>

        <Link
          href="/produtos"
          className="flex items-center gap-4 bg-white text-lm-dark rounded-card px-6 py-5 hover:bg-gray-50 transition-colors shadow-soft border border-gray-100"
        >
          <div className="w-11 h-11 rounded-xl bg-lm-green/10 text-lm-green flex items-center justify-center flex-shrink-0">
            <LayoutGrid size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">Navegar por categoria</p>
            <p className="text-sm text-gray-500">Ferramentas, elétrica, hidráulica e mais</p>
          </div>
          <ArrowRight size={20} className="flex-shrink-0 text-gray-400" />
        </Link>
      </div>

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
