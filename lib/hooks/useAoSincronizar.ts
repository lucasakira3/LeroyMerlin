'use client'

import { useEffect, useRef, useState } from 'react'
import { getSituacaoSync, type SituacaoSync } from '@/lib/sync/motor'

// Chama `recarregar` quando a sincronização trouxe algo novo de outro aparelho — pra telas
// que leem o localStorage uma vez só, ao abrir (ex.: Meus pedidos, Dashboard do funcionário).
// As telas que já escutavam um evento próprio ('lm-status-pedido-change' etc.) não precisam
// disto: o motor dispara aqueles eventos também.
export function useAoSincronizar(recarregar: () => void): void {
  // Ref pra chamar sempre a versão mais nova da função sem reinscrever o listener a cada render.
  const atual = useRef(recarregar)
  atual.current = recarregar

  useEffect(() => {
    const aoSincronizar = () => atual.current()
    window.addEventListener('lm-sync-change', aoSincronizar)
    return () => window.removeEventListener('lm-sync-change', aoSincronizar)
  }, [])
}

// 'conectado' = falando com o banco; 'local' = banco fora do ar ou não configurado, o site
// está usando só os dados deste aparelho; 'verificando' = ainda não tentou.
export function useSituacaoSync(): SituacaoSync {
  const [situacao, setSituacao] = useState<SituacaoSync>('verificando')

  useEffect(() => {
    const atualizar = () => setSituacao(getSituacaoSync())
    atualizar()
    window.addEventListener('lm-sync-situacao', atualizar)
    return () => window.removeEventListener('lm-sync-situacao', atualizar)
  }, [])

  return situacao
}
