// Kits de projeto curados à mão — a peça central da correção do problema reportado pela
// Leroy Merlin na banca de 21/09/2026: "peço reforma de banheiro, a IA só recomenda louça e
// revestimento, não ferramenta nem insumo". Causa raiz (ver app/api/projeto/route.ts antes
// desta mudança): a IA gerava a lista do zero, sem nada que a lembrasse que "banheiro" cruza
// com Elétrica, Hidráulica, Ferramentas e Pintura — só a memória genérica do modelo, sem
// ancoragem no que a loja de fato vende nem no que um projeto desse tipo realmente cobre.
//
// Cada kit é uma checklist "certa" escrita por gente (não pela IA), cobrindo as fases que um
// projeto desse tipo normalmente tem, cruzando categorias de propósito. `lib/projetoGuiado.ts`
// escolhe o kit mais parecido com a descrição do cliente e injeta no prompt como REFERÊNCIA —
// a IA adapta (remove o que não se aplica, ajusta quantidade, adiciona o que for específico do
// caso), nunca copia cru. Isso muda o problema de "a IA inventa do zero" pra "a IA edita uma
// lista que já foi feita por quem entende de reforma".
//
// Conjunto inicial: 6 kits cobrindo os tipos de projeto mais comuns. Deliberadamente não
// tentamos cobrir as 10 categorias do catálogo de uma vez — é melhor ter poucos kits bem
// feitos do que muitos rasos (seria a mesma armadilha que estamos corrigindo). Extensível:
// adicionar um kit novo é só um objeto a mais nesta lista, sem mexer no prompt nem na rota.

export interface ItemKit {
  material: string;
  categoria: string;
  comodo: string;
  quantidade: string;
  prioridade: "essencial" | "recomendado" | "opcional";
  observacao: string;
  etapa_ordem: number;
  etapa_nome: string;
}

export interface KitProjeto {
  id: string;
  titulo: string;
  // Termos (normalizados, sem acento) que, se aparecerem na descrição do cliente, contam
  // ponto pra este kit ser escolhido como referência — ver escolherKitReferencia().
  palavrasChave: string[];
  itens: ItemKit[];
}

