import fs from "fs";
import path from "path";

// ─── tipos ───────────────────────────────────────────────────────────────────
type Complexidade = "Baixa" | "DIY" | "Média" | "Alta" | "Profissional" | "Especialista";
type Sustentabilidade = "N/A" | "Bronze" | "Prata" | "Ouro";

interface Produto {
  id: string; categoria: string; produto: string;
  pergunta: string; resposta_ia: string;
  corredor: string; corredor_normalizado: string;
  complexidade: Complexidade; especificacoes: string;
  tags: string[]; estoque: number; preco: number;
  sustentabilidade: Sustentabilidade;
  embedding: number[]; embedding_text: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
let seq = 1;
const id  = () => `LM-${String(seq++).padStart(4, "0")}`;
const num = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const corrPad = (n: number) => ({ corredor: `Corredor ${String(n).padStart(2,"0")}`, corredor_normalizado: `corredor-${String(n).padStart(2,"0")}` });

function p(
  categoria: string, nome: string, pergunta: string, resposta: string,
  corr: number, compl: Complexidade, specs: string, tags: string[],
  preco: number, sust: Sustentabilidade = "N/A"
): Produto {
  const { corredor, corredor_normalizado } = corrPad(corr);
  return {
    id: id(), categoria, produto: nome, pergunta, resposta_ia: resposta,
    corredor, corredor_normalizado, complexidade: compl, especificacoes: specs,
    tags, estoque: num(0, 200), preco: Math.round(preco * 100) / 100, sustentabilidade: sust,
    embedding: [], embedding_text: `${nome} — ${pergunta}`,
  };
}

// ─── FERRAMENTAS (corredores 01–08) ──────────────────────────────────────────
const ferramentas: Produto[] = [
  p("Ferramentas","Furadeira de Impacto 550W Vonder","Qual furadeira para uso doméstico?","Ideal para furar paredes, madeira e metal. 2 velocidades, mandril 1/2\". Acompanha maleta.",3,"DIY","Potência: 550W\nVelocidade: 0-2800 rpm\nCapacidade: concreto 13mm\nPeso: 1.8kg",["furadeira","broca","parede","madeira"],189.90),
  p("Ferramentas","Furadeira de Impacto 700W Stanley","Furadeira profissional para obras?","Furadeira robusta para uso intenso em obra. Mandril 5/8\", 2 velocidades e trava de eixo.",3,"Profissional","Potência: 700W\nVelocidade: 0-3000 rpm\nCapacidade: concreto 16mm\nPeso: 2.2kg",["furadeira","obra","profissional","broca"],279.90),
  p("Ferramentas","Parafusadeira a Bateria 12V Bosch","Parafusadeira sem fio para móveis?","Compacta e leve. Bateria dura até 4h. Acompanha 2 baterias e carregador.",3,"DIY","Voltagem: 12V\nTorque: 30Nm\nVelocidades: 2\nPeso: 1.1kg",["parafusadeira","bateria","sem fio","móveis"],349.90,"Bronze"),
  p("Ferramentas","Parafusadeira a Bateria 20V Makita","Parafusadeira potente para marcenaria?","Alta performance para marcenaria e montagem de estruturas. Torque de 60Nm.",4,"Profissional","Voltagem: 20V\nTorque: 60Nm\nVelocidades: 2\nPeso: 1.7kg",["parafusadeira","20V","marcenaria","torque"],589.90,"Bronze"),
  p("Ferramentas","Martelo Unha Cabo Madeira 27mm Tramontina","Qual martelo para pregar e tirar pregos?","Uso geral com cabo ergonômico. Unha para retirar pregos. Ideal para carpintaria e obras leves.",1,"DIY","Peso: 500g\nMaterial: Aço carbono\nCabo: Madeira\nComprimento: 33cm",["martelo","prego","madeira","carpintaria"],49.90),
  p("Ferramentas","Martelo de Borracha 500g Vonder","Martelo de borracha para azulejo e piso?","Martelo de borracha preta para assentar cerâmica, azulejo e piso sem danificar a superfície.",1,"DIY","Peso: 500g\nCabeça: Borracha preta\nCabo: Fibra de vidro\nComprimento: 30cm",["martelo","borracha","cerâmica","azulejo","piso"],34.90),
  p("Ferramentas","Nível de Bolha Alumínio 60cm Vonder","Como nivelar prateleiras e quadros?","3 ampolas para horizontal, vertical e 45°. Corpo em alumínio. Essencial para instalações.",2,"DIY","Comprimento: 60cm\nAmpolas: 3\nMaterial: Alumínio\nPrecisão: 0.5mm/m",["nível","nivelamento","prateleira","instalação"],39.90),
  p("Ferramentas","Nível de Bolha Alumínio 120cm Stanley","Nível grande para paredes e portas?","Nível longo para verificar paredes, portas e grandes superfícies. 3 ampolas de alta visibilidade.",2,"DIY","Comprimento: 120cm\nAmpolas: 3\nMaterial: Alumínio reforçado\nPrecisão: 0.3mm/m",["nível","120cm","parede","porta"],79.90),
  p("Ferramentas","Serra Circular 7.1/4\" 1400W Makita","Serra para cortar madeira e MDF?","Profissional para cortes retos em madeira, MDF e compensado. Guia paralela inclusa.",4,"Profissional","Potência: 1400W\nDisco: 185mm\nProfundidade: 66mm a 90°\nVelocidade: 5800 rpm",["serra","madeira","MDF","corte","circular"],589.90),
  p("Ferramentas","Serra Tico-tico 450W Bosch","Serra para cortes curvos em madeira?","Perfeita para cortes curvos e irregulares em madeira, metal e plástico. Lâmina intercambiável.",5,"Profissional","Potência: 450W\nCurso: 23mm\nVelocidade: 500-3100 spm\nPeso: 2.0kg",["serra","tico-tico","curvo","madeira"],299.90),
  p("Ferramentas","Trena Métrica 5m Stanley","Qual trena para medições em reforma?","Trava automática e gancho magnético. Fita revestida em nylon para durabilidade.",2,"DIY","Comprimento: 5m\nLargura: 19mm\nTrava: Automática\nGancho: Magnético",["trena","medição","metro","fita"],29.90),
  p("Ferramentas","Trena Laser 30m Vonder","Trena a laser para medir ambientes?","Mede distâncias de até 30m com precisão de ±2mm. Calcula área e volume automaticamente.",2,"DIY","Alcance: 30m\nPrecisão: ±2mm\nFunções: Distância, área, volume\nDisplay: LCD retroiluminado",["trena","laser","distância","digital"],149.90),
  p("Ferramentas","Kit Chaves de Fenda e Phillips 6 Peças Tramontina","Kit de chaves de fenda para uso geral?","3 chaves fenda + 3 Phillips. Cabo ergonômico antiderrapante. Aço cromo-vanádio.",1,"DIY","Peças: 6\nMaterial: Aço Cr-V\nCabo: Bicomponente\nTamanhos: P, M, G",["chave de fenda","phillips","kit","ferramentas"],44.90),
  p("Ferramentas","Kit Chaves Allen 9 Peças Tramontina","Chave allen para móveis e bicicletas?","9 chaves allen em aço cromo-vanádio. Cabo T com esfera para acesso em ângulos difíceis.",1,"DIY","Peças: 9\nTamanhos: 1.5 a 10mm\nMaterial: Aço Cr-V\nTipo: Cabo T com esfera",["chave allen","allen","móveis","bicicleta"],39.90),
  p("Ferramentas","Alicate Universal 8\" Tramontina","Alicate para cortar e dobrar fios?","Alicate de uso geral com corte, dobra e aperto. Cabo com isolamento duplo 1000V.",1,"DIY","Comprimento: 8\" (200mm)\nMaterial: Aço forjado\nIsolamento: 1000V\nAplicação: Corte, dobra, aperto",["alicate","fio","corte","eletricista"],34.90),
  p("Ferramentas","Alicate de Pressão 10\" Vonder","Alicate de pressão para obras?","Alicate com trava ajustável para fixar peças durante solda, corte e montagem.",1,"DIY","Comprimento: 10\" (250mm)\nMaterial: Aço carbono\nTrava: Ajustável\nAplicação: Pressão e fixação",["alicate","pressão","solda","obra"],49.90),
  p("Ferramentas","Esmerilhadeira Angular 4.1/2\" 720W Vonder","Esmerilhadeira para corte e desbaste?","Esmerilhadeira compacta para cortar e desbastar metal, pedra e cerâmica. Disco 115mm.",5,"Profissional","Potência: 720W\nDisco: 115mm (4.1/2\")\nVelocidade: 11.000 rpm\nPeso: 1.7kg",["esmerilhadeira","angular","metal","corte","desbaste"],189.90),
  p("Ferramentas","Esmerilhadeira Angular 7\" 2200W Bosch","Esmerilhadeira grande para obras?","Alta potência para cortes em metal, pedra e concreto. Disco 180mm. Protetor regulável.",5,"Especialista","Potência: 2200W\nDisco: 180mm (7\")\nVelocidade: 8.500 rpm\nPeso: 4.2kg",["esmerilhadeira","7 polegadas","metal","concreto","profissional"],549.90),
  p("Ferramentas","Plaina Elétrica 600W 82mm Vonder","Plaina para nivelar e desbastar madeira?","Profundidade de corte ajustável de 0 a 1.5mm. Guia paralela para cortes precisos.",5,"Profissional","Potência: 600W\nLargura: 82mm\nProfundidade máx: 1.5mm\nVelocidade: 16.000 rpm",["plaina","madeira","desbastar","nivelar"],279.90),
  p("Ferramentas","Lixadeira Orbital 150W Vonder","Lixadeira para madeira e verniz?","Lixadeira orbital para acabamento em madeira, metal e plástico. Lixa 1/4 de folha.",6,"DIY","Potência: 150W\nÓrbita: 2.5mm\nVelocidade: 12.000 opm\nLixa: 1/4 de folha",["lixadeira","orbital","madeira","acabamento","verniz"],149.90),
  p("Ferramentas","Lixadeira de Cinta 350W Stanley","Lixadeira de cinta para pisos e decks?","Remove material rapidamente. Ideal para pisos de madeira, decks e superfícies grandes.",6,"Profissional","Potência: 350W\nCinta: 75x457mm\nVelocidade: 380 m/min\nPeso: 3.2kg",["lixadeira","cinta","piso","deck","madeira"],349.90),
  p("Ferramentas","Parafuso para Drywall 3,5x25mm (caixa 500un)","Parafuso para fixar drywall no perfil?","Parafuso phosphatizado com rosca fina para fixar placa de drywall em perfil metálico.",7,"DIY","Diâmetro: 3.5mm\nComprimento: 25mm\nTipo: Rosca fina (drywall)\nQuantidade: 500 unidades",["parafuso","drywall","gesso","fixação"],19.90),
  p("Ferramentas","Parafuso para Madeira 4,0x40mm (caixa 200un)","Parafuso para fixar madeira?","Parafuso para madeira com cabeça chata e ponta broca. Auto-atarraxante. Zincado.",7,"DIY","Diâmetro: 4.0mm\nComprimento: 40mm\nTipo: Madeira cabeça chata\nQuantidade: 200 unidades",["parafuso","madeira","chata","zincado"],24.90),
  p("Ferramentas","Conjunto Bits 30 Peças Tramontina","Conjunto de pontas para parafusadeira?","30 pontas para parafusadeira: fenda, Phillips, Torx, Hex e especiais. Estojo magnético.",8,"DIY","Peças: 30\nTipos: Fenda, Phillips, Torx, Hex\nHaste: 1/4\"\nEstojo: Magnético",["bit","ponta","parafusadeira","conjunto","torx"],49.90),
  p("Ferramentas","Ponteira de Concreto SDS Plus 10x110mm","Broca para furar concreto e alvenaria?","Broca SDS Plus para furadeiras de impacto. Ideal para concreto, tijolos e alvenaria em geral.",7,"DIY","Diâmetro: 10mm\nComprimento: 110mm\nHaste: SDS Plus\nMaterial: Aço especial + carboneto",["broca","concreto","SDS","alvenaria","furadeira"],18.90),
  p("Ferramentas","Conjunto Brocas para Madeira 6 Peças Vonder","Brocas para furar madeira?","6 brocas helicoidais em aço rápido para madeira. Ponta centralizadora para precisão.",7,"DIY","Peças: 6\nDiâmetros: 3, 4, 5, 6, 8, 10mm\nMaterial: Aço rápido HSS\nPonta: Centralizadora",["broca","madeira","helicoidal","HSS"],29.90),
  p("Ferramentas","Bancada de Trabalho Dobrável 150kg Tramontina","Bancada portátil para oficina?","Bancada de trabalho dobrável com torno incorporado. Suporta até 150kg. Fácil transporte.",8,"DIY","Capacidade: 150kg\nDimensões aberta: 83x38x85cm\nTorno: Incorporado\nPeso: 18kg",["bancada","oficina","torno","dobrável","portátil"],499.90),
  p("Ferramentas","Talhadeira Sextavada 22x200mm Tramontina","Talhadeira para quebrar concreto e azulejo?","Talhadeira em aço especial para demolição de concreto, azulejo e alvenaria. Encaixe SDS.",7,"Profissional","Comprimento: 200mm\nDiâmetro: 22mm\nHaste: SDS Plus\nMaterial: Aço especial",["talhadeira","demolição","concreto","azulejo","SDS"],29.90),
  p("Ferramentas","Martelete Elétrico 650W SDS Plus Vonder","Martelete para demolição e perfuração?","Combina perfuração, rotopercussão e demolição. 3 modos. Ideal para concreto armado.",5,"Especialista","Potência: 650W\nEnergia de impacto: 2.2J\nModos: 3 (perfuração, percussão, demolição)\nHaste: SDS Plus",["martelete","SDS","concreto","demolição","percussão"],649.90),
  p("Ferramentas","Pistola de Calafetagem Tramontina","Pistola para aplicar silicone e selante?","Pistola para tubos de silicone, selante e adesivo de 300ml. Gatilho suave de baixa resistência.",8,"DIY","Capacidade: 300ml\nGatilho: Baixa resistência\nEstrutura: Aço\nCurso: Contínuo",["pistola","silicone","selante","calafetagem"],24.90),
  p("Ferramentas","Aplicador de Argamassa Colante Vonder","Ferramenta para assentar cerâmica?","Desempenadeira dentada em aço inox para aplicação uniforme de argamassa colante.",8,"Profissional","Dente: 6x6mm\nMaterial: Aço inox\nCabo: Plástico\nTamanho: 48x12cm",["desempenadeira","dentada","argamassa","cerâmica","azulejo"],39.90),
];

// ─── ELÉTRICA (corredores 09–15) ─────────────────────────────────────────────
const eletrica: Produto[] = [
  p("Elétrica","Disjuntor Unipolar 10A Schneider","Disjuntor para proteger ponto de luz?","Protege circuitos de iluminação de 10A. Compatível com quadros DIN 35mm.",10,"Profissional","Corrente: 10A\nPolos: 1\nTensão: 240V\nPadrão: DIN 35mm",["disjuntor","10A","unipolar","proteção"],18.90),
  p("Elétrica","Disjuntor Bipolar 20A Schneider","Qual disjuntor para chuveiro elétrico?","Bipolar 20A para chuveiros de até 7500W em 220V. Proteção contra sobrecarga e curto-circuito.",10,"Profissional","Corrente: 20A\nPolos: 2\nTensão: 220/380V\nCapacidade: 3kA",["disjuntor","20A","bipolar","chuveiro"],42.90),
  p("Elétrica","Disjuntor Bipolar 32A Pial Legrand","Disjuntor para ar-condicionado?","Bipolar 32A para ar-condicionados split de 18.000 a 24.000 BTU. Proteção diferencial opcional.",10,"Profissional","Corrente: 32A\nPolos: 2\nTensão: 220V\nCapacidade: 3kA",["disjuntor","32A","ar-condicionado","split"],64.90),
  p("Elétrica","Tomada 2P+T 10A Pial Legrand","Tomada para instalar na parede?","Padrão NBR 14136 com pino terra. Suporta até 2500W. Caixa 4x2.",11,"Profissional","Corrente: 10A\nTensão: 250V\nPadrão: NBR 14136\nCaixa: 4x2",["tomada","10A","padrão","instalação"],14.90),
  p("Elétrica","Tomada 2P+T 20A Pial Legrand","Tomada para ar-condicionado e forno?","Tomada 20A para equipamentos de alta potência: ar-condicionado, forno e máquina de solda.",11,"Profissional","Corrente: 20A\nTensão: 250V\nPadrão: NBR 14136\nCaixa: 4x2",["tomada","20A","ar-condicionado","forno"],24.90),
  p("Elétrica","Tomada USB Dupla 5V 2.4A Pial Legrand","Tomada USB embutida na parede?","Duas saídas USB-A para carregar celulares e tablets diretamente na tomada embutida.",11,"Profissional","Saídas: 2x USB-A\nCorrente: 2.4A por porta\nTensão: 100-240V\nCaixa: 4x2",["tomada","USB","carregador","celular"],89.90,"Prata"),
  p("Elétrica","Interruptor Simples 10A Pial Legrand","Interruptor para ponto de luz?","Interruptor padrão para acionar uma carga. Slim com acabamento moderno. Caixa 4x2.",11,"Profissional","Corrente: 10A\nTensão: 250V\nPolos: 1\nCaixa: 4x2",["interruptor","simples","luz","instalação"],12.90),
  p("Elétrica","Interruptor Paralelo (Three-Way) 10A Pial","Interruptor para ligar de dois pontos?","Permite acender e apagar a mesma lâmpada a partir de dois pontos diferentes. Muito usado em corredores.",11,"Profissional","Corrente: 10A\nTensão: 250V\nTipo: Paralelo\nCaixa: 4x2",["interruptor","paralelo","escada","corredor"],18.90),
  p("Elétrica","Interruptor Dimmer para LED 500W Pial","Dimmer para regular intensidade de luz?","Controla a intensidade luminosa de lâmpadas LED e incandescentes. Instalação em caixa 4x2.",11,"Profissional","Carga: 500W\nCompatível: LED e incandescente\nFunção: Dimmer\nCaixa: 4x2",["dimmer","regulador","LED","intensidade"],79.90),
  p("Elétrica","Cabo Flexível 1.5mm² 750V Rolo 100m","Cabo para circuito de iluminação?","Cabo para circuitos de iluminação e tomadas de baixo consumo. Suporta até 15A.",12,"Profissional","Seção: 1.5mm²\nTensão: 750V\nCorrente máx: 15A\nComprimento: 100m",["cabo","1.5mm","iluminação","fio"],139.90),
  p("Elétrica","Cabo Flexível 2.5mm² 750V Rolo 100m","Qual cabo para instalar tomadas?","Para tomadas, chuveiros e equipamentos de até 21A. O mais usado em residências.",12,"Profissional","Seção: 2.5mm²\nTensão: 750V\nCorrente máx: 21A\nComprimento: 100m",["cabo","2.5mm","tomada","fio"],179.90),
  p("Elétrica","Cabo PP 2x2.5mm² Rolo 100m","Cabo para extensão e ferramentas?","Cabo paralelo flexível para extensões, ferramentas portáteis e equipamentos móveis.",12,"DIY","Seção: 2x2.5mm²\nTensão: 450V\nUso: Extensões e ferramentas\nComprimento: 100m",["cabo PP","extensão","ferramenta","flexível"],199.90),
  p("Elétrica","Eletroduto Corrugado Flexível 3/4\" Rolo 50m","Eletroduto para proteger cabos?","Tubo corrugado em PVC para passagem e proteção de cabos elétricos em paredes e lajes.",13,"Profissional","Diâmetro: 3/4\" (20mm)\nMaterial: PVC\nComprimento: 50m\nCor: Cinza",["eletroduto","corrugado","PVC","cabo","proteção"],49.90),
  p("Elétrica","Caixa de Sobrepor 4x2 Pial","Caixa para instalar tomada e interruptor?","Caixa plástica para instalação sobrepor em paredes de alvenaria. Compatível com padrão 4x2.",9,"DIY","Dimensões: 4x2\"\nMaterial: PVC\nInstalação: Sobrepor\nCor: Bege",["caixa","sobrepor","tomada","interruptor"],4.90),
  p("Elétrica","Fita Isolante 19mm x 10m 3M","Fita isolante para emendas elétricas?","PVC com excelente aderência e resistência a umidade. Suporta até 600V.",9,"DIY","Largura: 19mm\nComprimento: 10m\nEspessura: 0.18mm\nTensão: até 600V",["fita","isolante","emenda","cabo"],8.90),
  p("Elétrica","Quadro de Distribuição 12 Disjuntores Schneider","Quadro elétrico para instalar disjuntores?","Embutir para até 12 disjuntores DIN. Barramento neutro/terra incluso.",13,"Especialista","Capacidade: 12 disjuntores\nPadrão: DIN 35mm\nInstalação: Embutir\nDimensões: 30x20x10cm",["quadro","disjuntor","distribuição","painel"],89.90),
  p("Elétrica","Quadro de Distribuição 24 Disjuntores Schneider","Quadro grande para residência completa?","Para residências grandes ou comerciais. Suporta até 24 disjuntores com barramentos separados.",13,"Especialista","Capacidade: 24 disjuntores\nPadrão: DIN 35mm\nInstalação: Embutir\nDimensões: 45x30x12cm",["quadro","24 disjuntores","distribuição","residência"],179.90),
  p("Elétrica","Sensor de Presença para Teto 360° Intelbras","Sensor de presença para acender luz?","Detecta movimento em 360° com alcance de 6m. Acende e apaga automaticamente. Bivolt.",14,"Profissional","Alcance: 6m\nÂngulo: 360°\nCarga máx: 1000W\nBivolt: 100-240V",["sensor","presença","automático","luz"],49.90,"Prata"),
  p("Elétrica","Sensor de Presença Externo c/ Fotocélula","Sensor para área externa e garagem?","Sensor de presença para ambientes externos. Funciona apenas à noite (fotocélula integrada). IP54.",14,"Profissional","Alcance: 12m\nÂngulo: 180°\nIP: 54\nFotocélula: Integrada",["sensor","externo","garagem","fotocélula"],79.90,"Prata"),
  p("Elétrica","Tomada Residencial com 3 Saídas + USB Tramontina","Tomada múltipla com USB?","3 saídas 2P+T + 2 USB-A. Protetor contra surtos integrado. Cabo de 1.5m.",9,"DIY","Saídas: 3 tomadas + 2 USB\nCorrente: 10A\nCabo: 1.5m\nProteção: Contra surtos",["tomada","múltipla","USB","extensão","régua"],69.90,"Bronze"),
  p("Elétrica","Interruptor Residencial c/ Tomada 10A Pial","Interruptor com tomada combinados?","Conjunto com interruptor simples + tomada 10A na mesma placa. Instalação em caixa 4x4.",11,"Profissional","Corrente: 10A\nTipo: Interruptor + tomada\nCaixa: 4x4\nAcabamento: Branco",["interruptor","tomada","conjunto","4x4"],32.90),
  p("Elétrica","Campainha Eletrônica Bivolt Intelbras","Campainha para porta de entrada?","Campainha com 18 toques selecionáveis. Volume ajustável. Instalação em caixa 4x2. Bivolt.",15,"DIY","Toques: 18 opções\nVolume: Ajustável\nBivolt: 100-240V\nCaixa: 4x2",["campainha","porta","toque","bivolt"],49.90),
  p("Elétrica","Ventilador de Teto 3 Pás 127V Ventisol","Ventilador de teto para quarto e sala?","Ventilador silencioso com 3 velocidades. Cúpula inclusa. Suporta instalação em lajes até 3m.",15,"Profissional","Voltagem: 127V\nVelocidades: 3\nPás: 3\nDiâmetro: 1.32m",["ventilador","teto","pás","sala","quarto"],229.90,"Bronze"),
  p("Elétrica","Ventilador de Coluna 50cm 6 Pás Britânia","Ventilador de coluna para ambientes grandes?","Oscilação automática horizontal e vertical. 3 velocidades. Ideal para ambientes de até 20m².",15,"DIY","Diâmetro: 50cm\nPás: 6\nOscilação: Horizontal e vertical\nVelocidades: 3",["ventilador","coluna","oscilação","pás"],249.90),
  p("Elétrica","Extensão Elétrica 10m 3 Saídas 10A Tramontina","Extensão elétrica para obras?","Cabo 2.5mm² com proteção contra sobrecarga. 3 saídas padrão NBR. Carretel embutido.",9,"DIY","Comprimento: 10m\nSaídas: 3\nSeção: 2.5mm²\nCorrente: 10A",["extensão","elétrica","obra","carretel"],79.90),
];

// ─── HIDRÁULICA (corredores 16–22) ───────────────────────────────────────────
const hidraulica: Produto[] = [
  p("Hidráulica","Torneira Bica Alta Inox para Pia de Cozinha Docol","Torneira inox para pia de cozinha?","Monocomando com bica giratória 360° em inox escovado. Instalação em furos de 35mm.",18,"Profissional","Material: Aço inox 304\nBica: Giratória 360°\nFuro instalação: 35mm\nVazão: 6L/min",["torneira","cozinha","inox","bica alta"],389.90,"Prata"),
  p("Hidráulica","Torneira Bica Baixa para Lavatório de Banheiro","Torneira para lavatório de banheiro?","Torneira cromada para lavatório com acabamento espelhado. Fácil instalação.",18,"Profissional","Material: Metal cromado\nTipo: Bica baixa\nFuro instalação: 35mm\nAcabamento: Espelhado",["torneira","lavatório","banheiro","cromada"],129.90),
  p("Hidráulica","Torneira para Tanque com Bica Móvel 1/2\" Docol","Torneira para tanque de lavanderia?","Bica giratória para facilitar o uso do tanque. Abertura de 1/4 de volta. Cromada.",16,"DIY","Bitola: 1/2\"\nBica: Móvel e giratória\nAbertura: 1/4 de volta\nMaterial: Metal cromado",["torneira","tanque","lavanderia","bica móvel"],89.90),
  p("Hidráulica","Torneira Elétrica Instantânea para Pia Lorenzetti","Torneira com aquecedor para pia?","Aquece a água instantaneamente no ponto de uso. Não precisa de boiler. 4 temperaturas.",16,"Profissional","Potência: 5500W\nTemperaturas: 4 níveis\nVazão: 2.5L/min\nBivolt: 110/220V",["torneira","elétrica","instantânea","pia","aquecimento"],299.90),
  p("Hidráulica","Chuveiro Elétrico 7500W 220V Lorenzetti","Chuveiro elétrico potente?","Alta potência para máxima temperatura. Requer circuito exclusivo e disjuntor bipolar 30A.",16,"Profissional","Potência: 7500W\nTensão: 220V\nVazão: 3.5L/min\nDiâmetro: 1/2\"",["chuveiro","7500W","220V","banho"],149.90),
  p("Hidráulica","Chuveiro Elétrico 5500W 110V Látherm","Chuveiro elétrico para 110V?","Para redes 110V. Temperatura máxima adequada para o clima nordestino. Resistência segura.",16,"Profissional","Potência: 5500W\nTensão: 110V\nVazão: 2.5L/min\nDiâmetro: 1/2\"",["chuveiro","5500W","110V","elétrico"],119.90),
  p("Hidráulica","Ducha Higiênica de Parede 1/4 de Volta Docol","Ducha higiênica para banheiro?","Registro de 1/4 de volta embutido. Cromado. Mangueira 120cm e suporte incluso.",16,"Profissional","Tipo: Embutir\nRegistro: 1/4 de volta\nMangueira: 120cm\nAcabamento: Cromado",["ducha","higiênica","banheiro","cromado"],119.90),
  p("Hidráulica","Tubo PVC Soldável 25mm Tigre (barra 6m)","Tubo PVC para encanamento de água fria?","Tubo rígido para água fria. Fácil de cortar e colar. Resistência até 8 kgf/cm².",19,"Profissional","Diâmetro: 25mm\nComprimento: 6m\nPressão máx: 8 kgf/cm²\nPadrão: NBR 5648",["tubo","PVC","encanamento","água"],34.90),
  p("Hidráulica","Tubo PVC Soldável 32mm Tigre (barra 6m)","Tubo PVC para alimentação principal?","Diâmetro maior para alimentação da residência a partir do hidrômetro. Alta resistência.",19,"Profissional","Diâmetro: 32mm\nComprimento: 6m\nPressão máx: 8 kgf/cm²\nPadrão: NBR 5648",["tubo","PVC","32mm","alimentação"],49.90),
  p("Hidráulica","Tubo PVC para Esgoto 100mm (barra 6m)","Tubo para esgoto e drenagem?","Tubo PVC para instalações de esgoto sanitário e drenagem pluvial. Cor laranja.",20,"Profissional","Diâmetro: 100mm\nComprimento: 6m\nUso: Esgoto sanitário\nCor: Laranja\nPadrão: NBR 5688",["tubo","esgoto","100mm","drenagem"],89.90),
  p("Hidráulica","Joelho 90° PVC Soldável 25mm Tigre","Joelho para mudar direção do encanamento?","Joelho de 90° para mudança de direção em instalações de água fria. Soldável.",19,"DIY","Diâmetro: 25mm\nÂngulo: 90°\nMaterial: PVC\nInstalação: Soldável",["joelho","PVC","curva","encanamento"],3.90),
  p("Hidráulica","Tê PVC Soldável 25mm Tigre","Tê para derivação no encanamento?","Conexão em T para derivação de uma linha de água em instalações residenciais.",19,"DIY","Diâmetro: 25mm\nTipo: Tê simples\nMaterial: PVC\nInstalação: Soldável",["tê","PVC","derivação","encanamento"],4.90),
  p("Hidráulica","Registro de Gaveta Bronze 3/4\" Deca","Registro para controlar água?","Para interromper fluxo de água em instalações residenciais. Bronze resistente à corrosão.",17,"Profissional","Bitola: 3/4\"\nMaterial: Bronze\nPressão máx: 10 bar\nRosca: BSP",["registro","gaveta","bronze","água"],29.90),
  p("Hidráulica","Registro de Pressão Cromado 1/2\" Deca","Registro para chuveiro e ducha?","Registro de pressão para controlar o fluxo de chuveiros, pias e duchas. Cromado.",17,"Profissional","Bitola: 1/2\"\nMaterial: Metal cromado\nTipo: Pressão\nRosca: BSP",["registro","pressão","cromado","chuveiro"],39.90),
  p("Hidráulica","Veda Rosca PTFE 18mm x 10m Tigre","Fita veda rosca para encanamento?","PTFE para vedação de conexões roscadas em água e gás. Temperatura: -200°C a +260°C.",17,"DIY","Largura: 18mm\nComprimento: 10m\nMaterial: PTFE\nCor: Branco",["veda rosca","PTFE","vedação","encanamento"],5.90),
  p("Hidráulica","Adesivo para PVC Frasco 175g Amanco","Cola para colar tubos e conexões PVC?","Adesivo de contato para soldagem de tubos e conexões PVC de água fria e esgoto.",17,"DIY","Volume: 175g\nAplicação: PVC frio\nSecagem: 30 minutos\nCor: Amarelo",["adesivo","PVC","cola","encanamento"],18.90),
  p("Hidráulica","Caixa d'Água 1000L Fortlev","Caixa d'água para residência?","Polietileno com tampa, filtro, ladrão e boia. Resistente a UV. Não prolifera algas.",20,"Profissional","Capacidade: 1000L\nMaterial: Polietileno\nCor: Preto\nDiâmetro entrada: 3/4\"",["caixa d'água","1000L","reservatório","polietileno"],399.90),
  p("Hidráulica","Caixa d'Água 500L Fortlev","Caixa d'água menor para apartamento?","Capacidade ideal para apartamentos e residências com 2-3 moradores. Tampa e boia inclusas.",20,"Profissional","Capacidade: 500L\nMaterial: Polietileno\nCor: Preto\nPeso: 8kg",["caixa d'água","500L","apartamento","reservatório"],249.90),
  p("Hidráulica","Sifão para Pia de Cozinha PVC Tigre","Sifão para pia de cozinha?","Sifão em PVC para pia de cozinha e lavatório. Previne mau cheiro do esgoto. Fácil limpeza.",21,"DIY","Diâmetro saída: 40mm\nMaterial: PVC\nInstalação: Pia de cozinha\nLimpeza: Fácil acesso",["sifão","pia","esgoto","mau cheiro","cozinha"],22.90),
  p("Hidráulica","Flexível para Banheiro 30cm 1/2\" Cromado","Flexível para ligar torneiras e vasos?","Tubo flexível de aço inox para ligação de torneiras, caixa acoplada e lavatórios.",21,"DIY","Comprimento: 30cm\nBitola: 1/2\" x 1/2\"\nMaterial: Inox\nAcabamento: Cromado",["flexível","inox","torneira","ligação"],14.90),
  p("Hidráulica","Válvula de Descarga para Vaso Sanitário Deca","Válvula de descarga para reparo?","Válvula de descarga com acionamento manual para vasos sanitários com caixa alta. Fácil instalação.",22,"DIY","Bitola: 1.1/4\"\nTipo: Acionamento manual\nCompatível: Caixa alta\nMaterial: Metal cromado",["válvula","descarga","vaso","reparo"],79.90),
  p("Hidráulica","Boia de Nível para Caixa d'Água 1/2\" Tigre","Boia para caixa d'água?","Boia de nível para controle automático de reenchimento da caixa d'água. Rosca 1/2\".",22,"DIY","Bitola: 1/2\"\nTipo: Flutuante\nUso: Caixa d'água\nBraço: Ajustável",["boia","caixa d'água","nível","flutuante"],24.90),
  p("Hidráulica","Bomba d'Água Submersa 1/2 HP Schneider","Bomba para poço artesiano?","Bomba submersa para poços de até 30m de profundidade. Inox. Para 220V.",22,"Especialista","Potência: 1/2 HP\nProfundidade máx: 30m\nVazão: 120L/h\nTensão: 220V\nMaterial: Inox",["bomba","submersa","poço","artesiano"],849.90),
  p("Hidráulica","Kit Reparo para Chuveiro Universal","Kit de peças para reparar chuveiro?","Conjunto com resistência, gaxeta e terminais para reparar chuveiros elétricos de até 7500W.",16,"DIY","Peças: Resistência + gaxeta + terminais\nCompatível: Universal\nPotência: até 7500W",["reparo","chuveiro","resistência","gaxeta"],24.90),
];

// ─── ILUMINAÇÃO (corredores 23–25) ───────────────────────────────────────────
const iluminacao: Produto[] = [
  p("Iluminação","Lâmpada LED Bulbo 9W 6500K Branca Fria Philips","Lâmpada LED econômica?","Equivalente a 60W incandescente. Vida útil 15.000h. Luz branca fria (6500K).",23,"DIY","Potência: 9W\nEquivalência: 60W\nTemperatura: 6500K\nFluxo: 800 lm\nBase: E27",["lâmpada","LED","9W","branca","E27"],12.90,"Ouro"),
  p("Iluminação","Lâmpada LED Bulbo 9W 3000K Branca Quente Philips","Lâmpada LED de luz quente?","Luz amarelada (3000K) para ambientes aconchegantes como quartos e salas. Vida útil 15.000h.",23,"DIY","Potência: 9W\nEquivalência: 60W\nTemperatura: 3000K\nFluxo: 800 lm\nBase: E27",["lâmpada","LED","quente","3000K","E27"],12.90,"Ouro"),
  p("Iluminação","Lâmpada LED Bulbo 15W 6500K Osram","Lâmpada mais potente para ambientes grandes?","Substitui lâmpadas de 100W. Ideal para cozinhas, garagens e escritórios. Vida útil 15.000h.",23,"DIY","Potência: 15W\nEquivalência: 100W\nTemperatura: 6500K\nFluxo: 1500 lm\nBase: E27",["lâmpada","LED","15W","potente"],19.90,"Ouro"),
  p("Iluminação","Lâmpada LED Dicroica 5W GU10 Taschibra","Lâmpada dicroica para spots?","LED dicroica para spots de embutir e trilhos. Ângulo de abertura de 36°. Bivolt.",24,"DIY","Potência: 5W\nEquivalência: 50W\nBase: GU10\nÂngulo: 36°\nBivolt: 100-240V",["lâmpada","dicroica","GU10","spot","LED"],14.90,"Prata"),
  p("Iluminação","Spot LED Embutido 7W 3000K Taschibra","Spot para embutir no gesso?","LED de embutir para forros de gesso, PVC e madeira. Furo 75mm. Luz aconchegante 3000K.",24,"Profissional","Potência: 7W\nTemperatura: 3000K\nFuro: 75mm\nFluxo: 600 lm\nBivolt: 100-240V",["spot","LED","embutir","gesso","forro"],24.90,"Prata"),
  p("Iluminação","Spot LED Externo Preto 12W 6500K","Spot para área externa e varanda?","Spot de sobrepor para uso externo. À prova de chuva (IP65). Corpo em alumínio preto.",24,"Profissional","Potência: 12W\nTemperatura: 6500K\nIP: 65\nMaterial: Alumínio\nCor: Preto",["spot","externo","IP65","varanda","alumínio"],59.90),
  p("Iluminação","Fita LED RGB 5m com Controle Remoto Intelbras","Fita LED colorida para decoração?","16 milhões de cores. Controle remoto IR. Adesivo 3M. Ideal para sancas e móveis.",25,"DIY","Comprimento: 5m\nCores: RGB\nDensidade: 60 LEDs/m\nControle: Remoto IR\nTensão: 12V",["fita LED","RGB","colorida","sanca","decoração"],69.90),
  p("Iluminação","Fita LED Branca Quente 5m 300 LEDs Taschibra","Fita LED neutra para ambientes?","Luz branca quente uniforme para sancas, balcões e prateleiras. Adesivo 3M.",25,"DIY","Comprimento: 5m\nCores: Branco quente 3000K\nDensidade: 60 LEDs/m\nTensão: 12V\nIP: 20",["fita LED","branca quente","sanca","balcão"],49.90,"Bronze"),
  p("Iluminação","Poste de Jardim LED 12W Preto 1.2m","Poste de iluminação para jardim?","Poste para jardim e calçadas. LED integrado 12W. Estrutura em alumínio. IP65.",25,"Profissional","Potência: 12W\nAltura: 1.2m\nMaterial: Alumínio\nIP: 65\nCor: Preto",["poste","jardim","LED","externo","calçada"],299.90),
  p("Iluminação","Luminária de Teto LED Redonda 24W Sobrepor","Luminária de teto para sala e quarto?","Plafon de sobrepor com LED integrado. Luz neutra 4000K. Sem necessidade de lâmpadas.",23,"DIY","Potência: 24W\nTemperatura: 4000K\nDiâmetro: 30cm\nLED: Integrado\nBivolt",["luminária","plafon","sobrepor","teto","LED"],89.90,"Prata"),
  p("Iluminação","Arandela Externo Cinza LED 9W IP54","Arandela para entrada e garagem?","Arandela resistente à umidade para entradas, varandas e garagens. LED integrado.",24,"DIY","Potência: 9W\nIP: 54\nCor: Cinza\nLED: Integrado\nBivolt: 100-240V",["arandela","externo","entrada","garagem","IP54"],79.90),
  p("Iluminação","Refletor LED 50W 6500K Branco Avant","Refletor para quadra e garagem?","Refletor de alta potência para garagens, fachadas, quadras e áreas externas. IP65.",25,"Profissional","Potência: 50W\nEquivalência: 500W\nTemperatura: 6500K\nIP: 65\nFluxo: 4500 lm",["refletor","LED","50W","garagem","fachada"],129.90),
  p("Iluminação","Refletor LED 100W Solar com Sensor","Refletor solar para área externa?","Refletor com painel solar integrado e sensor de presença. Sem fiação. Autônomo.",25,"DIY","Potência: 100W\nEnergia: Solar\nSensor: Presença\nAutonomia: 8-12h\nIP: 65",["refletor","solar","LED","sensor","sem fio"],199.90,"Ouro"),
  p("Iluminação","Lustre Pendente Rústico 1 Lâmpada E27","Lustre para sala de jantar e cozinha?","Pendente rústico com cabo têxtil. Compatível com lâmpadas E27 até 60W. Ajustável em altura.",23,"DIY","Base: E27\nCabo: Têxtil\nAltura: Ajustável até 1.5m\nCor: Preto/Madeira",["lustre","pendente","rústico","sala","cozinha"],129.90),
  p("Iluminação","Trilho de Iluminação LED 3 Spots 15W Sobrepor","Trilho para cozinha e home office?","Trilho com 3 spots direcionáveis. LED integrado. Sobrepor. Ideal para iluminar bancadas.",24,"DIY","Spots: 3\nPotência total: 15W\nTemperatura: 4000K\nInstalação: Sobrepor\nComprimento: 60cm",["trilho","spot","direcionável","cozinha","home office"],159.90,"Prata"),
];

// ─── JARDIM (corredores 26–32) ────────────────────────────────────────────────
const jardim: Produto[] = [
  p("Jardim","Mangueira Tramontina 25m com Esguicho","Mangueira para rega?","25m com esguicho 6 funções. Resistente a UV e torções. Engate rápido incluso.",27,"DIY","Comprimento: 25m\nDiâmetro: 1/2\"\nPressão máx: 4 bar\nEsguicho: 6 funções",["mangueira","jardim","rega","esguicho"],79.90),
  p("Jardim","Mangueira Expandível 10m a 30m Tramontina","Mangueira que expande com uso?","Expande até 3x ao encher com água. Compacta e leve quando vazia. Esguicho 8 funções.",27,"DIY","Comprimento: 10m (vazia) / 30m (cheia)\nEsguicho: 8 funções\nCor: Verde",["mangueira","expansível","compacta","rega"],89.90),
  p("Jardim","Regador Plástico 10L Tramontina","Regador para plantas e horta?","10L com bico removível. Ergonômico. Para hortas, vasos e jardins.",26,"DIY","Capacidade: 10L\nMaterial: Polipropileno\nBico: Removível",["regador","plantas","horta","jardim"],34.90),
  p("Jardim","Regador de Inox 8L com Bico Longo","Regador premium inox?","Inox resistente à ferrugem. Bico longo para alcançar o solo nas plantas. Capacidade 8L.",26,"DIY","Capacidade: 8L\nMaterial: Inox\nBico: Longo\nCor: Prata",["regador","inox","bico longo","plantas"],149.90,"Prata"),
  p("Jardim","Adubo Fertilizante NPK 10-10-10 1kg","Adubo para plantas?","Granulado com N, P e K equilibrados. Para jardins, gramas e frutíferas.",28,"DIY","Fórmula: 10-10-10\nPeso: 1kg\nApresentação: Granulado",["adubo","NPK","fertilizante","plantas"],19.90,"Prata"),
  p("Jardim","Adubo para Plantas Floridas 500g","Adubo para flores e orquídeas?","Rico em fósforo e potássio. Estimula floração e coloração das flores. Uso quinzenal.",28,"DIY","Fórmula: 05-15-10\nPeso: 500g\nUso: Quinzenal\nCompatível: Flores, orquídeas, rosas",["adubo","flores","orquídea","floração"],24.90,"Prata"),
  p("Jardim","Substrato para Cactus e Suculentas 2L","Terra especial para cactus?","Substrato drenante para cactus e suculentas. Com areia grossa e perlita. Pronto para uso.",28,"DIY","Volume: 2L\nComposição: Casca de pinus + areia + perlita\npH: 5.5 a 6.5\nUso: Vasos",["substrato","cactus","suculenta","terra"],19.90,"Bronze"),
  p("Jardim","Terra Vegetal Adubada Saco 20L Forth","Terra para vasos e jardim?","Substrato adubado pronto para uso. Rico em matéria orgânica. Para vasos e canteiros.",28,"DIY","Volume: 20L\npH: 5.5 a 6.5\nComposição: Orgânica",["terra","substrato","vaso","jardim"],24.90,"Ouro"),
  p("Jardim","Vaso Polietileno Redondo 40cm Tramontina","Vaso para plantas externas?","Polietileno resistente a UV. Dreno removível. Para jardins e varandas.",29,"DIY","Diâmetro: 40cm\nAltura: 32cm\nCapacidade: 20L\nMaterial: Polietileno UV",["vaso","plantas","externo","jardim"],59.90,"Bronze"),
  p("Jardim","Vaso Retangular 60cm para Varanda","Vaso longo para plantas de varanda?","Vaso retangular para compor ambientes de varanda e terraço. Dreno incluso.",29,"DIY","Dimensões: 60x20x18cm\nMaterial: Polipropileno\nCor: Cinza\nDreno: Sim",["vaso","retangular","varanda","terraço"],79.90),
  p("Jardim","Vaso Decorativo Cerâmica 25cm Branco","Vaso de cerâmica para decoração?","Vaso de cerâmica com acabamento fosco para decoração interna. Sem furo de drenagem.",29,"DIY","Altura: 25cm\nMaterial: Cerâmica\nCor: Branco\nDreno: Sem furo",["vaso","cerâmica","decoração","branco"],49.90),
  p("Jardim","Cortador de Grama Elétrico 1200W Tramontina","Cortador de grama para jardim?","Altura de corte ajustável. Caixa coletora 30L. Ideal para quintais até 200m².",32,"DIY","Potência: 1200W\nLargura: 32cm\nAltura de corte: 25/40/55mm\nCaixa: 30L",["cortador","grama","elétrico","jardim"],449.90,"Bronze"),
  p("Jardim","Roçadeira a Fio Elétrica 600W Tramontina","Roçadeira para borda de grama?","Para bordas, muros e canteiros. Fio de nylon intercambiável. Cabeçote giratório.",31,"DIY","Potência: 600W\nFio: Nylon 1.6mm\nCabeçote: Giratório\nPeso: 3.2kg",["roçadeira","grama","borda","fio"],299.90),
  p("Jardim","Pulverizador Costal Manual 5L Tramontina","Pulverizador para pesticidas e herbicidas?","Costal com capacidade 5L. Lança jato ou névoa. Para agrotóxicos e fertilizantes líquidos.",31,"DIY","Capacidade: 5L\nLance: Ajustável (jato/névoa)\nMaterial: Polipropileno\nBomba: Manual",["pulverizador","costal","pesticida","herbicida"],69.90),
  p("Jardim","Luva de Jardinagem com Garras Vonder","Luva para jardinagem?","Luva com garras retráteis para cavar e afofar a terra sem tools adicionais. Lavável.",30,"DIY","Material: Spandex + PVC\nGarras: Retráteis em ABS\nLavável: Sim\nTamanho: M/G",["luva","jardinagem","garras","cavar"],29.90),
  p("Jardim","Tesoura de Poda com Lâmina Curva Tramontina","Tesoura para poda de galhos?","Lâmina em aço inox curva para poda de galhos de até 25mm de diâmetro. Cabo ergonômico.",30,"DIY","Lâmina: Inox curva\nCapacidade: Galhos até 25mm\nCabo: Ergonômico\nMola: Retorno automático",["tesoura","poda","galho","inox","jardinagem"],79.90),
  p("Jardim","Enxada Triangular Cabo Madeira Tramontina","Enxada para cavar e capinar?","Enxada triangular para cultivo, coveamento e capina. Cabo de madeira natural 1.2m.",30,"DIY","Cabeçote: Triangular\nMaterial: Aço forjado\nCabo: Madeira 1.2m\nPeso: 1.2kg",["enxada","triangular","cavar","capina"],49.90),
  p("Jardim","Rastrelo de Jardim 14 Dentes Tramontina","Rastrelo para juntar folhas?","14 dentes em aço galvanizado para juntar folhas, gravetos e restos vegetais.",30,"DIY","Dentes: 14\nMaterial: Aço galvanizado\nCabo: Madeira 1.4m\nLargura: 46cm",["rastrelo","folhas","jardim","galvanizado"],39.90),
  p("Jardim","Sistema de Irrigação por Gotejamento 30 Plantas","Kit irrigação automática?","Rega automaticamente até 30 plantas. Timer incluso. Conexão direta à torneira.",31,"DIY","Capacidade: 30 plantas\nTimer: Incluso\nConexão: 1/2\" ou 3/4\"\nMaterial: PVC e silicone",["irrigação","gotejamento","automático","timer","plantas"],149.90,"Bronze"),
  p("Jardim","Pedra Decorativa Branca Brita 1 Saco 20kg","Pedra decorativa para jardim?","Brita branca para decoração de jardins, vasos e calçadas. Lavada e limpa.",32,"DIY","Peso: 20kg\nCor: Branca\nGranulometria: Brita 1\nUso: Jardim e decoração",["pedra","brita","branca","decorativa","jardim"],29.90),
];

// ─── PISOS e CERÂMICA (corredores 33–43) ─────────────────────────────────────
const pisos: Produto[] = [
  p("Pisos e Cerâmica","Porcelanato Acetinado 60x60cm Portobello (cx 2.16m²)","Piso porcelanato para sala?","Alto tráfego, acetinado. Resistente a manchas. Cada caixa cobre 2.16m².",38,"Profissional","Tamanho: 60x60cm\nEspessura: 9mm\nAcabamento: Acetinado\nPEI: 4",["porcelanato","60x60","sala","cozinha"],89.90,"Prata"),
  p("Pisos e Cerâmica","Porcelanato Polido 60x60cm Eliane (cx 2.16m²)","Porcelanato polido para sala de estar?","Acabamento espelhado que reflete a luz. PEI 3. Indicado para ambientes internos de médio tráfego.",38,"Profissional","Tamanho: 60x60cm\nEspessura: 10mm\nAcabamento: Polido\nPEI: 3",["porcelanato","polido","sala","espelhado"],109.90,"Prata"),
  p("Pisos e Cerâmica","Porcelanato Madeirado 20x120cm Portobello (cx 1.44m²)","Porcelanato que imita madeira?","Textura que imita madeira com durabilidade de porcelanato. Ótimo para salas e quartos.",38,"Profissional","Tamanho: 20x120cm\nAcabamento: Madeirado\nPEI: 4\nRendimento: 1.44m²/cx",["porcelanato","madeira","20x120","sala","quarto"],129.90),
  p("Pisos e Cerâmica","Cerâmica de Parede Branca 30x60cm Eliane (cx 1.44m²)","Cerâmica para revestir paredes?","Retificada branca para cozinha, banheiro e lavabo. Junta 1.5mm.",37,"Profissional","Tamanho: 30x60cm\nAcabamento: Brilhante\nRetificada: Sim\nRendimento: 1.44m²/cx",["cerâmica","branca","parede","cozinha","banheiro"],49.90),
  p("Pisos e Cerâmica","Cerâmica Piso Externo Antiderrapante 45x45cm (cx 2.0m²)","Cerâmica para área externa?","Antiderrapante (PEI 5) para áreas molhadas externas, varandas e piscinas.",36,"Profissional","Tamanho: 45x45cm\nAcabamento: Antiderrapante\nPEI: 5\nUso: Externo e molhado",["cerâmica","antiderrapante","externo","varanda"],59.90),
  p("Pisos e Cerâmica","Rejunte Branco Flexível 1kg Portokoll","Rejunte branco para cerâmica?","Junta de 1 a 10mm. Resistente a manchas. Interno e externo.",36,"DIY","Cor: Branco\nPeso: 1kg\nJunta: 1 a 10mm\nRendimento: 3-6m²/kg",["rejunte","branco","cerâmica","junta"],12.90),
  p("Pisos e Cerâmica","Rejunte Cinza Flexível 1kg Portokoll","Rejunte cinza para porcelanato?","Cor cinza moderna para porcelanato e cerâmica. Juntas de 2 a 10mm.",36,"DIY","Cor: Cinza\nPeso: 1kg\nJunta: 2 a 10mm\nRendimento: 3-5m²/kg",["rejunte","cinza","porcelanato","moderno"],14.90),
  p("Pisos e Cerâmica","Argamassa AC-II 20kg Votorantim","Argamassa para assentar cerâmica?","AC-II para porcelanato, cerâmica e pedras. Interno e externo. Maior tempo em aberto.",35,"Profissional","Tipo: AC-II\nPeso: 20kg\nRendimento: 4-6kg/m²\nTempo em aberto: 20 min",["argamassa","AC-II","cerâmica","porcelanato"],39.90),
  p("Pisos e Cerâmica","Argamassa AC-III Flex 20kg Quartzolit","Argamassa flexível para grandes formatos?","AC-III com flexibilizante para porcelanatos 60x60cm ou maiores. Alta aderência.",35,"Profissional","Tipo: AC-III Flex\nPeso: 20kg\nRendimento: 5-7kg/m²\nEspessura: 3 a 15mm",["argamassa","AC-III","flex","grandes formatos"],59.90),
  p("Pisos e Cerâmica","Piso Laminado Click 7mm AC4 Eucatex (m²)","Piso laminado para quarto?","Sistema click sem cola. AC4 para uso residencial intenso. Manta 3mm necessária.",40,"DIY","Espessura: 7mm\nResistência: AC4\nSistema: Click\nGarantia: 5 anos",["laminado","piso","click","quarto","sala"],45.90,"Bronze"),
  p("Pisos e Cerâmica","Piso Laminado Click 8mm AC5 Durafloor (m²)","Piso laminado mais resistente?","AC5 para uso comercial e residencial de alto tráfego. Espessura 8mm anti-impacto.",40,"DIY","Espessura: 8mm\nResistência: AC5\nSistema: Click\nGarantia: 10 anos",["laminado","piso","AC5","resistente","durafloor"],59.90,"Bronze"),
  p("Pisos e Cerâmica","Piso Vinílico Click 4mm (m²)","Piso vinílico para ambientes úmidos?","100% impermeável para cozinhas, banheiros e lavanderias. Fácil de instalar sobre piso existente.",41,"DIY","Espessura: 4mm\nImpermeável: Sim\nSistema: Click\nRendimento: por m²",["vinílico","piso","impermeável","cozinha","banheiro"],49.90),
  p("Pisos e Cerâmica","Manta Termo-acústica para Piso Laminado 3mm (m²)","Manta para piso laminado?","Indispensável sob piso laminado para amortecimento de ruídos e isolamento térmico.",40,"DIY","Espessura: 3mm\nMaterial: Polietileno expandido\nFunção: Acústico e térmico\nRendimento: por m²",["manta","piso laminado","acústico","isolamento"],8.90),
  p("Pisos e Cerâmica","Rodapé MDF Branco 7cm Barra 2.4m Eucatex","Rodapé para piso laminado?","MDF com melamina branca. Cobre régua de expansão do piso laminado.",42,"DIY","Largura: 7cm\nComprimento: 2.4m\nMaterial: MDF\nRevestimento: Melamina branca",["rodapé","MDF","branco","piso"],18.90,"Bronze"),
  p("Pisos e Cerâmica","Rodapé Madeira Maciça Imbuia 8cm Barra 2.7m","Rodapé de madeira natural?","Madeira maciça imbuia com textura natural. Verniz incluso. Para acabamentos nobres.",42,"Profissional","Largura: 8cm\nComprimento: 2.7m\nMaterial: Madeira imbuia\nAcabamento: Natural",["rodapé","madeira","imbuia","acabamento","nobre"],89.90),
  p("Pisos e Cerâmica","Rejunte Epóxi 1kg Bianco","Rejunte epóxi para juntas delgadas?","Epóxi para juntas de 1 a 3mm. Altamente resistente a manchas, ácidos e álcalis. Brilho intenso.",36,"Profissional","Tipo: Epóxi\nPeso: 1kg\nJunta: 1 a 3mm\nResistência: Manchas, ácidos, álcalis",["rejunte","epóxi","resistente","manchas"],39.90,"Prata"),
  p("Pisos e Cerâmica","Espaçador para Cerâmica 2mm (pacote 250un)","Espaçador para nivelar cerâmica?","Cruzes plásticas para manter as juntas uniformes no assentamento de cerâmica e porcelanato.",35,"DIY","Espessura: 2mm\nQuantidade: 250 unidades\nTipo: Cruz\nMaterial: Plástico",["espaçador","junta","cerâmica","cruz","nivelamento"],8.90),
  p("Pisos e Cerâmica","Nivelador de Piso 100 Clips + 100 Cunhas Raimondi","Nivelador para porcelanato?","Sistema de nivelamento para grandes formatos. Evita desnível entre placas. Clips e cunhas.",35,"Profissional","Clips: 100 unidades\nCunhas: 100 unidades\nEspessura: 3mm\nComprimento: 4mm",["nivelador","piso","clips","cunhas","grandes formatos"],49.90),
  p("Pisos e Cerâmica","Mármore Travertino Polido 61x61cm (m²)","Mármore para ambientes luxuosos?","Pedra natural com veios únicos. Polido e retificado. Para salas e banheiros de alto padrão.",39,"Especialista","Tamanho: 61x61cm\nMaterial: Mármore travertino\nAcabamento: Polido\nRendimento: por m²",["mármore","travertino","pedra natural","luxo","sala"],189.90),
  p("Pisos e Cerâmica","Porcelanato 120x60cm Cinza Cemento (cx 1.44m²)","Porcelanato grande formato cinza?","Imita cimento queimado. Grandes formatos para ambientes modernos. PEI 4.",38,"Profissional","Tamanho: 120x60cm\nCor: Cinza Cemento\nPEI: 4\nRendimento: 1.44m²/cx",["porcelanato","120x60","cinza","cemento","moderno"],149.90,"Prata"),
];

// ─── BANHEIRO (corredores 44–47) ─────────────────────────────────────────────
const banheiro: Produto[] = [
  p("Banheiro","Vaso Sanitário Caixa Acoplada Branco Deca","Vaso sanitário completo?","Dual flush (3/6L). Saída horizontal. Acompanha assento, parafusos e mangueira.",45,"Profissional","Saída: Horizontal\nFlush: Dual 3/6L\nCor: Branco\nMaterial: Louça",["vaso","sanitário","caixa acoplada","louça"],549.90,"Prata"),
  p("Banheiro","Vaso Sanitário com Assento Soft Close Roca","Vaso com fechamento suave?","Assento com amortecedor de fechamento. Tecnologia Rimless (sem aro interno). Fácil limpeza.",45,"Profissional","Assento: Soft Close\nTecnologia: Rimless\nFlush: 3/6L\nCor: Branco",["vaso","soft close","rimless","limpeza"],799.90,"Prata"),
  p("Banheiro","Pia de Embutir 55x45cm Branco Celite","Cuba para embutir?","Louça para embutir em bancada. Borda de apoio. Furo de torneira 35mm.",44,"Profissional","Dimensões: 55x45cm\nProfundidade: 18cm\nFuro torneira: 35mm\nCor: Branco",["pia","cuba","embutir","banheiro"],189.90),
  p("Banheiro","Cuba de Apoio Redonda 36cm Deca","Cuba de apoio para bancada de banheiro?","Cuba redonda para instalar sobre bancada de banheiro. Visual moderno. Ralo incluso.",44,"Profissional","Diâmetro: 36cm\nAltura: 14cm\nMaterial: Louça\nInstalação: Apoio",["cuba","apoio","redonda","banheiro","moderna"],249.90),
  p("Banheiro","Box de Vidro Temperado 90x90cm Dubox","Box para chuveiro?","Vidro temperado 8mm. Perfil alumínio escovado. Abertura deslizante.",46,"Profissional","Dimensões: 90x90cm\nAltura: 190cm\nVidro: 8mm temperado\nPerfil: Alumínio escovado",["box","vidro","temperado","chuveiro","banheiro"],699.90),
  p("Banheiro","Box de Vidro Temperado 80x80cm Dubox","Box pequeno para banheiro compacto?","Para banheiros compactos. Vidro 6mm. Abertura dobrante. Montagem simples.",46,"Profissional","Dimensões: 80x80cm\nAltura: 185cm\nVidro: 6mm\nAbertura: Dobrante",["box","80x80","banheiro","compacto"],499.90),
  p("Banheiro","Espelho com Moldura Preta 60x80cm","Espelho para banheiro?","Moldura MDF laqueado preto. Horizontal ou vertical. Tratamento antiembaçante.",47,"DIY","Dimensões: 60x80cm\nVidro: 4mm\nMoldura: MDF laqueado\nCor: Preto",["espelho","banheiro","moldura","preta"],129.90),
  p("Banheiro","Espelho Bisotê sem Moldura 60x90cm","Espelho grande sem moldura?","Vidro com bisotê nas bordas. Elegante e moderno. Para banheiros e quartos.",47,"DIY","Dimensões: 60x90cm\nBisotê: 15mm\nSem moldura: Sim\nFixação: Kit incluso",["espelho","bisotê","sem moldura","grande"],199.90),
  p("Banheiro","Armário de Banheiro com Espelho 60cm MDF Branco","Armário espelhado para banheiro?","Armário suspenso com espelho na porta. 2 prateleiras internas. MDF com revestimento PVC.",47,"DIY","Largura: 60cm\nAltura: 65cm\nProfundidade: 15cm\nMaterial: MDF",["armário","espelho","banheiro","suspenso"],299.90),
  p("Banheiro","Toalheiro Barra Inox 60cm Docol","Toalheiro para banheiro?","Inox 304 escovado. 2 suportes com parafusos. Resistente à umidade.",47,"DIY","Material: Inox 304\nComprimento: 60cm\nFixação: 2 suportes",["toalheiro","inox","banheiro","toalha"],89.90,"Prata"),
  p("Banheiro","Porta-papel Higiênico Inox Docol","Porta-papel para banheiro?","Inox escovado com tampa protetora. Fixação na parede com parafusos. Fácil troca do rolo.",47,"DIY","Material: Inox 304\nAcabamento: Escovado\nTampa: Protetora\nFixação: Parafusos",["porta-papel","inox","banheiro","higiene"],59.90),
  p("Banheiro","Saboneteira de Parede Inox Docol","Saboneteira para banheiro?","Saboneteira de pressão em inox escovado. Capacidade 400ml. Fixação na parede.",47,"DIY","Material: Inox 304\nCapacidade: 400ml\nTipo: Pressão\nFixação: Parafusos",["saboneteira","inox","banheiro","sabonete"],79.90),
  p("Banheiro","Ventilador Exaustor para Banheiro 150mm Ventisol","Ventilador para tirar umidade do banheiro?","Exaustor de banheiro para renovação de ar e controle de umidade. Silencioso. Bivolt.",45,"Profissional","Diâmetro: 150mm\nVazão: 155m³/h\nPotência: 18W\nNível de ruído: 40dB",["exaustor","ventilador","banheiro","umidade","ventilação"],129.90),
  p("Banheiro","Torneira para Banheiro Monocomando Deca","Torneira monocomando para lavatório?","Controla água quente e fria em um único comando. Acabamento cromado. Cartucho cerâmico.",44,"Profissional","Tipo: Monocomando\nAcabamento: Cromado\nCartucho: Cerâmico\nFuro: 35mm",["torneira","monocomando","banheiro","cromada"],189.90),
  p("Banheiro","Ralo Quadrado Inox 10x10cm Para Banheiro","Ralo para banheiro e box?","Ralo em inox com grelha quadrada. Sifão cesto removível para limpeza fácil. Anti-mau cheiro.",45,"Profissional","Dimensões: 10x10cm\nMaterial: Inox\nSifão: Cesto removível\nAnti-mau cheiro: Sim",["ralo","inox","banheiro","box","sifão"],49.90),
];

// ─── PINTURA (corredores 48–50) ───────────────────────────────────────────────
const pintura: Produto[] = [
  p("Pintura","Tinta Látex Acrílica Branco Neve 18L Suvinil","Tinta para paredes internas e externas?","Premium com alta cobertura e lavabilidade. Rende até 400m² por lata de 18L.",49,"DIY","Volume: 18L\nAcabamento: Fosco\nRendimento: 400m²\nSecagem: 2h",["tinta","látex","branca","parede","suvinil"],299.90,"Prata"),
  p("Pintura","Tinta Látex Acrílica Fosca 18L Coral","Tinta cor de parede para sala?","Acabamento fosco para sala e quarto. Alta cobertura. Diluição com água.",49,"DIY","Volume: 18L\nAcabamento: Fosco\nRendimento: 350m²\nDemãos: 2",["tinta","látex","fosca","parede","coral"],279.90,"Prata"),
  p("Pintura","Tinta Latex Semibrilho 18L Sherwin-Williams","Tinta semibrilho para cozinha e banheiro?","Semibrilho com alta lavabilidade para cozinhas, banheiros e áreas de alto tráfego.",49,"DIY","Volume: 18L\nAcabamento: Semibrilho\nLavabilidade: Alta\nDemãos: 2",["tinta","semibrilho","cozinha","banheiro","lavável"],319.90,"Prata"),
  p("Pintura","Tinta Esmalte Sintético Brilhante Preto 3.6L Coral","Tinta para grades e metais?","Esmalte brilhante para metais, madeiras e alvenaria. Proteção contra ferrugem.",49,"DIY","Volume: 3.6L\nAcabamento: Brilhante\nRendimento: 40m²\nSecagem: 4h",["tinta","esmalte","preto","grade","metal"],89.90),
  p("Pintura","Tinta Esmalte Sintético Branco 3.6L Suvinil","Esmalte branco para janelas e portas?","Para madeira e metal. Alta durabilidade e resistência à intempéries. Brilho intenso.",49,"DIY","Volume: 3.6L\nAcabamento: Brilhante\nUso: Madeira e metal\nSecagem: 4h",["tinta","esmalte","branco","janela","porta"],89.90),
  p("Pintura","Primer Selador PVA 18L Suvinil","Primer para preparar parede antes de pintar?","Sela poros e uniformiza a absorção. Reduz consumo de tinta. Para paredes novas e reparos.",49,"Profissional","Volume: 18L\nAplicação: Parede interna\nRendimento: 200m²\nSecagem: 4h",["primer","selador","PVA","preparação","parede"],149.90),
  p("Pintura","Massa Corrida PVA 18L Coral","Massa corrida para nivelar paredes?","Regulariza imperfeições e nivela paredes antes da pintura. Para ambientes internos secos.",50,"DIY","Volume: 18L\nRendimento: 20-25m²\nDemãos: 2\nSecagem: 4h",["massa corrida","PVA","nivelamento","parede","pintura"],89.90),
  p("Pintura","Textura Acrílica Grafiato Branco 25kg Suvinil","Textura para fachada?","Para fachadas e paredes externas com efeito grafiato. Impermeável e resistente.",50,"Profissional","Peso: 25kg\nEfeito: Grafiato\nRendimento: 3-5 kg/m²\nImpermeável: Sim",["textura","grafiato","fachada","externo"],149.90,"Prata"),
  p("Pintura","Textura Acrílica Lisa 20kg Suvinil","Textura lisa para paredes?","Acabamento liso para interiores e exteriores. Substitui massa corrida + tinta em uma etapa.",50,"Profissional","Peso: 20kg\nEfeito: Liso\nAplicação: Interno e externo\nRendimento: 4-6 kg/m²",["textura","lisa","parede","acabamento"],119.90,"Prata"),
  p("Pintura","Rolo de Pintura Lã de Carneiro 23cm com Cabo","Rolo para paredes e teto?","Lã para acabamento fosco e acetinado. Cabo extensível incluso. Alta absorção.",48,"DIY","Largura: 23cm\nFibra: Lã\nCabo: Rosqueável\nFios: 12mm",["rolo","pintura","lã","parede","teto"],22.90),
  p("Pintura","Rolo de Pintura Espuma 15cm","Rolo de espuma para tinta esmalte?","Ideal para esmaltes e superfícies lisas. Acabamento sem marcas de fibra.",48,"DIY","Largura: 15cm\nFibra: Espuma\nUso: Esmalte e superfície lisa",["rolo","espuma","esmalte","liso"],12.90),
  p("Pintura","Lixa para Madeira e Massa Grão 80","Lixa grão grosso para madeira?","Grão 80 para desbaste e remoção de material em madeira, massa e primer.",48,"DIY","Grão: 80\nDimensões: 225x275mm\nUso: Desbaste\nUso seco/úmido: Seco",["lixa","grão 80","desbaste","madeira"],2.90),
  p("Pintura","Lixa para Madeira e Massa Grão 120","Lixa para acabamento médio?","Grão 120 para acabamento entre demãos de tinta e lixa final de massa corrida.",48,"DIY","Grão: 120\nDimensões: 225x275mm\nUso: Acabamento médio",["lixa","grão 120","madeira","massa","pintura"],2.90),
  p("Pintura","Lixa para Massa Grão 220","Lixa fina para acabamento final?","Grão 220 para acabamento fino antes da última demão de tinta ou verniz.",48,"DIY","Grão: 220\nDimensões: 225x275mm\nUso: Acabamento fino",["lixa","grão 220","fino","verniz","acabamento"],2.90),
  p("Pintura","Verniz para Madeira Brilhante 900ml Suvinil","Verniz para proteger madeira?","Verniz acrílico para móveis, esquadrias e pisos de madeira. Alta resistência ao desgaste.",50,"DIY","Volume: 900ml\nAcabamento: Brilhante\nRendimento: 20m²\nSecagem: 2h",["verniz","madeira","brilhante","proteção"],59.90),
  p("Pintura","Fita Crepe 18mm x 50m para Pintura","Fita crepe para proteger rodapé?","Fita crepe para delimitação em pintura. Remove sem deixar resíduo. Resistente à tinta.",48,"DIY","Largura: 18mm\nComprimento: 50m\nRemovível: Sem resíduo\nUso: Pintura e acabamento",["fita crepe","mascaramento","pintura","rodapé"],12.90),
  p("Pintura","Trincha 2\" Cerdas Sintéticas","Trincha para cantos e detalhes?","Trincha com cerdas sintéticas para tinta látex e esmalte. Para cantos, molduras e detalhes.",48,"DIY","Largura: 2\"\nCerdas: Sintéticas\nUso: Látex e esmalte\nCabo: Madeira",["trincha","pincel","canto","moldura","detalhe"],14.90),
  p("Pintura","Bandeja para Rolo de Pintura Plástica","Bandeja para mergulhar o rolo?","Bandeja em plástico rígido para carregar o rolo de tinta. Grade antirrespingo.",48,"DIY","Material: Plástico\nCapacidade: 1L\nGrade: Antirrespingo\nCompatível: Rolos até 23cm",["bandeja","rolo","pintura","plástico"],9.90),
];

// ─── CONSTRUÇÃO (corredores 06–08) ────────────────────────────────────────────
const construcao: Produto[] = [
  p("Construção","Cimento CPII-Z 32 50kg Votorantim","Cimento para construção e reboco?","Portland composto para argamassas, rebocos e concreto simples. 32 MPa aos 28 dias.",6,"Profissional","Tipo: CPII-Z 32\nPeso: 50kg\nResistência: 32 MPa\nSaco: Kraft",["cimento","construção","reboco","argamassa"],44.90),
  p("Construção","Areia Média Lavada Saco 20kg","Areia para argamassa e reboco?","Areia classificada para argamassas de reboco e assentamento. Saco 20kg.",7,"Profissional","Granulometria: Média\nPeso: 20kg\nUmidade máx: 5%",["areia","argamassa","reboco","construção"],14.90),
  p("Construção","Brita Nº 1 Saco 20kg","Brita para concreto?","Brita graduada nº1 para preparo de concreto estrutural e não estrutural.",7,"Profissional","Granulometria: Nº1\nPeso: 20kg\nUso: Concreto",["brita","concreto","construção","pedra britada"],17.90),
  p("Construção","Tijolo Cerâmico 6 Furos (unidade)","Tijolo para construir paredes?","Tijolo de cerâmica de 6 furos para paredes internas e externas. Alta resistência.",6,"Profissional","Dimensões: 9x14x19cm\nFuros: 6\nMaterial: Cerâmica\nUso: Paredes",["tijolo","cerâmica","parede","alvenaria"],1.20),
  p("Construção","Bloco de Concreto 14x19x39cm (unidade)","Bloco de concreto para muros?","Bloco estrutural para muros, fundações e paredes externas. Alta resistência à compressão.",6,"Profissional","Dimensões: 14x19x39cm\nMaterial: Concreto\nResistência: 6 MPa\nUso: Estrutural",["bloco","concreto","muro","parede","fundação"],4.90),
  p("Construção","Telha Ondulada Fibrocimento 6mm 2.44m","Telha para cobertura?","Telha fibrocimento para coberturas de galpões, casas e garagens. Leve e resistente.",8,"Profissional","Comprimento: 2.44m\nEspessura: 6mm\nMaterial: Fibrocimento\nOnda: 50mm",["telha","fibrocimento","cobertura","telhado"],39.90),
  p("Construção","Massa de Reboco Interna Saco 20kg Votomassa","Massa de reboco para paredes internas?","Argamassa para reboco interno. Fácil aplicação. Alta aderência. Acabamento liso.",6,"Profissional","Peso: 20kg\nUso: Interno\nRendimento: 20-25kg/m² (10mm)\nSecagem: 24h",["reboco","massa","parede","interna","argamassa"],24.90),
  p("Construção","Impermeabilizante Acrílico 18kg Acqua Proof","Impermeabilizante para laje e terraço?","Manta líquida acrílica para impermeabilização de lajes, terraços e calhas. Elástico.",8,"Profissional","Peso: 18kg\nRendimento: 1kg/m² (2 demãos)\nElasticidade: Alta\nUso: Laje, terraço, calha",["impermeabilizante","laje","terraço","manta líquida"],189.90,"Bronze"),
  p("Construção","Tela de Aço Soldada 10x10cm 1.0m x 2.0m","Tela metálica para reforço de concreto?","Tela soldada galvanizada para reforço de lajes, pisos e contra-pisos. Malha 10x10cm.",7,"Profissional","Dimensões: 1.0x2.0m\nMalha: 10x10cm\nFio: 3.4mm\nMaterial: Aço galvanizado",["tela","aço","reforço","laje","concreto"],89.90),
  p("Construção","Vergalhão Aço CA-50 8mm (barra 12m)","Vergalhão para construção?","Aço nervurado CA-50 para reforço de estruturas de concreto armado. Barra de 12m.",7,"Especialista","Diâmetro: 8mm\nComprimento: 12m\nTipo: CA-50 nervurado\nPeso: 4.7kg",["vergalhão","aço","concreto armado","estrutura"],29.90),
  p("Construção","Tela de Sombreamento 70% 1m x 50m Polipropileno","Tela de sombra para jardim?","Reduz 70% da incidência solar. Para hortas, viveiros, playgrounds e fachadas.",8,"DIY","Largura: 1m\nComprimento: 50m\nSombreamento: 70%\nMaterial: Polipropileno",["tela","sombra","sombreamento","jardim","horta"],149.90,"Bronze"),
  p("Construção","Silicone Neutro Branco Tubo 280g Tekbond","Silicone para vedação de janelas e box?","Vedação e colagem de vidros, boxes, molduras e esquadrias de alumínio. Resistente à água.",8,"DIY","Peso: 280g\nTipo: Neutro\nCor: Branco\nCura: 24h\nResistência: -40°C a +200°C",["silicone","vedação","vidro","box","janela"],18.90),
];

// ─── MAIS FERRAMENTAS ────────────────────────────────────────────────────────
const ferramentas2: Produto[] = [
  p("Ferramentas","Serrote Manual 22\" Tramontina","Serrote para cortar madeira?","Dentes endurecidos por indução. Corte rápido em madeira, MDF e plástico. Cabo ergonômico.",1,"DIY","Comprimento: 22\"\nDentes: Endurecidos por indução\nCabo: Ergonômico\nPasso: 7 dentes/pol",["serrote","madeira","corte","manual"],39.90),
  p("Ferramentas","Arco de Serra para Metal 12\" Tramontina","Arco de serra para metal?","Arco ajustável para lâminas de 300mm. Tensão regulável. Corte em metal e plástico.",1,"DIY","Tamanho: 12\"\nTensão: Regulável\nLâmina: 18 dentes/pol\nMaterial: Aço",["arco de serra","metal","corte","lâmina"],34.90),
  p("Ferramentas","Talha Manual com Corrente 1 Tonelada","Talha para içar cargas pesadas?","Talha de corrente para levantamento de cargas de até 1 tonelada. Gancho giratório.",8,"Profissional","Capacidade: 1 tonelada\nAltura de elevação: 2.5m\nCorrente: Galvanizada\nGancho: Giratório",["talha","corrente","içar","carga","elevação"],299.90),
  p("Ferramentas","Compasso de Corte para Drywall Vonder","Compasso para cortar círculos?","Corta círculos de 30 a 250mm em drywall, gesso e placas finas. Ajuste preciso.",6,"DIY","Diâmetro mín: 30mm\nDiâmetro máx: 250mm\nMaterial: Aço\nUso: Drywall e gesso",["compasso","corte","drywall","círculo"],24.90),
  p("Ferramentas","Esquadro de Alumínio 30cm Starrett","Esquadro para marcação de ângulos?","Corpo em alumínio e régua em aço inox. Para verificar esquadros e marcar 90° em madeira.",2,"DIY","Comprimento: 30cm\nMaterial: Alumínio + Inox\nPrecisão: ±0.1mm\nÂngulo: 90°",["esquadro","medição","alumínio","90 graus","marcação"],59.90),
  p("Ferramentas","Conjunto Brocas Madeira e Metal 10 Peças Vonder","Conjunto brocas para furadeira?","10 brocas de aço rápido HSS para madeira e metal. Compatíveis com mandril 1/2\".",7,"DIY","Peças: 10\nDiâmetros: 2 a 10mm\nMaterial: Aço rápido HSS\nCompatível: Mandril 1/2\"",["broca","conjunto","furadeira","madeira","metal"],49.90),
  p("Ferramentas","Carrinho de Mão Capacidade 80L Tramontina","Carrinho de mão para obra?","Carroceria em polipropileno com estrutura em tubo de aço. Roda pneumática 3.50-8.",8,"Profissional","Capacidade: 80L\nRoda: Pneumática 3.50-8\nCarroceria: Polipropileno\nPeso: 8kg",["carrinho de mão","obra","construção","carroceria"],249.90),
  p("Ferramentas","Andaime Alumínio 1.5m Dobrável","Andaime portátil para pintura?","Andaime dobrável em alumínio. Pés antiderrapantes. Suporta até 150kg. Fácil transporte.",5,"Profissional","Altura: 1.5m\nMaterial: Alumínio\nCapacidade: 150kg\nDobrável: Sim",["andaime","alumínio","pintura","escada","portátil"],399.90),
  p("Ferramentas","Escada Dobrável Alumínio 6 Degraus 1.8m","Escada para uso doméstico?","Escada dobrável para uso doméstico e profissional. 6 degraus. Pés antiderrapantes.",5,"DIY","Altura: 1.8m\nDegraus: 6\nMaterial: Alumínio\nCapacidade: 120kg",["escada","alumínio","dobrável","doméstico"],199.90),
  p("Ferramentas","Escada Extensível Alumínio 7m","Escada para telhados e fachadas?","Extensível de 3.5m a 7m. Travas automáticas de segurança. Pés antiderrapantes.",5,"Profissional","Altura máx: 7m\nAltura mín: 3.5m\nTravas: Automáticas\nCapacidade: 150kg",["escada","extensível","alumínio","telhado","fachada"],499.90),
  p("Ferramentas","Lona Plástica 4x3m 100 Microns","Lona para proteger durante pintura?","Lona polietileno transparente para proteger móveis, pisos e equipamentos durante obras.",8,"DIY","Dimensões: 4x3m\nEspessura: 100 microns\nMaterial: Polietileno\nCor: Transparente",["lona","proteção","pintura","obra","plástico"],19.90),
  p("Ferramentas","Corda de Nylon Trançada 8mm Rolo 50m","Corda para amarração em obras?","Corda de nylon trançada resistente à abrasão e intempéries. Para amarração e elevação.",8,"DIY","Diâmetro: 8mm\nComprimento: 50m\nMaterial: Nylon\nCarga máx: 500kg",["corda","nylon","amarração","obra"],69.90),
  p("Ferramentas","Selante Acrílico Branco Tubo 280g Tekbond","Selante para rejuntar paredes?","Selante acrílico pintável para rejuntamento de frestas em paredes, tetos e rodapés.",8,"DIY","Peso: 280g\nCor: Branco\nPintável: Sim\nCura: 24h",["selante","acrílico","fresta","parede","rejunte"],12.90),
  p("Ferramentas","Luva de Raspa de Couro para Soldagem","Luva de proteção para soldagem?","Luva de couro de raspa para proteção de mãos durante soldagem e trabalhos com calor.",8,"Profissional","Material: Raspa de couro\nComprimeno: 35cm\nUso: Soldagem e calor\nNorma: NR6",["luva","raspa","couro","soldagem","EPI"],29.90),
  p("Ferramentas","Capacete de Segurança Classe B Branco","Capacete para obras?","Capacete de segurança classe B (proteção elétrica). Aba frontal. Jugular inclusa.",8,"Profissional","Classe: B (proteção elétrica)\nMaterial: Polipropileno\nCor: Branco\nNorma: NBR 8221",["capacete","segurança","obra","EPI","proteção"],24.90),
  p("Ferramentas","Óculos de Proteção Incolor Vonder","Óculos de proteção para obras?","Óculos com lente incolor e antirrisco. Proteção lateral. Para obras e laboratórios.",8,"DIY","Lente: Incolor antirrisco\nProteção lateral: Sim\nNorma: ANSI Z87.1\nMaterial: Policarbonato",["óculos","proteção","segurança","obra","EPI"],14.90),
  p("Ferramentas","Máscara Respiratória PFF2 Sem Válvula","Máscara para poeira em obras?","Proteção contra poeiras, névoas e aerossóis. PFF2 (N95). Para obras e serviços gerais.",8,"DIY","Tipo: PFF2 (N95)\nVálvula: Sem\nNorma: NBR 13698\nQuantidade: Unitário",["máscara","respiratória","PFF2","poeira","obra"],8.90),
  p("Ferramentas","Cinto de Ferramentas com 12 Bolsos Tramontina","Cinto porta-ferramentas?","Cinto em lona reforçada com 12 bolsos para organizar ferramentas durante o trabalho.",8,"DIY","Bolsos: 12\nMaterial: Lona reforçada\nFecho: Fivela metálica\nTamanho: Ajustável",["cinto","ferramentas","bolso","organização"],69.90),
  p("Ferramentas","Caixa de Ferramentas Plástica 17\" Vonder","Caixa para guardar ferramentas?","Caixa em plástico resistente com 3 bandejas internas. Trava de segurança e alça.",8,"DIY","Tamanho: 17\"\nBandejas: 3\nMaterial: Polipropileno\nTrava: Sim",["caixa","ferramentas","organização","armazenamento"],79.90),
  p("Ferramentas","Detector de Metais e Fios na Parede Vonder","Detector para encontrar fios e estrutura?","Detecta metais ferrosos, não ferrosos e fios elétricos energizados em paredes.",2,"DIY","Detecta: Metais ferrosos, não ferrosos e fios\nProfundidade: até 38mm\nIndicação: LED e sonoro",["detector","fios","metal","parede","localizador"],89.90),
];

// ─── MAIS ELÉTRICA ────────────────────────────────────────────────────────────
const eletrica2: Produto[] = [
  p("Elétrica","Câmera IP Wifi Interna Full HD Intelbras","Câmera de segurança para casa?","Câmera Full HD 1080p com visão noturna e detecção de movimento. App no celular.",15,"DIY","Resolução: Full HD 1080p\nWifi: 2.4GHz\nVisão noturna: 10m\nDetecção: Movimento",["câmera","segurança","wifi","IP","vigilância"],299.90),
  p("Elétrica","Câmera IP Externa Full HD Intelbras","Câmera de segurança para área externa?","Full HD com IP66 para uso externo. Resistente a chuva e poeira. Visão noturna 20m.",15,"Profissional","Resolução: Full HD 1080p\nIP: 66\nVisão noturna: 20m\nWifi: Sim",["câmera","externa","IP66","segurança","CFTV"],399.90),
  p("Elétrica","Central de Alarme com Discadora Intelbras","Central de alarme para residências?","Central com 8 zonas, discadora para celular e sirene embutida. Para casas e comércios.",15,"Especialista","Zonas: 8\nDiscadora: Celular\nSirene: 110dB embutida\nBateria: Backup",["alarme","central","segurança","discadora"],299.90),
  p("Elétrica","Nobreak 600VA Bivolt SMS","Nobreak para estabilizar energia?","Protege computadores e equipamentos eletrônicos de quedas e variações de tensão.",15,"DIY","Potência: 600VA\nAutonomia: 30min\nTomadas: 3\nBivolt: Sim",["nobreak","UPS","energia","proteção","computador"],399.90),
  p("Elétrica","Estabilizador 300VA Bivolt NHS","Estabilizador para TV e eletrônicos?","Protege TVs, aparelhos de som e eletrodomésticos de variações de tensão.",15,"DIY","Potência: 300VA\nTomadas: 4\nBivolt: Sim\nIndicação: LED",["estabilizador","energia","TV","eletrodoméstico"],119.90),
  p("Elétrica","Painel Solar 400W Fotovoltaico","Painel solar para energia fotovoltaica?","Painel monocristalino de alta eficiência para sistemas de energia solar residencial.",14,"Especialista","Potência: 400W\nTipo: Monocristalino\nEficiência: 21%\nDimensões: 1.7x1.0m",["painel","solar","fotovoltaico","energia","sustentável"],1499.90,"Ouro"),
  p("Elétrica","Inversor Solar On-Grid 3000W Deye","Inversor para energia solar?","Inversor para sistemas solar on-grid. Conecta à rede elétrica. Monitoramento Wi-Fi.",14,"Especialista","Potência: 3000W\nTipo: On-Grid\nMonitoramento: Wi-Fi\nRendimento: 97%",["inversor","solar","on-grid","energia","fotovoltaico"],2499.90,"Ouro"),
  p("Elétrica","Minuteria para Corredor e Escada 6A","Minuteria para acender luz por tempo?","Desliga automaticamente a luz após o tempo ajustado (1 a 7 min). Para corredores.",13,"Profissional","Carga: 6A\nTempo: 1 a 7 min\nCaixa: 4x2\nBivolt: Sim",["minuteria","corredor","escada","automático","tempo"],34.90),
  p("Elétrica","Calha Plástica para Cabos 20x10mm (barra 2m)","Calha para organizar cabos na parede?","Calha plastica com tampa para organizar e proteger cabos elétricos em paredes.",13,"DIY","Dimensões: 20x10mm\nComprimento: 2m\nMaterial: PVC\nCor: Branco",["calha","cabo","organização","PVC","parede"],14.90),
  p("Elétrica","Eletroduto PVC Rígido 3/4\" Barra 3m","Eletroduto para passagem de fios?","Tubo rígido PVC para instalações elétricas em alvenaria e embutido no piso.",12,"Profissional","Diâmetro: 3/4\"\nComprimento: 3m\nMaterial: PVC\nCor: Cinza",["eletroduto","rígido","PVC","fios","instalação"],12.90),
  p("Elétrica","Conector Emenda Rápida para Fios 1-4mm² (pacote 20un)","Conector para emendar fios?","Conector do tipo WAGO para emenda rápida sem solda. Para fios de 1 a 4mm².",9,"DIY","Condutores: 2 fios\nSeção: 1-4mm²\nMaterial: Polipropileno + Bronze\nQuantidade: 20un",["conector","emenda","fio","WAGO","elétrica"],19.90),
  p("Elétrica","Lâmpada de Emergência Segurimax LED 30 LEDs","Lâmpada de emergência para falta de luz?","Acende automaticamente na falta de energia. 30 LEDs. Autonomia 2h. Recarga automática.",14,"DIY","LEDs: 30\nAutonomia: 2h\nRecarga: Automática (quando ligada)\nBivolt: Sim",["emergência","lâmpada","falta de luz","autonomia"],79.90),
  p("Elétrica","Disjuntor Diferencial Residual 30mA Schneider","Disjuntor DR para proteção humana?","Protege contra choques elétricos e correntes de fuga. 30mA ideal para banheiros.",10,"Profissional","Sensibilidade: 30mA\nCorrente: 25A\nPolos: 2\nNorma: IEC 61008",["disjuntor","diferencial","DR","choque","proteção"],89.90),
  p("Elétrica","Transformador Dimmer 127V para 12V 60W","Transformador para lâmpadas 12V?","Transforma 127V para 12V para alimentar lâmpadas dicroicas halogêneas e LEDs 12V.",14,"Profissional","Entrada: 127V\nSaída: 12V\nPotência: 60W\nDimmer: Integrado",["transformador","12V","dicroica","halogênea","dimmer"],59.90),
];

// ─── MAIS HIDRÁULICA ──────────────────────────────────────────────────────────
const hidraulica2: Produto[] = [
  p("Hidráulica","Aquecedor a Gás de Passagem 15L Rinnai","Aquecedor a gás para residência?","Aquece água continuamente para 2-3 chuveiros simultâneos. GLP ou GN. Digital.",20,"Especialista","Capacidade: 15L/min\nGás: GLP ou GN\nControle: Digital\nPiloto: Eletrônico",["aquecedor","gás","passagem","chuveiro","rinnai"],1299.90),
  p("Hidráulica","Torneira Misturadora para Jardim 3/4\" Deca","Torneira para mangueira de jardim?","Torneira com saída para mangueira e registro de fechamento. Resistente a UV.",18,"DIY","Bitola: 3/4\"\nSaída: Para mangueira\nMaterial: Bronze cromado\nUso: Externo",["torneira","jardim","mangueira","3/4"],34.90),
  p("Hidráulica","Kit de Instalação para Chuveiro Hydra","Kit de acessórios para chuveiro?","Kit com suporte articulado, barra de correr 0.9m e mangueira 1.5m para chuveiro.",17,"DIY","Suporte: Articulado\nBarra: 0.9m\nMangueira: 1.5m\nAcabamento: Cromado",["chuveiro","kit","suporte","barra","mangueira"],129.90),
  p("Hidráulica","Ralo Seco 100mm para Piso de Banheiro","Ralo para banheiro sem mau cheiro?","Ralo com tampa vedante que impede o retorno de odores do esgoto mesmo sem água no sifão.",21,"DIY","Diâmetro: 100mm\nTipo: Seco (vedante)\nMaterial: PVC + inox\nInstalação: Piso",["ralo","seco","banheiro","odor","esgoto"],39.90),
  p("Hidráulica","Filtro de Água de Entrada 3/4\" com Vela Tripla Ação","Filtro para melhorar qualidade da água?","Filtra sedimentos, cloro, bactérias e parasitas. Vela tripla ação. Rosca 3/4\".",22,"DIY","Filtração: Sedimentos, cloro, bactérias\nVela: Tripla ação\nBitola: 3/4\"\nCapacidade: 1000L/h",["filtro","água","purificador","cloro","bactérias"],149.90,"Prata"),
  p("Hidráulica","Redutor de Pressão 3/4\" Ajustável Docol","Redutor de pressão para proteger encanamentos?","Reduz e estabiliza a pressão da rede pública para até 3 bar. Evita danos em equipamentos.",22,"Profissional","Bitola: 3/4\"\nFaixa: 1 a 4 bar\nAjuste: Manual\nMaterial: Bronze",["redutor","pressão","encanamento","proteção","água"],89.90),
  p("Hidráulica","Medidor de Vazão de Água Hidrômetro 3/4\"","Hidrômetro para medir consumo?","Hidrômetro residencial para medição de consumo de água fria. Leitura em m³.",22,"Especialista","Bitola: 3/4\"\nLeitura: m³\nClasse: B\nNorma: NBR 8194",["hidrômetro","medidor","água","consumo","vazão"],99.90),
  p("Hidráulica","Torneira de Jardim com Prolongador 1.0m","Torneira em coluna para jardim?","Torneira em coluna de 1.0m para jardins e hortas. Conexão para mangueira. Resistente à ferrugem.",18,"DIY","Altura: 1.0m\nMaterial: PVC\nConexão: Para mangueira\nCor: Verde",["torneira","coluna","jardim","horta"],79.90),
  p("Hidráulica","Chuveiro a Gás Automático Coinox com Instalação","Chuveiro a gás para maior economia?","Aquece instantaneamente com gás. Econômico. Para regiões com gás natural encanado.",16,"Especialista","Potência: 22MJ/h\nGás: GN ou GLP\nVazão: 8L/min\nPiloto: Automático",["chuveiro","gás","automático","economia"],1899.90),
  p("Hidráulica","Torneira de Bóia para Caixa d'Água 1/2\" Amanco","Bóia para controle automático?","Fecha automaticamente quando a caixa atinge o nível máximo. Rosca 1/2\".",22,"DIY","Bitola: 1/2\"\nFlutuador: Bola\nMaterial: Cobre\nBraço: Ajustável",["bóia","caixa d'água","automático","nível","controle"],22.90),
];

// ─── MAIS JARDIM ──────────────────────────────────────────────────────────────
const jardim2: Produto[] = [
  p("Jardim","Semente de Grama Bermuda 1kg","Semente para formar grama?","Grama resistente para jardins, campos e taludes. Boa cobertura e desenvolvimento rápido.",28,"DIY","Tipo: Bermuda\nPeso: 1kg\nCobertura: 50-100m²\nGerminação: 7-14 dias",["semente","grama","bermuda","jardim"],49.90,"Bronze"),
  p("Jardim","Semente de Grama São Carlos 500g","Semente para grama à sombra?","Grama São Carlos tolera sombra parcial. Para jardins com cobertura arbórea.",28,"DIY","Tipo: São Carlos\nPeso: 500g\nCobertura: 25-50m²\nToleração: Sombra parcial",["semente","grama","são carlos","sombra","jardim"],39.90,"Bronze"),
  p("Jardim","Herbicida Glifosato 1L Roundup","Herbicida para matar ervas daninhas?","Herbicida de ação total para eliminação de ervas daninhas em geral. Não residual no solo.",31,"DIY","Volume: 1L\nAção: Total\nResidual no solo: Não\nDiluição: 30ml/L",["herbicida","glifosato","erva daninha","jardim"],59.90),
  p("Jardim","Inseticida Líquido Multi-Insetos 400ml Baygon","Inseticida para pragas domésticas?","Elimina baratas, mosquitos, formigas e outros insetos. Ação rápida por contato.",31,"DIY","Volume: 400ml\nAção: Contato e residual\nInsetos: Múltiplos\nOdor: Suave",["inseticida","barata","mosquito","formiga","praga"],24.90),
  p("Jardim","Fungicida Mancozeb 800g para Plantas","Fungicida para doenças em plantas?","Preventivo para controle de doenças fúngicas em hortaliças, flores e frutíferas.",31,"DIY","Peso: 800g\nTipo: Preventivo\nCompatível: Hortaliças e ornamentais\nDiluição: 25g/10L",["fungicida","mancozeb","doença","planta","fungo"],34.90),
  p("Jardim","Pedra Decorativa Preta 10kg","Pedra para decorar jardim?","Pedra basalto preta para decoração de jardins, vasos e caminhos. Lavada e tratada.",32,"DIY","Peso: 10kg\nCor: Preta\nMaterial: Basalto\nGranulometria: 1-2cm",["pedra","preta","basalto","decorativa","jardim"],34.90),
  p("Jardim","Suporte de Jardim para Vaso Giratório 3 Níveis","Suporte para vasos em vários andares?","Suporte metálico preto com 3 bandejas giratórias. Para varanda e sala de estar.",29,"DIY","Níveis: 3\nGiratório: Sim\nMaterial: Metal\nCor: Preto",["suporte","vaso","jardim","3 andares","varanda"],149.90),
  p("Jardim","Treliça de Madeira 120x60cm para Plantas Trepadeiras","Treliça para plantas trepadeiras?","Treliça de pinus tratado para dar suporte a trepadeiras, feijão e outros vegetais.",29,"DIY","Dimensões: 120x60cm\nMaterial: Pinus tratado\nUso: Trepadeiras\nFixação: Parafusos ou encaixe",["treliça","madeira","trepadeira","suporte","jardim"],59.90),
  p("Jardim","Regador com Borrifador 1L Tramontina","Regador com spray para plantas?","Borrifador de 1L para umidificar folhas, cactos e suculentas. Gatilho ajustável.",26,"DIY","Capacidade: 1L\nTipo: Borrifador com gatilho\nAjuste: Névoa a jato\nMaterial: Plástico",["borrifador","regador","névoa","suculenta","umidificar"],22.90),
  p("Jardim","Balcão de Jardim com Prateleiras 4 Andares Metal","Balcão para organizar vasos?","Balcão em arame galvanizado para organizar vasos em 4 andares. Para varanda e jardim.",32,"DIY","Andares: 4\nMaterial: Arame galvanizado\nCor: Preto\nDimensões: 60x25x150cm",["balcão","jardim","prateleira","varanda","vaso"],199.90),
];

// ─── MAIS PISOS/CERÂMICA ──────────────────────────────────────────────────────
const pisos2: Produto[] = [
  p("Pisos e Cerâmica","Decapante Ácido para Cerâmica 900ml","Decapante para limpar cerâmica após assentamento?","Remove resíduos de argamassa e rejunte de cerâmica e porcelanato. Não corroe o rejunte curado.",35,"DIY","Volume: 900ml\nAção: Ácida\nRemove: Argamassa e rejunte\nDiluição: 1:10 em água",["decapante","ácido","limpeza","cerâmica","argamassa"],19.90),
  p("Pisos e Cerâmica","Impermeabilizante para Rejunte Spray 400ml","Protetor de rejunte?","Impermeabiliza o rejunte após a cura. Evita manchas de gordura e água. Spray fácil aplicação.",36,"DIY","Volume: 400ml\nAplicação: Spray\nSeq: Rejunte curado\nProteção: Manchas e água",["impermeabilizante","rejunte","proteção","manchas"],29.90),
  p("Pisos e Cerâmica","Porcelanato 30x60cm Bianco Acetinado Eliane (cx 1.44m²)","Porcelanato médio formato branco?","Branco brilhante para ambientes que precisam de amplitude visual. PEI 4. Interno.",37,"Profissional","Tamanho: 30x60cm\nCor: Branco acetinado\nPEI: 4\nRendimento: 1.44m²/cx",["porcelanato","branco","30x60","sala","médio"],69.90),
  p("Pisos e Cerâmica","Cerâmica 45x45cm Bege Fosco para Piso (cx 2.0m²)","Cerâmica bege para ambientes?","Cerâmica de piso bege fosco para salas e quartos de médio tráfego. PEI 3.",37,"Profissional","Tamanho: 45x45cm\nCor: Bege fosco\nPEI: 3\nRendimento: 2.0m²/cx",["cerâmica","bege","45x45","piso","sala"],44.90),
  p("Pisos e Cerâmica","Pastilha de Vidro 30x30cm Verde (folha)","Pastilha para piscina e banheiro?","Pastilhas de vidro para revestimento de piscinas, banheiros e saunas. Cor verde.",39,"Profissional","Tamanho: 30x30cm (pastilhas 2.5x2.5cm)\nMaterial: Vidro\nCor: Verde\nUso: Piscina e umidade",["pastilha","vidro","piscina","banheiro","verde"],89.90),
  p("Pisos e Cerâmica","Deck de Madeira Plástica 20x200cm (tabua)","Deck de madeira plástica para varanda?","100% PVC reciclado imita madeira. Resistente a água, cupim e intempéries. Para varandas.",41,"DIY","Tamanho: 20x200cm\nMaterial: Madeira plástica (PVC)\nResistência: Água e cupim\nCor: Castanho",["deck","madeira plástica","varanda","PVC","reciclado"],79.90,"Ouro"),
  p("Pisos e Cerâmica","Cantoneira de Alumínio para Cerâmica 8mm 2.5m","Cantoneira para acabamento de cerâmica?","Cantoneira de alumínio para arremate em quinas e bordas de cerâmica e porcelanato.",42,"DIY","Espessura: 8mm\nComprimento: 2.5m\nMaterial: Alumínio\nAcabamento: Natural ou polido",["cantoneira","alumínio","cerâmica","borda","acabamento"],14.90),
  p("Pisos e Cerâmica","Porcelanato Externo Antiderrapante 60x60cm (cx 2.16m²)","Porcelanato para área externa molhada?","PEI 5 antiderrapante para piscinas, áreas molhadas e externas. Alta resistência ao deslizamento.",38,"Profissional","Tamanho: 60x60cm\nPEI: 5\nAntiderrapante: Sim\nUso: Externo e piscina",["porcelanato","externo","antiderrapante","PEI5","piscina"],119.90),
];

// ─── MAIS BANHEIRO ────────────────────────────────────────────────────────────
const banheiro2: Produto[] = [
  p("Banheiro","Banheira de Imersão Acrílica 140x70cm Branco","Banheira para banheiro?","Banheira de acrílico para imersão. Acabamento brilhante. Inclui sifão e sistema de drenagem.",46,"Especialista","Dimensões: 140x70cm\nMaterial: Acrílico\nCor: Branco\nProfundidade: 35cm",["banheira","imersão","acrílico","banheiro","relaxamento"],1299.90),
  p("Banheiro","Coluna para Lavatório Branco Deca","Coluna para lavatório de piso?","Coluna de louça para suportar lavatório com pé. Esconde os canos de água e esgoto.",44,"Profissional","Material: Louça\nCor: Branco\nInstalação: Piso\nEsconde: Tubulações",["coluna","lavatório","piso","louça"],149.90),
  p("Banheiro","Bancada para Banheiro Granito Branco 60x45cm","Bancada de granito para banheiro?","Bancada em granito branco com furo para cuba. Polida e impermeável. Para banheiros modernos.",44,"Profissional","Dimensões: 60x45cm\nMaterial: Granito branco\nFuro: Para cuba embutir\nAcabamento: Polido",["bancada","granito","banheiro","cuba","mármore"],399.90),
  p("Banheiro","Acessório Porta-Shampoo Cromado para Box","Porta-shampoo para o box?","Porta-shampoo de 2 prateleiras em cromo para fixar no box ou parede. Sem furos.",47,"DIY","Prateleiras: 2\nMaterial: Aço cromado\nFixação: Cola 3M (sem furos)\nCarga: 2kg cada",["porta-shampoo","box","banheiro","cromado"],69.90),
  p("Banheiro","Trava Antifurto para Box de Vidro","Trava de segurança para box?","Trava adicional para portas deslizantes de box. Alumínio. Evita abertura indesejada.",46,"DIY","Material: Alumínio\nTipo: Tranca\nCompatível: Box deslizante\nInstalação: Parafusos",["trava","box","segurança","vidro","banheiro"],29.90),
  p("Banheiro","Banco Dobrável para Box Ducha 40cm Inox","Banco dobrável para banho?","Banco articulado de parede para uso em box. Inox 304. Suporta até 120kg.",46,"Profissional","Largura: 40cm\nMaterial: Inox 304\nCapacidade: 120kg\nDobrável: Sim",["banco","dobrável","box","banho","inox"],199.90,"Prata"),
  p("Banheiro","Torneira de Mesa para Lavabo com Alca Longa","Torneira de mesa para lavabo?","Torneira cromada com alça longa para lavabos de recepção e banheiro social. Econômica.",44,"Profissional","Tipo: Mesa, alça longa\nMaterial: Metal cromado\nFuro: 35mm\nVazão: 4L/min",["torneira","lavabo","mesa","cromada","alça"],149.90),
  p("Banheiro","Ralo Linear Inox 60cm para Banheiro","Ralo linear moderno para banheiro?","Ralo linear escovado para banheiros modernos. Grelha removível. Largura 6cm.",45,"Profissional","Comprimento: 60cm\nLargura: 6cm\nMaterial: Inox\nGrelha: Removível",["ralo","linear","inox","moderno","banheiro"],149.90),
];

// ─── MAIS CONSTRUÇÃO ──────────────────────────────────────────────────────────
const construcao2: Produto[] = [
  p("Construção","Concreto Usinado em Sacos 40kg Votomassa","Concreto pronto para pequenas obras?","Mistura pronta de cimento, areia e brita. Adicione apenas água. Para fundações e pilares.",6,"Profissional","Peso: 40kg\nResistência: 20 MPa\nDiluição: Apenas água\nPronto: 20 min após mistura",["concreto","usinado","pronto","fundação","pilar"],24.90),
  p("Construção","Viga de Eucalipto Tratado 10x5cm Barra 6m","Viga de madeira tratada para construção?","Eucalipto tratado contra fungos e cupins para estruturas de telhado e coberturas.",7,"Profissional","Dimensões: 10x5cm\nComprimento: 6m\nMadeira: Eucalipto\nTratamento: CCB",["viga","madeira","eucalipto","telhado","estrutura"],89.90,"Bronze"),
  p("Construção","Manta Asfáltica Aluminizada 10m x 1m","Manta para impermeabilização de telhado?","Manta autoadesiva com face aluminizada para impermeabilizar telhados, calhas e sacadas.",8,"Profissional","Comprimento: 10m\nLargura: 1m\nFace: Aluminizada\nTipo: Autoadesiva",["manta","asfáltica","telhado","impermeabilização","calha"],189.90),
  p("Construção","Tela Metálica Soldada para Reboco 1m x 25m","Tela para reforço de reboco?","Tela galvanizada para reforçar reboco de fachadas e paredes. Evita fissuras.",7,"Profissional","Comprimento: 25m\nLargura: 1m\nMalha: 15x15mm\nFio: 0.8mm galvanizado",["tela","reboco","galvanizada","reforço","fachada"],89.90),
  p("Construção","Perfil de Alumínio Calha 100mm Barra 3m","Perfil de alumínio para calha?","Perfil U de alumínio para calhas de telhado e condutores de água pluvial. 3m.",8,"Profissional","Largura: 100mm\nComprimento: 3m\nMaterial: Alumínio\nEspessura: 1.5mm",["calha","alumínio","telhado","chuva","condutor"],59.90),
  p("Construção","Selante MS Polímero Cinza 280g Tekbond","Selante elástico para juntas de movimento?","Selante polimérico para juntas de dilatação, fachadas e estruturas. Durável e elástico.",8,"Profissional","Peso: 280g\nCor: Cinza\nElasticidade: 300%\nPintável: Após cura",["selante","MS","junta","dilatação","fachada"],28.90),
  p("Construção","Argamassa de Alta Performance para Fachada 20kg","Argamassa para revestimento de fachada?","Argamassa industrializada para revestimento de fachadas. Resistente à chuva e vento.",6,"Profissional","Peso: 20kg\nUso: Fachada\nRendimento: 25-30kg/m²\nEspessura: 20mm",["argamassa","fachada","revestimento","externo"],34.90),
  p("Construção","Telha Shingle Asphalt 2m² por fardo","Telha shingle para cobertura?","Telha asfáltica americana com granulados minerais. Elegante, leve e impermeável.",8,"Profissional","Cobertura: 2m² por fardo\nMaterial: Asfalto + granulados\nGarantia: 20 anos\nPeso: 13kg/m²",["telha","shingle","cobertura","americana","asfalto"],129.90),
  p("Construção","Rufo Galvanizado para Muro 25cm x 3m","Rufo para acabamento de muro?","Chapa galvanizada para proteção do topo de muros e paredes. Evita infiltração.",8,"Profissional","Largura: 25cm\nComprimento: 3m\nMaterial: Chapa galvanizada\nEspessura: 0.43mm",["rufo","galvanizado","muro","acabamento","infiltração"],39.90),
  p("Construção","Parafuso Ancla Fixação Parede Concreto 6x50mm (cx 100)","Parafuso para fixar na parede?","Parafuso com bucha para fixação em paredes de concreto, alvenaria e gesso. Conjunto.",7,"DIY","Diâmetro: 6mm\nComprimento: 50mm\nBucha: Inclusa\nQuantidade: 100 conjuntos",["parafuso","bucha","fixação","parede","concreto"],19.90),
];

// ─── expansão pra 1000 produtos + categoria Decoração ────────────────────────
// Gera variações combinando tipo de produto x marca/variante — mesmo padrão de
// dados dos produtos acima, só que gerado programaticamente pra atingir volume.
function gerarLinha(
  categoria: string,
  corredores: number[],
  baseNome: string,
  pergunta: string,
  respostaFn: (marca: string, variante: string) => string,
  specsFn: (variante: string) => string,
  tagsBase: string[],
  complPool: Complexidade[],
  precoMin: number,
  precoMax: number,
  variantes: string[],
  marcas: string[],
  sustPool: Sustentabilidade[] = ["N/A"]
): Produto[] {
  const out: Produto[] = [];
  for (const variante of variantes) {
    for (const marca of marcas) {
      const nome = `${baseNome} ${variante} ${marca}`;
      const preco = Math.round((precoMin + Math.random() * (precoMax - precoMin)) * 100) / 100;
      out.push(p(
        categoria, nome, pergunta, respostaFn(marca, variante),
        pick(corredores), pick(complPool), specsFn(variante),
        [...tagsBase, variante.toLowerCase().replace(/\s+/g, "-")],
        preco, pick(sustPool)
      ));
    }
  }
  return out;
}

function gerarExpansao(): Produto[] {
  const out: Produto[] = [];

  // ═══ FERRAMENTAS (+39, corredores 1-8) ═══
  out.push(...gerarLinha(
    "Ferramentas", [1,2,3,4,8], "Chave de Fenda",
    "Chave de fenda para uso geral?",
    (m, v) => `Chave de fenda ponta ${v} com cabo emborrachado antiderrapante, aço cromo-vanádio. ${m}.`,
    (v) => `Ponta: ${v}\nMaterial: Aço Cr-V\nCabo: Emborrachado`,
    ["chave de fenda", "manual"], ["DIY"], 9.90, 29.90,
    ["3mm","5mm","6mm","8mm"], ["Tramontina","Vonder","Stanley","Bosch","Makita"]
  ));
  out.push(...gerarLinha(
    "Ferramentas", [3,4,5], "Furadeira de Bancada",
    "Furadeira de bancada para oficina?",
    (m, v) => `Furadeira de bancada ${v} para furos precisos em madeira e metal. ${m}.`,
    (v) => `Potência: ${v}\nMandril: 13mm\nVelocidades: 5\nBase: Fixa`,
    ["furadeira", "bancada", "oficina"], ["Profissional","Especialista"], 349.90, 899.90,
    ["350W","450W","550W","650W"], ["Vonder","Bosch","Makita","Skil","Lynus"]
  ).slice(0, 20));
  out.splice(39); // mantém exatamente +39

  // ═══ ELÉTRICA (+56, corredores 9-15) ═══
  const eletricaExt: Produto[] = [];
  eletricaExt.push(...gerarLinha(
    "Elétrica", [9,10], "Fita Isolante 19mm x 10m",
    "Fita isolante colorida para identificar circuitos?",
    (m, v) => `Fita isolante PVC cor ${v.toLowerCase()} para emendas e identificação de fase. ${m}.`,
    (v) => `Cor: ${v}\nLargura: 19mm\nComprimento: 10m\nTensão: até 600V`,
    ["fita isolante", "emenda"], ["DIY"], 6.90, 14.90,
    ["Preta","Branca","Vermelha","Azul","Amarela","Verde"], ["3M","Vonder","Tramontina"]
  ));
  eletricaExt.push(...gerarLinha(
    "Elétrica", [11], "Tomada Dupla 2P+T 10A",
    "Tomada dupla para instalar na parede?",
    (m, v) => `Tomada dupla padrão NBR 14136, acabamento ${v.toLowerCase()}. ${m}.`,
    (v) => `Cor: ${v}\nCorrente: 10A\nTensão: 250V\nPadrão: NBR 14136`,
    ["tomada", "dupla", "instalação"], ["Profissional"], 19.90, 39.90,
    ["Branca","Preta","Bege","Cinza"], ["Pial Legrand","Tramontina","Weg","Fame"]
  ));
  eletricaExt.push(...gerarLinha(
    "Elétrica", [11, 14], "Lâmpada Dicroica Halógena 50W",
    "Lâmpada dicroica para spot?",
    (m, v) => `Lâmpada dicroica halógena 50W, base ${v}, para spots direcionáveis. ${m}.`,
    (v) => `Potência: 50W\nBase: ${v}\nÂngulo: 36°\nBivolt: Sim`,
    ["dicroica", "halógena", "spot"], ["DIY"], 8.90, 19.90,
    ["GU10","MR16","AR111"], ["Osram","Philips","Empalux","Taschibra","Avant"]
  ));
  eletricaExt.push(...gerarLinha(
    "Elétrica", [12], "Cabo Flexível 4mm² 750V",
    "Cabo mais grosso para chuveiro e ar-condicionado?",
    (m, v) => `Cabo flexível 4mm² cor ${v.toLowerCase()}, rolo de 100m, para circuitos de maior corrente. ${m}.`,
    (v) => `Seção: 4mm²\nCor: ${v}\nTensão: 750V\nCorrente máx: 28A`,
    ["cabo", "4mm", "flexível"], ["Profissional"], 219.90, 289.90,
    ["Preto","Azul","Vermelho","Verde/Amarelo"], ["Prysmian","Sil","Cobrecom"]
  ));
  out.push(...eletricaExt.slice(0, 56));

  // ═══ HIDRÁULICA (+59, corredores 16-22) ═══
  const hidraulicaExt: Produto[] = [];
  hidraulicaExt.push(...gerarLinha(
    "Hidráulica", [18], "Torneira de Cozinha",
    "Torneira para pia de cozinha?",
    (m, v) => `Torneira de cozinha estilo ${v.toLowerCase()}, acabamento cromado, bica alta giratória. ${m}.`,
    (v) => `Estilo: ${v}\nMaterial: Metal cromado\nFuro instalação: 35mm`,
    ["torneira", "cozinha"], ["Profissional"], 149.90, 649.90,
    ["Gourmet","Parede","Bancada","Filtro Acoplado","Retrátil"], ["Docol","Deca","Lorenzetti","Fabrimar"]
  ));
  hidraulicaExt.push(...gerarLinha(
    "Hidráulica", [17], "Registro de Gaveta Bronze",
    "Registro para controlar água em bitola específica?",
    (m, v) => `Registro de gaveta em bronze, bitola ${v}, resistente à corrosão. ${m}.`,
    (v) => `Bitola: ${v}\nMaterial: Bronze\nPressão máx: 10 bar`,
    ["registro", "gaveta", "bronze"], ["Profissional"], 24.90, 89.90,
    ['1/2"','1"','1.1/2"','2"'], ["Deca","Docol","Blukit"]
  ));
  hidraulicaExt.push(...gerarLinha(
    "Hidráulica", [19], "Tubo PVC Soldável (barra 6m)",
    "Tubo PVC para diâmetro específico de encanamento?",
    (m, v) => `Tubo PVC soldável ${v} para água fria, barra de 6m. ${m}.`,
    (v) => `Diâmetro: ${v}\nComprimento: 6m\nPadrão: NBR 5648`,
    ["tubo", "PVC", "encanamento"], ["Profissional"], 24.90, 129.90,
    ["20mm","25mm","32mm","40mm","50mm","60mm"], ["Tigre","Amanco","Krona"]
  ));
  hidraulicaExt.push(...gerarLinha(
    "Hidráulica", [19,20], "Conexão Joelho 90° PVC",
    "Joelho para mudar direção do cano?",
    (m, v) => `Joelho 90° soldável ${v} para mudança de direção em instalações de água fria. ${m}.`,
    (v) => `Diâmetro: ${v}\nÂngulo: 90°\nMaterial: PVC`,
    ["joelho", "PVC", "conexão"], ["DIY"], 2.90, 12.90,
    ["20mm","25mm","32mm","40mm"], ["Tigre","Amanco","Krona","Plastilit"]
  ));
  out.push(...hidraulicaExt.slice(0, 59));

  // ═══ ILUMINAÇÃO (+80, corredores 23-25) ═══
  const iluminacaoExt: Produto[] = [];
  iluminacaoExt.push(...gerarLinha(
    "Iluminação", [23], "Lâmpada LED Bulbo",
    "Lâmpada LED com potência específica?",
    (m, v) => `Lâmpada LED bulbo ${v}, base E27, luz branca. ${m}.`,
    (v) => `Potência: ${v}\nBase: E27\nVida útil: 15.000h`,
    ["lâmpada", "LED", "bulbo"], ["DIY"], 9.90, 34.90,
    ["5W","7W","9W","12W","15W","20W"], ["Philips","Osram","Taschibra","Avant","Empalux","Kian"],
    ["N/A","Ouro"]
  ));
  iluminacaoExt.push(...gerarLinha(
    "Iluminação", [25], "Fita LED",
    "Fita LED para sanca e decoração?",
    (m, v) => `Fita LED ${v.toLowerCase()}, adesivo 3M, ideal para sancas e móveis. ${m}.`,
    (v) => `Especificação: ${v}\nTensão: 12V\nDensidade: 60 LEDs/m`,
    ["fita LED", "sanca"], ["DIY"], 39.90, 89.90,
    ["3m Branco Frio","5m Branco Quente","5m RGB","10m Branco Frio"], ["Taschibra","Intelbras","Avant","Kian"]
  ));
  iluminacaoExt.push(...gerarLinha(
    "Iluminação", [23,24], "Luminária Pendente",
    "Luminária pendente para sala de jantar?",
    (m, v) => `Luminária pendente estilo ${v.toLowerCase()}, base E27, cabo têxtil ajustável. ${m}.`,
    (v) => `Estilo: ${v}\nBase: E27\nCabo: Têxtil ajustável`,
    ["luminária", "pendente"], ["DIY","Profissional"], 89.90, 299.90,
    ["Industrial","Minimalista","Rústica","Moderna","Vintage"], ["Taschibra","Avant","Startec","Bella Iluminação"]
  ));
  iluminacaoExt.push(...gerarLinha(
    "Iluminação", [24], "Spot de Embutir LED",
    "Spot de embutir com potência específica?",
    (m, v) => `Spot LED de embutir ${v}, para forro de gesso, luz neutra. ${m}.`,
    (v) => `Potência: ${v}\nFuro: 75mm\nTemperatura: 4000K`,
    ["spot", "embutir", "LED"], ["Profissional"], 19.90, 49.90,
    ["5W","7W","9W","12W"], ["Taschibra","Avant","Save Energy","Kian"]
  ));
  out.push(...iluminacaoExt.slice(0, 80));

  // ═══ JARDIM (+64, corredores 26-32) ═══
  const jardimExt: Produto[] = [];
  jardimExt.push(...gerarLinha(
    "Jardim", [29], "Vaso de Cerâmica",
    "Vaso de cerâmica para plantas em tamanho específico?",
    (m, v) => `Vaso de cerâmica ${v} para plantas internas e externas. ${m}.`,
    (v) => `Diâmetro: ${v}\nMaterial: Cerâmica\nDreno: Sim`,
    ["vaso", "cerâmica", "plantas"], ["DIY"], 19.90, 149.90,
    ["15cm","20cm","25cm","30cm","40cm"], ["Vasart","Vonder","N.Pot","Terracota Brasil"]
  ));
  jardimExt.push(...gerarLinha(
    "Jardim", [28], "Adubo Fertilizante",
    "Adubo específico para tipo de planta?",
    (m, v) => `Fertilizante ${v} para jardins, hortas e vasos. ${m}.`,
    (v) => `Fórmula: ${v}\nApresentação: Granulado ou pó\nUso: Jardim e horta`,
    ["adubo", "fertilizante"], ["DIY"], 14.90, 44.90,
    ["NPK 04-14-08","NPK 10-10-10","Composto Orgânico","Húmus de Minhoca","Farinha de Osso"],
    ["Forth","Vitaplan","Turfa Fértil","Basacote"],
    ["N/A","Prata","Ouro"]
  ));
  jardimExt.push(...gerarLinha(
    "Jardim", [30], "Ferramenta de Jardinagem Manual",
    "Ferramenta manual para cuidar do jardim?",
    (m, v) => `${v} para cultivo e manutenção de jardins e hortas, cabo ergonômico. ${m}.`,
    (v) => `Tipo: ${v}\nMaterial: Aço carbono\nCabo: Ergonômico`,
    ["jardinagem", "manual", "ferramenta"], ["DIY"], 19.90, 49.90,
    ["Pá de Mão","Garfo de Mão","Cultivador Manual","Ancinho de Mão","Transplantador"],
    ["Tramontina","Vonder","Bellota"]
  ));
  jardimExt.push(...gerarLinha(
    "Jardim", [27], "Mangueira de Jardim",
    "Mangueira em comprimento específico?",
    (m, v) => `Mangueira de jardim ${v}, resistente a UV e torções. ${m}.`,
    (v) => `Comprimento: ${v}\nDiâmetro: 1/2"\nPressão máx: 4 bar`,
    ["mangueira", "jardim", "rega"], ["DIY"], 39.90, 129.90,
    ["10m","15m","20m","25m","30m"], ["Tramontina","Vonder"]
  ));
  out.push(...jardimExt.slice(0, 64));

  // ═══ PISOS E CERÂMICA (+67, corredores 33-43) ═══
  const pisosExt: Produto[] = [];
  pisosExt.push(...gerarLinha(
    "Pisos e Cerâmica", [38], "Porcelanato",
    "Porcelanato em formato específico?",
    (m, v) => `Porcelanato ${v}, acabamento acetinado, alta resistência ao tráfego. ${m}.`,
    (v) => `Tamanho: ${v}\nPEI: 4\nAcabamento: Acetinado`,
    ["porcelanato", "piso"], ["Profissional"], 59.90, 189.90,
    ["60x60cm","80x80cm","90x90cm","120x60cm","30x60cm"],
    ["Portobello","Eliane","Cecafi","Delta","Villagres"],
    ["N/A","Prata"]
  ));
  pisosExt.push(...gerarLinha(
    "Pisos e Cerâmica", [40,41], "Piso Vinílico",
    "Piso vinílico em sistema específico?",
    (m, v) => `Piso vinílico sistema ${v.toLowerCase()}, resistente à água. ${m}.`,
    (v) => `Sistema: ${v}\nImpermeável: Sim`,
    ["vinílico", "piso"], ["DIY"], 39.90, 79.90,
    ["Régua Click 4mm","Régua Colado 2mm","Manta 3mm","Placa Click 5mm"],
    ["Tarkett","Durafloor","Eucafloor"]
  ));
  pisosExt.push(...gerarLinha(
    "Pisos e Cerâmica", [36], "Rejunte Flexível 1kg",
    "Rejunte de cor específica?",
    (m, v) => `Rejunte flexível cor ${v.toLowerCase()} para cerâmica e porcelanato. ${m}.`,
    (v) => `Cor: ${v}\nPeso: 1kg\nJunta: 1 a 10mm`,
    ["rejunte", "junta"], ["DIY"], 11.90, 19.90,
    ["Branco","Cinza Platina","Grafite","Bege","Marrom","Cristal"], ["Quartzolit","Portokoll","Fortaleza"]
  ));
  pisosExt.push(...gerarLinha(
    "Pisos e Cerâmica", [35], "Argamassa Colante 20kg",
    "Argamassa em classificação específica?",
    (m, v) => `Argamassa colante ${v} para assentamento de cerâmica e porcelanato. ${m}.`,
    (v) => `Tipo: ${v}\nPeso: 20kg\nRendimento: 4-7kg/m²`,
    ["argamassa", "colante"], ["Profissional"], 29.90, 64.90,
    ["AC-I","AC-II","AC-III","Flexível"], ["Quartzolit","Votorantim","Fortaleza"]
  ));
  out.push(...pisosExt.slice(0, 67));

  // ═══ BANHEIRO (+72, corredores 44-47) ═══
  const banheiroExt: Produto[] = [];
  banheiroExt.push(...gerarLinha(
    "Banheiro", [45], "Vaso Sanitário",
    "Vaso sanitário em modelo específico?",
    (m, v) => `Vaso sanitário modelo ${v.toLowerCase()}, dual flush, louça branca. ${m}.`,
    (v) => `Modelo: ${v}\nFlush: Dual 3/6L\nCor: Branco`,
    ["vaso", "sanitário"], ["Profissional"], 349.90, 999.90,
    ["Caixa Acoplada","Convencional","Suspenso","Com Bidê Integrado"], ["Deca","Celite","Roca","Icasa"],
    ["N/A","Prata"]
  ));
  banheiroExt.push(...gerarLinha(
    "Banheiro", [44], "Cuba de Apoio",
    "Cuba de apoio em formato específico?",
    (m, v) => `Cuba de apoio ${v.toLowerCase()} para bancada de banheiro, visual moderno. ${m}.`,
    (v) => `Formato: ${v}\nMaterial: Louça\nInstalação: Apoio`,
    ["cuba", "apoio", "banheiro"], ["Profissional"], 129.90, 399.90,
    ["Redonda","Oval","Quadrada","Retangular","Esculpida"], ["Deca","Celite","Roca","Compace"]
  ));
  banheiroExt.push(...gerarLinha(
    "Banheiro", [44], "Torneira de Banheiro",
    "Torneira de banheiro em estilo específico?",
    (m, v) => `Torneira de banheiro estilo ${v.toLowerCase()}, acabamento cromado. ${m}.`,
    (v) => `Estilo: ${v}\nMaterial: Metal cromado\nFuro: 35mm`,
    ["torneira", "banheiro"], ["Profissional"], 119.90, 449.90,
    ["Monocomando Alta","Monocomando Baixa","Parede","Cascata","Bica Baixa"], ["Deca","Docol","Fabrimar","Lorenzetti"]
  ));
  banheiroExt.push(...gerarLinha(
    "Banheiro", [47], "Acessório Metálico para Banheiro",
    "Acessório de metal para organizar o banheiro?",
    (m, v) => `${v} em metal cromado, fixação por parafusos. ${m}.`,
    (v) => `Tipo: ${v}\nMaterial: Metal cromado\nFixação: Parafusos`,
    ["acessório", "banheiro", "metálico"], ["DIY"], 39.90, 119.90,
    ["Toalheiro Duplo","Porta Escova","Cabide Duplo","Saboneteira de Parede","Papeleira"],
    ["Docol","Deca","Compace","Ducon"]
  ));
  out.push(...banheiroExt.slice(0, 72));

  // ═══ PINTURA (+74, corredores 48-50) ═══
  const pinturaExt: Produto[] = [];
  pinturaExt.push(...gerarLinha(
    "Pintura", [49], "Tinta Látex Acrílica 18L",
    "Tinta látex de cor específica?",
    (m, v) => `Tinta látex acrílica cor ${v.toLowerCase()}, acabamento fosco, alta cobertura. ${m}.`,
    (v) => `Cor: ${v}\nVolume: 18L\nRendimento: 350-400m²`,
    ["tinta", "látex", "parede"], ["DIY"], 219.90, 349.90,
    ["Branco Neve","Areia","Azul Sereno","Verde Sálvia","Cinza Urbano","Amarelo Canário","Rosa Quartzo"],
    ["Suvinil","Coral","Sherwin-Williams","Metalatex"],
    ["N/A","Prata"]
  ));
  pinturaExt.push(...gerarLinha(
    "Pintura", [49], "Tinta Esmalte Sintético 3.6L",
    "Esmalte sintético de cor específica?",
    (m, v) => `Tinta esmalte sintético cor ${v.toLowerCase()} para madeira e metal. ${m}.`,
    (v) => `Cor: ${v}\nVolume: 3.6L\nAcabamento: Brilhante`,
    ["tinta", "esmalte", "metal"], ["DIY"], 69.90, 109.90,
    ["Branco","Preto","Vermelho","Azul","Verde","Marrom"], ["Suvinil","Coral","Eucatex"]
  ));
  pinturaExt.push(...gerarLinha(
    "Pintura", [50], "Verniz para Madeira 900ml",
    "Verniz em acabamento específico?",
    (m, v) => `Verniz acrílico acabamento ${v.toLowerCase()} para móveis e pisos de madeira. ${m}.`,
    (v) => `Acabamento: ${v}\nVolume: 900ml\nRendimento: 20m²`,
    ["verniz", "madeira"], ["DIY"], 44.90, 74.90,
    ["Brilhante","Acetinado","Fosco"], ["Suvinil","Sherwin-Williams","Montana"]
  ));
  pinturaExt.push(...gerarLinha(
    "Pintura", [48], "Ferramenta de Pintura",
    "Acessório para aplicar tinta?",
    (m, v) => `${v} para aplicação de tinta látex e esmalte. ${m}.`,
    (v) => `Tipo: ${v}\nUso: Látex e esmalte`,
    ["pintura", "ferramenta", "rolo"], ["DIY"], 9.90, 24.90,
    ["Rolo Lã 23cm","Rolo Espuma 15cm",'Trincha 1"','Trincha 3"','Pincel Chato 2"'],
    ["Tigre Tintas","Condor","Atlas"]
  ));
  pinturaExt.push(...gerarLinha(
    "Pintura", [50], "Massa e Textura para Parede",
    "Massa ou textura para preparar parede?",
    (m, v) => `${v} para preparação e acabamento de paredes internas e externas. ${m}.`,
    (v) => `Produto: ${v}\nAplicação: Parede`,
    ["massa", "textura", "parede"], ["DIY","Profissional"], 79.90, 159.90,
    ["Massa Corrida PVA 18L","Massa Acrílica 18L","Textura Grafiatada 25kg","Textura Lisa 20kg"],
    ["Suvinil","Coral"]
  ));
  out.push(...pinturaExt.slice(0, 74));

  // ═══ CONSTRUÇÃO (+72, corredores 6-8) ═══
  const construcaoExt: Produto[] = [];
  construcaoExt.push(...gerarLinha(
    "Construção", [6], "Cimento 50kg",
    "Cimento em tipo específico?",
    (m, v) => `Cimento Portland tipo ${v} para argamassas, rebocos e concreto. ${m}.`,
    (v) => `Tipo: ${v}\nPeso: 50kg\nSaco: Kraft`,
    ["cimento", "construção"], ["Profissional"], 34.90, 54.90,
    ["CPII-E 32","CPII-Z 32","CPIII-40","CPV-ARI"], ["Votorantim","Cauê","Itambé","Nassau"]
  ));
  construcaoExt.push(...gerarLinha(
    "Construção", [6,7], "Tijolo/Bloco (unidade)",
    "Tijolo ou bloco para levantar parede?",
    (m, v) => `${v} para paredes internas e externas, alta resistência.`,
    (v) => `Tipo: ${v}\nUso: Alvenaria`,
    ["tijolo", "bloco", "alvenaria"], ["Profissional"], 1.20, 6.90,
    ["Tijolo Cerâmico 6 Furos","Tijolo Cerâmico 8 Furos","Bloco de Concreto 9cm","Bloco de Concreto 14cm","Bloco de Concreto 19cm"],
    ["Padrão","Vazado","Reforçado"]
  ));
  construcaoExt.push(...gerarLinha(
    "Construção", [7], "Vergalhão de Aço CA-50",
    "Vergalhão em diâmetro específico?",
    (m, v) => `Vergalhão de aço CA-50 nervurado, diâmetro ${v}, para reforço estrutural.`,
    (v) => `Diâmetro: ${v}\nTipo: CA-50 nervurado`,
    ["vergalhão", "aço", "estrutura"], ["Especialista"], 19.90, 89.90,
    ["6.3mm","8mm","10mm","12.5mm","16mm"], ["6m","12m"]
  ));
  construcaoExt.push(...gerarLinha(
    "Construção", [8], "Telha",
    "Telha em material específico?",
    (m, v) => `Telha ${v.toLowerCase()} para cobertura de casas e galpões. ${m}.`,
    (v) => `Material: ${v}\nUso: Cobertura`,
    ["telha", "cobertura", "telhado"], ["Profissional"], 24.90, 149.90,
    ["Fibrocimento 6mm","Cerâmica Colonial","Metálica Termoacústica","Shingle Asfáltica","Policarbonato Alveolar"],
    ["Brasilit","Eternit","Isodren","Onduline"]
  ));
  construcaoExt.push(...gerarLinha(
    "Construção", [8], "Selante e Argamassa de Construção",
    "Selante ou argamassa para acabamento de obra?",
    (m, v) => `${v} para vedação e acabamento em obras e reformas. ${m}.`,
    (v) => `Produto: ${v}`,
    ["selante", "argamassa", "construção"], ["Profissional"], 19.90, 199.90,
    ["Selante PU","Selante MS","Argamassa de Reboco 20kg","Impermeabilizante Acrílico 18L"],
    ["Tekbond","Vedacit","Sika"]
  ));
  out.push(...construcaoExt.slice(0, 72));

  // ═══ DECORAÇÃO (+100, nova categoria — corredores 48-50, mesma zona de Pintura) ═══
  const decoracaoExt: Produto[] = [];
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Quadro Decorativo",
    "Quadro para decorar parede?",
    (m, v) => `Quadro decorativo tema ${v.toLowerCase()}, moldura inclusa, pronto para pendurar.`,
    (v) => `Tema: ${v}\nMoldura: Inclusa`,
    ["quadro", "decorativo", "parede"], ["DIY"], 49.90, 199.90,
    ["Abstrato","Botânico","Geométrico","Preto e Branco","Tipográfico","Paisagem"],
    ["30x40cm","40x60cm","50x70cm"]
  ));
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Almofada Decorativa",
    "Almofada para sofá e cama?",
    (m, v) => `Almofada decorativa estampa ${v.toLowerCase()}, capa removível com zíper.`,
    (v) => `Estampa: ${v}\nCapa: Removível`,
    ["almofada", "sofá", "decorativa"], ["DIY"], 29.90, 89.90,
    ["Lisa","Listrada","Geométrica","Floral","Texturizada","Boho"],
    ["40x40cm","45x45cm","50x50cm"]
  ));
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Tapete",
    "Tapete para sala ou quarto?",
    (m, v) => `Tapete estilo ${v.toLowerCase()}, antiderrapante, fácil limpeza.`,
    (v) => `Estilo: ${v}\nAntiderrapante: Sim`,
    ["tapete", "sala", "decoração"], ["DIY"], 99.90, 399.90,
    ["Shaggy","Sisal","Kilim","Retangular Liso","Redondo Boho"],
    ["1,50x2,00m","2,00x2,50m","1,20x1,80m"]
  ));
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Espelho Decorativo",
    "Espelho para decorar parede?",
    (m, v) => `Espelho decorativo formato ${v.toLowerCase()}, pronto para pendurar.`,
    (v) => `Formato: ${v}\nInstalação: Parede`,
    ["espelho", "decorativo", "parede"], ["DIY"], 79.90, 349.90,
    ["Redondo","Sol","Orgânico","Retangular com Moldura","Veneziano"],
    ["40cm","60cm","80cm"]
  ));
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Vaso Decorativo",
    "Vaso decorativo para interiores?",
    (m, v) => `Vaso decorativo em ${v.toLowerCase()}, para composições internas.`,
    (v) => `Material: ${v}`,
    ["vaso", "decorativo", "interior"], ["DIY"], 39.90, 149.90,
    ["Cerâmica Fosca","Cimento Queimado","Vidro Fumê","Cerâmica Texturizada"],
    ["Pequeno","Médio","Grande"]
  ));
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Luminária de Mesa Decorativa",
    "Luminária de mesa para decoração?",
    (m, v) => `Luminária de mesa estilo ${v.toLowerCase()}, acabamento decorativo. ${m}.`,
    (v) => `Estilo: ${v}\nUso: Mesa e cabeceira`,
    ["luminária", "mesa", "decoração"], ["DIY"], 89.90, 249.90,
    ["Industrial","Articulada","Cúpula em Tecido","Minimalista LED"],
    ["Startec","Taschibra","Bella Iluminação"]
  ));
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Cortina",
    "Cortina para sala ou quarto?",
    (m, v) => `Cortina tipo ${v.toLowerCase()}, inclui trilho ou varão.`,
    (v) => `Tipo: ${v}\nInclui: Trilho ou varão`,
    ["cortina", "sala", "quarto"], ["DIY"], 89.90, 249.90,
    ["Blackout Lisa","Voil Transparente","Rústica em Linho","Persiana Rolô"],
    ["2,00x2,60m","3,00x2,60m"]
  ));
  decoracaoExt.push(...gerarLinha(
    "Decoração", [48,49,50], "Porta-Retrato",
    "Porta-retrato para fotos?",
    (m, v) => `Porta-retrato tamanho ${v}, acabamento decorativo. ${m}.`,
    (v) => `Tamanho: ${v}`,
    ["porta-retrato", "decoração"], ["DIY"], 19.90, 49.90,
    ["10x15cm","13x18cm","15x21cm"], ["Kapos","Prestige"]
  ));
  out.push(...decoracaoExt.slice(0, 100));

  return out;
}