export const KITS_PROJETO: KitProjeto[] = [
  {
    id: "reforma-banheiro",
    titulo: "Reforma de banheiro completa",
    palavrasChave: ["banheiro", "lavabo", "box", "chuveiro"],
    itens: [
      { material: "Máscara Respiratória PFF2 Sem Válvula", categoria: "Ferramentas", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "proteção contra poeira da demolição", etapa_ordem: 1, etapa_nome: "Demolição e proteção" },
      { material: "Óculos de Proteção Incolor", categoria: "Ferramentas", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "contra estilhaço de azulejo/piso", etapa_ordem: 1, etapa_nome: "Demolição e proteção" },
      { material: "Talhadeira e Marreta", categoria: "Ferramentas", comodo: "Banheiro", quantidade: "1 conjunto", prioridade: "essencial", observacao: "remoção de piso e revestimento antigo", etapa_ordem: 1, etapa_nome: "Demolição e proteção" },
      { material: "Lona Plástica para Proteção", categoria: "Construção", comodo: "Banheiro", quantidade: "10m²", prioridade: "recomendado", observacao: "protege o resto da casa da poeira", etapa_ordem: 1, etapa_nome: "Demolição e proteção" },
      { material: "Tubo PVC Soldável 25mm", categoria: "Hidráulica", comodo: "Banheiro", quantidade: "6m", prioridade: "essencial", observacao: "reposicionar pontos de água se necessário", etapa_ordem: 2, etapa_nome: "Hidráulica e elétrica", },
      { material: "Registro de Gaveta 3/4\"", categoria: "Hidráulica", comodo: "Banheiro", quantidade: "2 un.", prioridade: "essencial", observacao: "um por ponto de água (quente/fria)", etapa_ordem: 2, etapa_nome: "Hidráulica e elétrica" },
      { material: "Fita Veda Rosca", categoria: "Hidráulica", comodo: "Banheiro", quantidade: "3 un.", prioridade: "essencial", observacao: "vedação de todas as conexões roscadas", etapa_ordem: 2, etapa_nome: "Hidráulica e elétrica" },
      { material: "Disjuntor Unipolar 10A", categoria: "Elétrica", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "circuito dedicado do chuveiro elétrico", etapa_ordem: 2, etapa_nome: "Hidráulica e elétrica" },
      { material: "Fio Flexível 2,5mm² 750V", categoria: "Elétrica", comodo: "Banheiro", quantidade: "15m", prioridade: "essencial", observacao: "fiação do chuveiro e tomadas", etapa_ordem: 2, etapa_nome: "Hidráulica e elétrica" },
      { material: "Tomada Residencial com 3 Saídas", categoria: "Elétrica", comodo: "Banheiro", quantidade: "1 un.", prioridade: "recomendado", observacao: "secador, barbeador", etapa_ordem: 2, etapa_nome: "Hidráulica e elétrica" },
      { material: "Manta Impermeabilizante", categoria: "Construção", comodo: "Banheiro", quantidade: "6m²", prioridade: "essencial", observacao: "aplicar antes do revestimento, evita infiltração no andar de baixo", etapa_ordem: 3, etapa_nome: "Impermeabilização e revestimento" },
      { material: "Argamassa Colante AC-II", categoria: "Construção", comodo: "Banheiro", quantidade: "2 sacos 20kg", prioridade: "essencial", observacao: "assentamento do piso e revestimento", etapa_ordem: 3, etapa_nome: "Impermeabilização e revestimento" },
      { material: "Porcelanato ou Cerâmica para Piso", categoria: "Pisos e Cerâmica", comodo: "Banheiro", quantidade: "6m²", prioridade: "essencial", observacao: "calcular 10% a mais para corte e quebra", etapa_ordem: 3, etapa_nome: "Impermeabilização e revestimento" },
      { material: "Revestimento Cerâmico para Parede", categoria: "Pisos e Cerâmica", comodo: "Banheiro", quantidade: "12m²", prioridade: "essencial", observacao: "até o teto ou meia-parede, conforme o projeto", etapa_ordem: 3, etapa_nome: "Impermeabilização e revestimento" },
      { material: "Espaçador Cruzeta 2mm", categoria: "Pisos e Cerâmica", comodo: "Banheiro", quantidade: "1 pacote", prioridade: "recomendado", observacao: "junta uniforme entre peças", etapa_ordem: 3, etapa_nome: "Impermeabilização e revestimento" },
      { material: "Desempenadeira Dentada", categoria: "Ferramentas", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "aplicação da argamassa colante", etapa_ordem: 3, etapa_nome: "Impermeabilização e revestimento" },
      { material: "Rejunte Flexível", categoria: "Construção", comodo: "Banheiro", quantidade: "2kg", prioridade: "essencial", observacao: "cor combinando com o revestimento", etapa_ordem: 3, etapa_nome: "Impermeabilização e revestimento" },
      { material: "Vaso Sanitário com Caixa Acoplada", categoria: "Banheiro", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 4, etapa_nome: "Louças, metais e acessórios" },
      { material: "Cuba de Apoio ou Embutir", categoria: "Banheiro", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "conferir o tamanho da bancada", etapa_ordem: 4, etapa_nome: "Louças, metais e acessórios" },
      { material: "Torneira para Banheiro", categoria: "Banheiro", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 4, etapa_nome: "Louças, metais e acessórios" },
      { material: "Box de Vidro Temperado", categoria: "Banheiro", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "medir o vão antes de comprar", etapa_ordem: 4, etapa_nome: "Louças, metais e acessórios" },
      { material: "Chuveiro Elétrico ou Ducha Higiênica", categoria: "Banheiro", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "compatível com o disjuntor instalado", etapa_ordem: 4, etapa_nome: "Louças, metais e acessórios" },
      { material: "Toalheiro e Porta-Papel Higiênico", categoria: "Banheiro", comodo: "Banheiro", quantidade: "1 conjunto", prioridade: "opcional", observacao: "", etapa_ordem: 4, etapa_nome: "Louças, metais e acessórios" },
      { material: "Ralo Sifonado", categoria: "Hidráulica", comodo: "Banheiro", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 4, etapa_nome: "Louças, metais e acessórios" },
      { material: "Silicone Sanitário Incolor", categoria: "Construção", comodo: "Banheiro", quantidade: "1 tubo", prioridade: "essencial", observacao: "vedação do box e das louças", etapa_ordem: 5, etapa_nome: "Acabamento final" },
      { material: "Tinta Acrílica Lavável para Teto", categoria: "Pintura", comodo: "Banheiro", quantidade: "3,6L", prioridade: "recomendado", observacao: "teto e áreas fora do revestimento", etapa_ordem: 5, etapa_nome: "Acabamento final" },
      { material: "Fita Crepe para Pintura", categoria: "Pintura", comodo: "Banheiro", quantidade: "1 rolo", prioridade: "recomendado", observacao: "proteger metais e revestimento na pintura", etapa_ordem: 5, etapa_nome: "Acabamento final" },
      { material: "Espelho para Banheiro", categoria: "Decoração", comodo: "Banheiro", quantidade: "1 un.", prioridade: "opcional", observacao: "", etapa_ordem: 5, etapa_nome: "Acabamento final" },
    ],
  },
  {
    id: "pintura-comodo",
    titulo: "Pintura de um cômodo",
    palavrasChave: ["pintar", "pintura", "tinta"],
    itens: [
      { material: "Lona Plástica para Proteção", categoria: "Construção", comodo: "Geral", quantidade: "10m²", prioridade: "essencial", observacao: "proteger piso e móveis", etapa_ordem: 1, etapa_nome: "Preparo da superfície" },
      { material: "Fita Crepe para Pintura", categoria: "Pintura", comodo: "Geral", quantidade: "2 rolos", prioridade: "essencial", observacao: "proteger rodapé, batente e interruptores", etapa_ordem: 1, etapa_nome: "Preparo da superfície" },
      { material: "Massa Corrida PVA", categoria: "Pintura", comodo: "Geral", quantidade: "1 lata 18L", prioridade: "recomendado", observacao: "só se a parede tiver imperfeição visível", etapa_ordem: 1, etapa_nome: "Preparo da superfície" },
      { material: "Lixa para Parede Grão 150", categoria: "Ferramentas", comodo: "Geral", quantidade: "5 un.", prioridade: "recomendado", observacao: "lixar a massa corrida antes de pintar", etapa_ordem: 1, etapa_nome: "Preparo da superfície" },
      { material: "Selador Acrílico", categoria: "Pintura", comodo: "Geral", quantidade: "3,6L", prioridade: "essencial", observacao: "uniformiza a absorção antes da tinta, economiza tinta depois", etapa_ordem: 2, etapa_nome: "Pintura" },
      { material: "Tinta Acrílica Fosca", categoria: "Pintura", comodo: "Geral", quantidade: "18L", prioridade: "essencial", observacao: "calcular ~1L a cada 5-6m² por demão, geralmente 2 demãos", etapa_ordem: 2, etapa_nome: "Pintura" },
      { material: "Rolo de Lã para Pintura", categoria: "Pintura", comodo: "Geral", quantidade: "2 un.", prioridade: "essencial", observacao: "um reserva, o rolo desgasta no meio do serviço", etapa_ordem: 2, etapa_nome: "Pintura" },
      { material: "Bandeja para Rolo de Pintura", categoria: "Pintura", comodo: "Geral", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Pintura" },
      { material: "Trincha para Acabamento", categoria: "Pintura", comodo: "Geral", quantidade: "1 un.", prioridade: "essencial", observacao: "cantos e acabamento que o rolo não alcança", etapa_ordem: 2, etapa_nome: "Pintura" },
      { material: "Extensão para Cabo de Rolo", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 un.", prioridade: "opcional", observacao: "pintar o teto sem escada", etapa_ordem: 2, etapa_nome: "Pintura" },
    ],
  },
  {
    id: "troca-piso",
    titulo: "Troca de piso de um ambiente",
    palavrasChave: ["piso", "porcelanato", "ceramica", "cerâmica", "revestimento"],
    itens: [
      { material: "Talhadeira e Marreta", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 conjunto", prioridade: "essencial", observacao: "remoção do piso antigo, se houver", etapa_ordem: 1, etapa_nome: "Remoção do piso antigo" },
      { material: "Óculos de Proteção Incolor", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 1, etapa_nome: "Remoção do piso antigo" },
      { material: "Nivelador de Piso Autonivelante", categoria: "Construção", comodo: "Geral", quantidade: "1 saco 20kg", prioridade: "recomendado", observacao: "se o contrapiso ficar irregular após a remoção", etapa_ordem: 1, etapa_nome: "Remoção do piso antigo" },
      { material: "Porcelanato ou Cerâmica para Piso", categoria: "Pisos e Cerâmica", comodo: "Geral", quantidade: "conforme metragem +10%", prioridade: "essencial", observacao: "margem para corte e quebra", etapa_ordem: 2, etapa_nome: "Assentamento" },
      { material: "Argamassa Colante AC-II", categoria: "Construção", comodo: "Geral", quantidade: "1 saco a cada 5m²", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Assentamento" },
      { material: "Espaçador Cruzeta", categoria: "Pisos e Cerâmica", comodo: "Geral", quantidade: "1 pacote", prioridade: "essencial", observacao: "espessura de junta conforme o tipo de peça", etapa_ordem: 2, etapa_nome: "Assentamento" },
      { material: "Nivelador de Piso (clipes e cunhas)", categoria: "Pisos e Cerâmica", comodo: "Geral", quantidade: "1 kit", prioridade: "recomendado", observacao: "evita desnível entre peças, principalmente porcelanato grande", etapa_ordem: 2, etapa_nome: "Assentamento" },
      { material: "Desempenadeira Dentada", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Assentamento" },
      { material: "Rejunte", categoria: "Construção", comodo: "Geral", quantidade: "1 a 2kg conforme metragem", prioridade: "essencial", observacao: "esperar o prazo de cura da argamassa antes de rejuntar", etapa_ordem: 3, etapa_nome: "Rejunte e acabamento" },
      { material: "Rodapé", categoria: "Pisos e Cerâmica", comodo: "Geral", quantidade: "conforme perímetro do ambiente", prioridade: "recomendado", observacao: "", etapa_ordem: 3, etapa_nome: "Rejunte e acabamento" },
    ],
  },
  {
    id: "eletrica-comodo",
    titulo: "Instalação ou reforma elétrica de um cômodo",
    palavrasChave: ["eletrica", "elétrica", "tomada", "disjuntor", "fiacao", "fiação", "chuveiro eletrico"],
    itens: [
      { material: "Detector de Metais e Fios na Parede", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 un.", prioridade: "recomendado", observacao: "localizar fiação existente antes de furar", etapa_ordem: 1, etapa_nome: "Planejamento e abertura" },
      { material: "Rompedor ou Furadeira de Impacto", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 un.", prioridade: "essencial", observacao: "abertura de rasgo para eletroduto", etapa_ordem: 1, etapa_nome: "Planejamento e abertura" },
      { material: "Eletroduto Corrugado", categoria: "Elétrica", comodo: "Geral", quantidade: "conforme percurso", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Fiação e instalação" },
      { material: "Fio Flexível 2,5mm² 750V", categoria: "Elétrica", comodo: "Geral", quantidade: "conforme percurso", prioridade: "essencial", observacao: "circuitos de tomada", etapa_ordem: 2, etapa_nome: "Fiação e instalação" },
      { material: "Fio Terra Multifilar", categoria: "Elétrica", comodo: "Geral", quantidade: "conforme percurso", prioridade: "essencial", observacao: "aterramento é obrigatório por norma", etapa_ordem: 2, etapa_nome: "Fiação e instalação" },
      { material: "Disjuntor Unipolar", categoria: "Elétrica", comodo: "Geral", quantidade: "1 un. por circuito novo", prioridade: "essencial", observacao: "amperagem conforme a carga do circuito", etapa_ordem: 2, etapa_nome: "Fiação e instalação" },
      { material: "Tomada Residencial com 3 Saídas", categoria: "Elétrica", comodo: "Geral", quantidade: "conforme projeto", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Fiação e instalação" },
      { material: "Interruptor Simples ou Paralelo", categoria: "Elétrica", comodo: "Geral", quantidade: "conforme projeto", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Fiação e instalação" },
      { material: "Conector de Emenda Rápida para Fios", categoria: "Elétrica", comodo: "Geral", quantidade: "1 pacote", prioridade: "recomendado", observacao: "emendas dentro de caixa de passagem", etapa_ordem: 2, etapa_nome: "Fiação e instalação" },
      { material: "Multímetro Digital", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 un.", prioridade: "recomendado", observacao: "testar o circuito antes de fechar a parede", etapa_ordem: 3, etapa_nome: "Teste e fechamento" },
      { material: "Massa Corrida PVA", categoria: "Pintura", comodo: "Geral", quantidade: "conforme extensão do rasgo", prioridade: "recomendado", observacao: "fechamento do rasgo na parede", etapa_ordem: 3, etapa_nome: "Teste e fechamento" },
    ],
  },
  {
    id: "jardim-horta",
    titulo: "Jardim ou horta pequena",
    palavrasChave: ["jardim", "horta", "quintal", "plantas", "gramado", "grama"],
    itens: [
      { material: "Enxada", categoria: "Jardim", comodo: "Área externa", quantidade: "1 un.", prioridade: "essencial", observacao: "preparo do solo", etapa_ordem: 1, etapa_nome: "Preparo do solo" },
      { material: "Rastelo de Jardim", categoria: "Jardim", comodo: "Área externa", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 1, etapa_nome: "Preparo do solo" },
      { material: "Luva de Jardinagem", categoria: "Jardim", comodo: "Área externa", quantidade: "1 par", prioridade: "recomendado", observacao: "", etapa_ordem: 1, etapa_nome: "Preparo do solo" },
      { material: "Terra Vegetal Adubada", categoria: "Jardim", comodo: "Área externa", quantidade: "conforme área, sacos de 20L", prioridade: "essencial", observacao: "", etapa_ordem: 1, etapa_nome: "Preparo do solo" },
      { material: "Substrato para Plantio", categoria: "Jardim", comodo: "Área externa", quantidade: "conforme número de vasos/canteiros", prioridade: "recomendado", observacao: "", etapa_ordem: 1, etapa_nome: "Preparo do solo" },
      { material: "Mudas ou Sementes", categoria: "Jardim", comodo: "Área externa", quantidade: "conforme o projeto do cliente", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Plantio" },
      { material: "Vasos ou Jardineiras", categoria: "Jardim", comodo: "Área externa", quantidade: "conforme o projeto do cliente", prioridade: "recomendado", observacao: "", etapa_ordem: 2, etapa_nome: "Plantio" },
      { material: "Mangueira de Jardim", categoria: "Jardim", comodo: "Área externa", quantidade: "1 un.", prioridade: "essencial", observacao: "", etapa_ordem: 2, etapa_nome: "Plantio" },
      { material: "Regador", categoria: "Jardim", comodo: "Área externa", quantidade: "1 un.", prioridade: "recomendado", observacao: "", etapa_ordem: 2, etapa_nome: "Plantio" },
      { material: "Adubo ou Fertilizante", categoria: "Jardim", comodo: "Área externa", quantidade: "1 un.", prioridade: "recomendado", observacao: "manutenção contínua após o plantio", etapa_ordem: 3, etapa_nome: "Manutenção" },
      { material: "Pulverizador Manual", categoria: "Jardim", comodo: "Área externa", quantidade: "1 un.", prioridade: "opcional", observacao: "aplicação de defensivo/adubo foliar", etapa_ordem: 3, etapa_nome: "Manutenção" },
      { material: "Poste de Jardim ou Luminária Externa", categoria: "Iluminação", comodo: "Área externa", quantidade: "conforme o projeto", prioridade: "opcional", observacao: "iluminação do espaço à noite", etapa_ordem: 3, etapa_nome: "Manutenção" },
    ],
  },
  {
    id: "vazamento-hidraulico",
    titulo: "Reparo de vazamento hidráulico simples",
    palavrasChave: ["vazamento", "vazando", "pingando", "goteira", "cano furado", "torneira pingando"],
    itens: [
      { material: "Chave de Grifo", categoria: "Ferramentas", comodo: "Geral", quantidade: "1 un.", prioridade: "essencial", observacao: "soltar e apertar conexões", etapa_ordem: 1, etapa_nome: "Diagnóstico e reparo" },
      { material: "Fita Veda Rosca", categoria: "Hidráulica", comodo: "Geral", quantidade: "1 un.", prioridade: "essencial", observacao: "causa mais comum de vazamento em conexão roscada", etapa_ordem: 1, etapa_nome: "Diagnóstico e reparo" },
      { material: "Reparo para Torneira (courinho/vedante)", categoria: "Hidráulica", comodo: "Geral", quantidade: "1 kit", prioridade: "essencial", observacao: "se o vazamento for pingando pelo bico", etapa_ordem: 1, etapa_nome: "Diagnóstico e reparo" },
      { material: "Conexão PVC Soldável", categoria: "Hidráulica", comodo: "Geral", quantidade: "conforme o ponto avariado", prioridade: "recomendado", observacao: "se houver trecho de cano rachado", etapa_ordem: 1, etapa_nome: "Diagnóstico e reparo" },
      { material: "Adesivo Plástico para PVC", categoria: "Hidráulica", comodo: "Geral", quantidade: "1 un.", prioridade: "recomendado", observacao: "colagem de conexão soldável", etapa_ordem: 1, etapa_nome: "Diagnóstico e reparo" },
      { material: "Silicone Sanitário Incolor", categoria: "Construção", comodo: "Geral", quantidade: "1 tubo", prioridade: "opcional", observacao: "vedação final ao redor da peça", etapa_ordem: 2, etapa_nome: "Acabamento" },
    ],
  },
];

// Normaliza acentos/caixa pra casar "reforma do banheiro" com a chave "banheiro" mesmo com
// maiúscula/variação de escrita — mesmo padrão usado em app/funcionario/consulta/page.tsx.
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// Conta quantas palavras-chave de cada kit aparecem na descrição do cliente e devolve o
// kit com mais pontos (empate: o primeiro da lista). null quando nenhum kit tem nenhuma
// palavra batendo — nesse caso o prompt segue só com a matriz de fases, sem referência.
export function escolherKitReferencia(descricao: string): KitProjeto | null {
  const alvo = normalizar(descricao);
  let melhor: { kit: KitProjeto; pontos: number } | null = null;

  for (const kit of KITS_PROJETO) {
    const pontos = kit.palavrasChave.filter((p) => alvo.includes(normalizar(p))).length;
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) {
      melhor = { kit, pontos };
    }
  }
  return melhor?.kit ?? null;
}

// Formata o kit como texto legível pro prompt (não como JSON — o JSON de saída é só o
// schema que a IA precisa preencher; misturar os dois formatos no mesmo prompt convida a
// IA a devolver o kit de referência cru em vez de adaptá-lo).
export function formatarKitParaPrompt(kit: KitProjeto): string {
  const porEtapa = new Map<number, { nome: string; itens: ItemKit[] }>();
  for (const item of kit.itens) {
    const grupo = porEtapa.get(item.etapa_ordem) ?? { nome: item.etapa_nome, itens: [] };
    grupo.itens.push(item);
    porEtapa.set(item.etapa_ordem, grupo);
  }

  const linhas = Array.from(porEtapa.entries())
    .sort(([a], [b]) => a - b)
    .map(([ordem, { nome, itens }]) => {
      const itensTexto = itens
        .map((i) => `  - ${i.material} (${i.categoria}, ${i.quantidade}, ${i.prioridade})`)
        .join("\n");
      return `${ordem}. ${nome}:\n${itensTexto}`;
    });

  return `Lista de referência — "${kit.titulo}" (${kit.itens.length} itens, escrita por especialistas da loja):\n${linhas.join("\n")}`;
}