// ─── junta tudo e salva ───────────────────────────────────────────────────────
const todos: Produto[] = [
  ...ferramentas, ...eletrica, ...hidraulica, ...iluminacao,
  ...jardim, ...pisos, ...banheiro, ...pintura, ...construcao,
  ...ferramentas2, ...eletrica2, ...hidraulica2, ...jardim2,
  ...pisos2, ...banheiro2, ...construcao2,
  ...extra(),
  ...gerarExpansao(),
];

function extra(): Produto[] {
  const list: Produto[] = [];

  // FERRAMENTAS extras
  const tools = [
    ["Pistola de Ar Comprimido 1/4\" Tramontina","Para limpar peças e equipamentos com ar?","Pistola de sopro para limpeza de peças, equipamentos e superfícies. Entrada 1/4\".",8,"DIY","Entrada: 1/4\" BSP\nPressão: até 8 bar\nVazão: 200L/min",["pistola","ar comprimido","sopro","limpeza"],49.90],
    ["Compressor de Ar 8.5 PCM 25L Schulz","Compressor para pregar e pintar?","Compressor portátil para pregos, pintura e ferramentas pneumáticas. 8.5 PCM.",5,"Profissional","PCM: 8.5\nTanque: 25L\nPressão: 8 bar\nPotência: 2HP",["compressor","ar","pneumático","pintura","prego"],899.90],
    ["Pistola de Calor 2000W Vonder","Pistola de calor para decapagem?","Para decapar tintas, dobrar PVC, encolher embalagens e soldar materiais plásticos.",5,"Profissional","Potência: 2000W\nTemperatura: 350°C e 550°C\nVazão: 400 L/min\nModos: 2",["pistola","calor","decapagem","tinta"],129.90],
    ["Multímetro Digital Vonder","Multímetro para medir tensão e corrente?","Mede tensão AC/DC, corrente, resistência e continuidade. Indispensável para eletricistas.",9,"Profissional","Tensão: até 600V AC/DC\nCorrente: até 10A\nResistência: até 20MΩ\nDisplay: LCD 3.5 dígitos",["multímetro","digital","tensão","corrente","elétrica"],79.90],
    ["Enrolador de Mangueira de Parede 25m Tramontina","Enrolador para mangueira?","Enrolador de parede com mangueira 25m inclusa. Retração automática. Conexão rápida.",27,"DIY","Mangueira: 25m 1/2\"\nRetração: Automática\nConexão: Rápida\nInstalação: Parede",["enrolador","mangueira","parede","automático"],249.90],
    ["Selante de Silicone Transparente 280g Tekbond","Silicone transparente para box e janelas?","Vedação transparente para box de banheiro, aquários, vidros e janelas. Fungicida.",8,"DIY","Peso: 280g\nCor: Transparente\nFungicida: Sim\nCura: 24h",["silicone","transparente","box","janela","vedação"],18.90],
    ["Fita Dupla Face Espumada 24mm x 3m Tekbond","Fita dupla face para fixação?","Fita dupla face com espuma para fixar espelhos, quadros, painéis e decorações.",8,"DIY","Largura: 24mm\nComprimento: 3m\nSuporta: até 5kg/m\nSuperfícies: Planas e lisas",["fita","dupla face","espumada","fixação","espelho"],14.90],
    ["Cola de Contato Extra Forte 175g Tekbond","Cola de contato para sapatos e borracha?","Cola extra forte para borracha, couro, madeira e materiais porosos. Resistente à água.",8,"DIY","Peso: 175g\nAplicação: Pincel\nTempo em aberto: 15 min\nResistente: Água",["cola","contato","borracha","couro","madeira"],22.90],
    ["Adesivo Epoxi Bicomponente 50g Loctite","Epoxi para colar metal e pedra?","Cola epóxi de dois componentes para metal, pedra, cerâmica e madeira. Resistência de 200kg.",8,"DIY","Peso: 2x25g\nCura: 5 min\nResistência: 200kg\nCompatível: Metal, pedra, cerâmica",["epóxi","bicomponente","metal","pedra","cola forte"],24.90],
    ["Grampeador Manual para Tapeçaria e Tapete Tramontina","Grampeador para tapete e tapeçaria?","Grampeador manual para fixar tapetes, forros de parede e tapeçaria. Grampos 6/8/10mm.",8,"DIY","Grampos: 6, 8 e 10mm\nUso: Tapete e tapeçaria\nEsforço: Baixo\nCapacidade: 100 grampos",["grampeador","tapete","tapeçaria","grampo"],34.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco] of tools) {
    list.push(p("Ferramentas", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number));
  }

  // ELÉTRICA extras
  const elItems = [
    ["Lâmpada LED Tubular T8 18W 120cm Bivolt Avant","Lâmpada fluorescente LED para calha?","Substitui fluorescente de 40W. Bivolt. Para calhas e luminárias industriais.",23,"DIY","Potência: 18W\nEquivalência: 40W\nComprimento: 120cm\nBase: G13\nBivolt",["lâmpada","tubular","T8","calha","LED"],29.90],
    ["Tomada de Solo para Jardim à Prova D'água","Tomada externa para jardim?","Tomada de solo IP44 para jardim, terraço e área externa. Tampa protetora.",13,"Profissional","IP: 44\nTomadas: 2\nInstalação: Solo ou parede\nTampa: Protetora",["tomada","solo","jardim","IP44","externo"],79.90],
    ["Fio Terra Multifilar 4mm² Verde/Amarelo 50m","Fio terra para instalação elétrica?","Fio terra multifilar na cor padrão verde e amarelo. Para aterramento de quadros e equipamentos.",12,"Profissional","Seção: 4mm²\nCor: Verde/Amarelo\nComprimento: 50m\nTensão: 750V",["fio terra","aterramento","verde amarelo","elétrica"],89.90],
    ["Régua de Tomadas 5 Saídas + USB com Fusível","Régua com protetor para escritório?","5 tomadas + 2 USB com fusível de proteção. Cabo 1.8m. Para escritório e home office.",9,"DIY","Tomadas: 5 + 2 USB\nFusível: Protetor\nCabo: 1.8m\nCorrente: 10A",["régua","tomadas","USB","fusível","escritório"],79.90],
    ["Exaustor Industrial 30cm 220V Ventisol","Exaustor para cozinha comercial?","Exaustor axial de alta vazão para cozinhas comerciais, galpões e indústrias. 220V.",15,"Especialista","Diâmetro: 30cm\nVazão: 1200m³/h\nRuído: 52dB\nTensão: 220V",["exaustor","industrial","cozinha","galpão","ventilação"],299.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco] of elItems) {
    list.push(p("Elétrica", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number));
  }

  // PISOS extras
  const pisosExtra = [
    ["Porcelanato Retificado 90x90cm Cinza (cx 1.62m²)","Porcelanato grande formato moderno?","Grandes formatos para ambientes contemporâneos. Junta mínima de 1.5mm. Retificado.",38,"Especialista","Tamanho: 90x90cm\nCor: Cinza\nAcabamento: Fosco\nJunta: 1.5mm",["porcelanato","90x90","cinza","retificado","grande"],189.90,"Prata"],
    ["Pedra Miracema para Calçada 20x10cm (m²)","Pedra para calçada e pátio?","Pedra miracema (paralelepípedo) para calçadas, pátios e jardins. Durável e natural.",33,"Profissional","Tamanho: 20x10cm\nMaterial: Pedra natural\nUso: Calçada e pátio\nRendimento: por m²",["pedra","miracema","calçada","pátio","jardim"],59.90],
    ["Borracha de Vedação para Piso Vinílico 2m","Mata-juntas para piso vinílico?","Perfil de borracha para vedação entre piso vinílico e rodapé. Evita infiltrações.",41,"DIY","Comprimento: 2m\nMaterial: Borracha\nCor: Cinza\nLargura: 15mm",["borracha","vedação","vinílico","mata-juntas"],14.90],
    ["Cerâmica Subway Branca 10x30cm para Parede (cx 1.47m²)","Cerâmica tipo metrô para cozinha?","Cerâmica retangular estilo metrô para cozinha, banheiro e lavabo. Brilhante.",37,"Profissional","Tamanho: 10x30cm\nCor: Branco brilhante\nEstilo: Subway/Metrô\nRendimento: 1.47m²/cx",["cerâmica","subway","metrô","cozinha","banheiro"],54.90],
    ["Porcelanato Granilite 60x60cm Branco (cx 2.16m²)","Porcelanato estilo granilite?","Imita o cimento granilite com pontos coloridos. Acabamento matte sofisticado.",38,"Profissional","Tamanho: 60x60cm\nEstilo: Granilite\nAcabamento: Matte\nPEI: 4",["porcelanato","granilite","cimento","matte","moderno"],99.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco, sust] of pisosExtra) {
    list.push(p("Pisos e Cerâmica", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number, (sust ?? "N/A") as Sustentabilidade));
  }

  // PINTURA extras
  const pintExtra = [
    ["Tinta para Piso 3.6L Cinza Suvinil","Tinta para piso de concreto?","Tinta específica para pisos de concreto e alvenaria. Alta resistência ao tráfego e abrasão.",50,"DIY","Volume: 3.6L\nAcabamento: Semibrilho\nSuperfície: Concreto\nRendimento: 18m²",["tinta","piso","concreto","cinza","resistente"],119.90],
    ["Tinta Multiuso Spray Preto Fosco 340ml Colorgin","Spray para pintar objetos e metais?","Spray multiuso para retocar e pintar objetos, grades, móveis e equipamentos em geral.",48,"DIY","Volume: 340ml\nCor: Preto fosco\nSecagem: 30 min\nUso: Geral",["spray","tinta","preto","fosco","multiuso"],22.90],
    ["Tinta Spray para Madeira Efeito Amadeirado 400ml","Spray que imita madeira?","Spray que cria efeito amadeirado em superfícies lisas. Para madeira, metal e plástico.",48,"DIY","Volume: 400ml\nEfeito: Amadeirado\nSuperfícies: Madeira, metal\nSecagem: 30 min",["spray","amadeirado","madeira","efeito","decoração"],29.90],
    ["Esmalte em Pó para Madeira 250g Cascorez","Pó de esmalte para madeira?","Pó para preparo de esmalte para madeira. Mistura com aguarrás. Alta cobertura.",50,"Profissional","Peso: 250g\nDiluição: Aguarrás\nAcabamento: Brilhante\nRendimento: 15m²",["esmalte","pó","madeira","cobertura"],34.90],
    ["Tinta para Telhado 3.6L Telha Colonial Suvinil","Tinta específica para telhas?","Para telhas cerâmicas, de fibrocimento e de concreto. Impermeabiliza e renova a cor.",50,"DIY","Volume: 3.6L\nCor: Telha colonial\nSuperfície: Telhas\nRendimento: 20m²",["tinta","telhado","telha","impermeabilizante","coral"],149.90],
    ["Tinta Aquarela para Parede 18L Efeito Bicolor Suvinil","Tinta para parede com efeito especial?","Cria efeito de duas cores na mesma parede. Aplicação com rolo especial incluso.",49,"Profissional","Volume: 18L\nEfeito: Bicolor\nRolo especial: Incluso\nRendimento: 30m²",["tinta","aquarela","bicolor","efeito","parede"],399.90],
    ["Impermeabilizante Cimentício Bicomponente 18kg","Impermeabilizante para laje e cisterna?","Bicomponente em pó e líquido para impermeabilização rígida de cisternas, caixas d'água e lajes.",50,"Profissional","Peso: 18kg (pó + líquido)\nAplicação: Cimentício bicomponente\nUso: Cisternas e caixas\nCura: 7 dias",["impermeabilizante","cimentício","cisterna","laje","bicomponente"],249.90],
    ["Rolo de Lã para Pintura Textura 23cm","Rolo para aplicar textura?","Rolo de espuma grossa para aplicação de texturas acrílicas. Cria efeito irregular.",48,"DIY","Largura: 23cm\nFibra: Espuma textura\nUso: Textura acrílica\nEfeito: Irregular",["rolo","textura","espuma","aplicação","parede"],18.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco] of pintExtra) {
    list.push(p("Pintura", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number));
  }

  // HIDRÁULICA extras
  const hidExtra = [
    ["Tubo PPR 25mm para Água Quente (barra 3m)","Tubo PPR para água quente?","Tubo PPR classe 20 para instalações de água quente e fria. Solda por termofusão.",19,"Profissional","Diâmetro: 25mm\nClasse: 20 (quente e frio)\nComprimento: 3m\nSolda: Termofusão",["tubo","PPR","quente","termofusão","encanamento"],29.90],
    ["Joelho 90° PPR 25mm para Água Quente","Joelho PPR para mudança de direção?","Joelho 90° em PPR para instalações de água quente e fria. Termofusão.",19,"DIY","Diâmetro: 25mm\nÂngulo: 90°\nMaterial: PPR\nSolda: Termofusão",["joelho","PPR","90 graus","quente","frio"],8.90],
    ["Bomba Centrífuga 0.5 HP para Piscina Schneider","Bomba para circulação de piscina?","Bomba centrífuga para circulação de água em piscinas de até 60.000L. 220V.",22,"Especialista","Potência: 0.5 HP\nVazão: 7.5m³/h\nTensão: 220V\nUso: Piscinas",["bomba","piscina","centrífuga","circulação"],799.90],
    ["Aquecedor Solar para Piscina Kit 5 Placas","Aquecedor solar para piscina?","Kit com 5 placas coletoras solares para piscinas de até 20.000L. Instalação simples.",22,"Especialista","Placas: 5\nCapacidade: até 20.000L\nTipo: Coletor solar\nConexão: 1.5\"",["aquecedor","solar","piscina","placa","energia"],1499.90,"Ouro"],
    ["Kit Torneira e Sifão para Tanque","Kit completo para tanque de lavanderia?","Kit com torneira de bancada e sifão PVC para instalação de tanque de lavanderia.",21,"DIY","Conteúdo: Torneira + sifão\nTipo: Para tanque\nMaterial: Metal cromado + PVC",["torneira","sifão","tanque","lavanderia","kit"],79.90],
    ["Mangote Flexível Inox 1/2\" 30cm para Ligação","Mangote para ligação de torneiras?","Mangote trançado em inox para ligar torneiras ao encanamento. Rosca 1/2\" x 1/2\".",17,"DIY","Comprimento: 30cm\nBitola: 1/2\"\nMaterial: Inox trançado\nConexão: Rosca",["mangote","inox","torneira","ligação"],19.90],
    ["Válvula de Esfera Inox 3/4\" Alavanca","Registro de esfera para água e gás?","Válvula de esfera em inox para interrupção de fluxo de água e gases. Abertura total.",17,"Profissional","Bitola: 3/4\"\nMaterial: Inox\nTipo: Esfera\nAcionamento: Alavanca",["válvula","esfera","inox","gás","água"],49.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco, sust] of hidExtra) {
    list.push(p("Hidráulica", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number, (sust ?? "N/A") as Sustentabilidade));
  }

  // ILUMINAÇÃO extras
  const ilumExtra = [
    ["Luminária Pendente Industrial E27 Preta","Luminária industrial para cozinha?","Luminária estilo industrial em metal preto. Para cozinhas, bares e ambientes modernos.",23,"DIY","Base: E27\nMaterial: Metal\nCor: Preto\nCabo: Têxtil 1m",["luminária","industrial","pendente","E27","preto"],149.90],
    ["Plafon LED 36W Redondo Embutir Bivolt","Plafon de embutir para teto?","Plafon LED com driver integrado. Embutir em forros de gesso. Bivolt. Luz neutra.",24,"Profissional","Potência: 36W\nDiâmetro: 40cm\nLED: Integrado\nTemperatura: 4000K\nBivolt",["plafon","LED","embutir","teto","gesso"],129.90,"Prata"],
    ["Mancebo com Lâmpada LED 5W para Banheiro","Mancebo luminoso para banheiro?","Luminária de parede com LED 5W integrado. Para espelhos de banheiro e toaletes.",23,"DIY","Potência: 5W\nLED: Integrado\nAcabamento: Cromado\nUso: Banheiro e espelho",["mancebo","banheiro","LED","espelho","parede"],119.90],
    ["Lâmpada LED Filamento Vintage E27 4W 2200K","Lâmpada decorativa de filamento?","Lâmpada com visual vintage de filamento. Luz quente 2200K. Para decoração e ambientes de design.",23,"DIY","Potência: 4W\nTemperatura: 2200K\nBase: E27\nFilamento: Carbono LED",["lâmpada","filamento","vintage","decoração","E27"],29.90],
    ["Sensor Crepuscular para Acender Luz à Noite","Sensor que acende luz ao escurecer?","Sensor que liga automaticamente as luzes ao entardecer e desliga ao amanhecer. Externo.",25,"DIY","Tipo: Crepuscular\nCarga: 1000W\nInstalação: Externo\nBivolt: Sim",["sensor","crepuscular","automático","noite","externo"],39.90,"Prata"],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco, sust] of ilumExtra) {
    list.push(p("Iluminação", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number, (sust ?? "N/A") as Sustentabilidade));
  }

  // JARDIM extras
  const jardimExtra = [
    ["Cerca Viva Kit Plantio Clorofito 6 Mudas","Plantas para cerca viva?","Kit com 6 mudas de clorofito para formar cerca viva natural. Crescimento rápido.",29,"DIY","Mudas: 6 unidades\nEspécie: Clorofito\nAltura inicial: 20cm\nCrescimento: Rápido",["cerca","viva","planta","muda","jardim"],39.90,"Ouro"],
    ["Bomba Submersível para Fontes 800L/h","Bomba para fontes e lagos?","Bomba submersível para fontes decorativas, lagos e filtragem. 800L/h.",27,"DIY","Vazão: 800L/h\nAltura máx: 1.2m\nPotência: 10W\nFio: 3m",["bomba","submersível","fonte","lago","jardim"],89.90],
    ["Guarda-chuva de Jardim Ombrelone 2.5m","Ombrelone para jardim e varanda?","Ombrelone com mastro central em alumínio. Lona em poliéster com proteção UV. Diâmetro 2.5m.",32,"DIY","Diâmetro: 2.5m\nMaterial mastro: Alumínio\nLona: Poliéster\nUV: Sim",["ombrelone","guarda-chuva","jardim","varanda","UV"],399.90],
    ["Corda de Varal de Plástico 10m com Gancho","Corda de varal para roupas?","Corda em polipropileno trançado para varal de roupas. Com 2 ganchos de fixação.",26,"DIY","Comprimento: 10m\nMaterial: Polipropileno\nGanchos: 2\nDiâmetro: 6mm",["corda","varal","roupas","plástico","fixação"],19.90],
    ["Carrinho de Jardim Dobrável com Assentos 2 Lugares","Carrinho dobrável para jardim?","Carrinho de jardim dobrável para transportar ferramentas e plantas. 2 assentos opcionais.",30,"DIY","Capacidade: 100kg\nAssentos: 2 (dobráveis)\nRodas: 4\nMaterial: Alumínio + tecido",["carrinho","jardim","dobrável","transporte","assentos"],499.90],
    ["Temporizador Mecânico para Irrigação Tramontina","Timer para rega automática?","Temporizador que abre e fecha a torneira automaticamente. Para rega programada. Sem bateria.",31,"DIY","Programação: Mecânica\nCiclos: 1 por dia\nDuração: 1 a 120 min\nConexão: 3/4\"",["timer","irrigação","temporizador","automático","rega"],99.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco, sust] of jardimExtra) {
    list.push(p("Jardim", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number, (sust ?? "N/A") as Sustentabilidade));
  }

  // BANHEIRO extras
  const banhExtra = [
    ["Suporte para Papel Higiênico de Chão Cromado","Suporte de papel higiênico de piso?","Suporte de chão em cromado. Para banheiros sem espaço para furar parede. Moderno.",47,"DIY","Material: Metal cromado\nInstalação: Piso\nFuro: Não necessário\nCor: Cromado",["suporte","papel higiênico","chão","banheiro","moderno"],79.90],
    ["Esponha de Aço Inox para Limpeza Geral 50g","Esponja de aço para limpeza?","Esponja de aço inox para limpeza de fogões, pias e superfícies resistentes. Não enferruja.",47,"DIY","Peso: 50g\nMaterial: Inox\nUso: Fogão e pia\nNão enferruja: Sim",["esponja","aço","inox","limpeza","fogão"],6.90],
    ["Cortina para Box de Banho 1.40x1.80m","Cortina para box de banheiro?","Cortina de PVC semi-transparente para box sem vidro. Inclui trilho e 12 ganchos.",46,"DIY","Dimensões: 1.40x1.80m\nMaterial: PVC\nTrilho: Incluso\nGanchos: 12",["cortina","box","banheiro","PVC","chuveiro"],49.90],
    ["Saboneteira Líquida de Pressão para Bancada","Saboneteira de pressão para bancada?","Saboneteira de 300ml em cromado para bancada de banheiro. Fácil de recarregar.",47,"DIY","Capacidade: 300ml\nMaterial: Metal cromado\nTipo: Pressão\nInstalação: Bancada",["saboneteira","bancada","cromado","pressão","banheiro"],59.90],
    ["Porta Toalha de Papel Inox para Parede","Porta-papel toalha para banheiro?","Porta-papel toalha de papel em inox escovado. Para cozinhas e banheiros. Parafusos incluso.",47,"DIY","Material: Inox escovado\nInstalação: Parede\nCapacidade: 1 rolo\nFixação: Parafusos",["porta-toalha","papel","inox","parede","banheiro"],49.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco] of banhExtra) {
    list.push(p("Banheiro", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number));
  }

  // CONSTRUÇÃO extras
  const constExtra = [
    ["Tela de Alambrado Fio 12 Malha 7.5cm 1m x 10m","Tela para cerca?","Tela de arame galvanizado para cercas, viveiros e quadras. Fio 12, malha 7.5cm.",7,"Profissional","Altura: 1m\nComprimento: 10m\nFio: 12\nMalha: 7.5cm\nGalvanizado: Sim",["tela","cerca","alambrado","galvanizado","viveiro"],129.90],
    ["Mourão de Eucalipto Tratado 10cm x 3m","Mourão para cerca?","Mourão de eucalipto tratado para cercas rurais e decorativas. Resistente à umidade.",7,"Profissional","Diâmetro: 10cm\nComprimento: 3m\nMadeira: Eucalipto\nTratamento: CCB",["mourão","cerca","eucalipto","rural","tratado"],39.90,"Bronze"],
    ["Portão de Aço Galvanizado Sanfonado 3m","Portão sanfonado para garagem?","Portão sanfonado galvanizado para garagens de até 3m. Trava e trilhos incluso.",8,"Profissional","Largura: 3m\nAltura: 2m\nMaterial: Aço galvanizado\nTipo: Sanfonado",["portão","garagem","sanfonado","galvanizado"],1999.90],
    ["Tinta para Piscina Epóxi 3.6L Azul Coral","Tinta específica para piscina?","Epóxi bicomponente para piscinas de alvenaria. Alta resistência à água e cloro.",6,"Especialista","Volume: 3.6L\nTipo: Epóxi bicomponente\nCor: Azul piscina\nRendimento: 18m²",["tinta","piscina","epóxi","azul","alvenaria"],349.90],
    ["Lona Agrícola Preta 4m x 50m","Lona preta para canteiro e jardim?","Lona de polietileno preta para canteiros, jardins e contenção de calor. 100 microns.",8,"DIY","Dimensões: 4x50m\nEspessura: 100 microns\nMaterial: Polietileno\nCor: Preto",["lona","preta","canteiro","jardim","polietileno"],149.90],
    ["Piso de Borracha Antifadiga 50x50cm","Tapete antifadiga para oficina?","Tapete modular de borracha para oficina, academia e cozinha. Antifadiga e antiderrapante.",6,"DIY","Tamanho: 50x50cm\nEspessura: 12mm\nMaterial: Borracha\nAntiderrapante: Sim",["piso","borracha","antifadiga","oficina","academia"],39.90],
  ] as const;

  for (const [nome, perg, resp, corr, compl, specs, tags, preco, sust] of constExtra) {
    list.push(p("Construção", nome as string, perg as string, resp as string, corr as number, compl as Complexidade, specs as string, tags as unknown as string[], preco as number, (sust ?? "N/A") as Sustentabilidade));
  }

  return list;
}

// garante IDs únicos sequenciais (já foram atribuídos no momento da criação)
const outPath = path.join(process.cwd(), "data", "produtos.json");

// Preserva embeddings já calculados: produtos existentes (mesmo id + mesmo
// embedding_text) não perdem o embedding gerado pela API do Gemini — evita
// ter que recalcular os 1000 do zero, só os novos ficam com embedding: [].
let reaproveitados = 0;
try {
  const anterior = JSON.parse(fs.readFileSync(outPath, "utf-8")) as Produto[];
  const porId = new Map(anterior.map((p) => [p.id, p]));
  for (const produto of todos) {
    const velho = porId.get(produto.id);
    if (velho && velho.embedding?.length > 0 && velho.embedding_text === produto.embedding_text) {
      produto.embedding = velho.embedding;
      reaproveitados++;
    }
  }
} catch {
  // primeira geração, sem arquivo anterior — segue com embedding: [] em tudo
}

fs.writeFileSync(outPath, JSON.stringify(todos, null, 2), "utf-8");
console.log(`✅ ${todos.length} produtos gerados em data/produtos.json (${reaproveitados} embeddings reaproveitados, ${todos.length - reaproveitados} pendentes)`);
