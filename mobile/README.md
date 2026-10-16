# Leroy • NEXT — aplicativo mobile

App React Native + Expo para Android. O Next.js da raiz continua sendo o site, o painel da equipe e o backend de IA. A interface mobile usa componentes nativos.

Para publicar o backend e distribuir o APK, siga [`docs/mobile/PUBLICACAO.md`](../docs/mobile/PUBLICACAO.md).

## Rodar localmente

Na raiz do repositório:

```powershell
npm ci
npm --prefix mobile ci
npm run mobile:setup
npm run dev:lan
```

Em outro terminal, na mesma raiz:

```powershell
npm run mobile:dev
```

O setup preserva as variáveis existentes e preenche apenas as ausentes. Cria segredos de sessão/equipe em `.env.local`, e o endereço do backend em `mobile/.env`. Se selecionar o IP de uma interface incorreta, corrija `EXPO_PUBLIC_API_URL` em `mobile/.env`. O celular precisa alcançar esse endereço; `localhost` no celular não aponta para o notebook. Permita a porta 3000 na rede privada do Windows quando solicitado.

Para um endereço específico: `node scripts/configurar-mobile.mjs http://192.168.0.10:3000`. O script não substitui uma URL já preenchida.

Abra no Expo Go para explorar busca, câmera, lista, projetos e mapa. O SDK do Expo Go instalado precisa ser compatível com o SDK deste projeto. Notificações exigem build própria; o app informa essa limitação ao tentar ativá-las no Expo Go.

Depois de instalar uma development build, execute `npm run start:dev-client` dentro de `mobile/` para conectar essa build ao Metro e testar push. O comando padrão `npm run mobile:dev` usa Expo Go para a primeira exploração.

## Fluxos implementados

- Busca pelo backend existente, com fallback explícito de busca textual em uma seleção do catálogo.
- Câmera e galeria, com conversão para JPEG e compressão antes da análise por IA.
- Identificação de produto e diagnóstico de problema usando as APIs existentes.
- Leitura de QR de produto/corredor, sem abrir URLs arbitrárias.
- Ficha de produto com cache local, mapa e pedido de ajuda.
- Lista persistente offline, quantidades, checklist e compartilhamento pelo sistema.
- Projetos gerados pela IA, etapas, materiais e projetos salvos offline.
- Calculadora offline de tinta e piso reutilizando as fórmulas do site.
- Sessão anônima de sete dias, guardada em SecureStore.
- Atendimento entre dispositivos, com atualização periódica quando a tela está aberta.
- Lembrete local da lista e navegação pelo toque na notificação. Registro de push remoto disponível como opção futura, desligada por padrão.
- Feedback tátil ao adicionar/coletar produtos e ler QR.

Os projetos adicionam uma unidade de cada produto escolhido à lista: as quantidades recomendadas ficam visíveis para conferência manual. Preços e estoque são do catálogo acadêmico. A planta é ilustrativa e não há rastreamento indoor, AR, pagamento ou sincronização de conta/carrinho com o site.

## Painel da equipe

1. Faça login em `/funcionario/login`.
2. Abra **Atendimento Mobile**, em `/funcionario/mobile`.
3. Informe o valor de `MOBILE_ADMIN_KEY` de `.env.local` (em produção, a chave definida no servidor).
4. O visitante abre um produto e pede ajuda pelo celular.
5. Clique em **Estou a caminho** e, depois, **Concluir atendimento**.

O painel mantém a chave apenas em memória; atualizar a página exige informá-la novamente. As APIs mobile exigem essa chave adicional da equipe. A fila do aplicativo é separada das conversas e atendimentos da versão web.

## Backend para o evento

Hospede o Next.js com suporte às rotas Node.js e aos arquivos de `data/`. Configure as chaves de IA existentes e:

```dotenv
MOBILE_SESSION_SECRET=<segredo aleatório com 32 caracteres ou mais>
MOBILE_ADMIN_KEY=<outro segredo aleatório com 32 caracteres ou mais>
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=<chave sb_secret exclusivamente do servidor>
```

Execute [`supabase.sql`](../docs/mobile/supabase.sql) no SQL Editor do Supabase. As tabelas têm RLS e não permitem acesso público. O servidor usa a chave secreta; ela nunca deve ter prefixo `EXPO_PUBLIC_`. A chave JWT antiga também funciona via `SUPABASE_SERVICE_ROLE_KEY`. A chave pública não é necessária neste fluxo: o app acessa o banco pelas APIs Next.js.

Em `mobile/.env`, configure `EXPO_PUBLIC_API_URL=https://leroy-merlin.vercel.app`. Essa variável é pública e fica embutida no bundle. Para testar mudanças do backend antes de publicar, use o IP do notebook no lugar da URL da Vercel. Reinicie o Expo após mudanças. Em produção não há fallback para arquivo: sem banco configurado, o atendimento devolve erro de configuração.

## Gerar o APK e configurar push

**A primeira versão não exige Firebase.** Push remoto fica desligado por padrão (`EXPO_PUBLIC_PUSH_ENABLED=false` ou ausente). O atendimento atualiza pela própria tela enquanto aberta; o lembrete local da lista pode ser usado na build instalada, com autorização do aparelho.

Dentro de `mobile/`:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
```

O projeto já está vinculado a `@fbrcmgg/leroy-next-mobile`; o ID público está em `app.config.ts` e pode ser sobrescrito por `EXPO_PUBLIC_EAS_PROJECT_ID`. Os perfis preview/production já usam o backend `https://leroy-merlin.vercel.app` e mantêm o push remoto desligado. Confira o identificador `br.com.fiap.leroynext` antes de criar outra configuração de assinatura.

**Opcional, para uma versão futura com push:** configure um projeto Firebase, baixe o `google-services.json`, mantenha fora do Git, e defina `GOOGLE_SERVICES_JSON` como variável de arquivo no ambiente da build EAS. Configure também a credencial FCM v1 no EAS e defina `EXPO_PUBLIC_PUSH_ENABLED=true` no ambiente usado para gerar o app, alterando também o valor do perfil escolhido em `mobile/eas.json`. O JSON privado da conta de serviço FCM fica somente no EAS; não deve ser incluído no app. Gere uma nova build e teste em celular físico.

```powershell
# Desenvolvimento com recursos nativos e ferramentas de depuração
npx eas-cli@latest build --platform android --profile development
# APK autônomo para os visitantes, sem depender do Metro
npx eas-cli@latest build --platform android --profile preview
```

Os perfis preview e production estão configurados para APK Android e não precisam do notebook rodando Metro. As funções de IA e atendimento precisam do backend hospedado. Push é entregue pelo Expo/FCM; um ticket aceito não garante entrega. Esta versão mostra falhas imediatas de envio no painel e mantém a atualização consultável pelo app, mas ainda não implementa processamento posterior de receipts/reenvio automático.

## QR de instalação e etiquetas

Configure no backend:

```dotenv
MOBILE_ANDROID_URL=https://link-do-apk-ou-da-build
```

O QR de instalação deve apontar para `https://leroy-merlin.vercel.app/instalar`. A página apresenta o link do APK. Sem uma build disponível, orienta a testar no aparelho do estande.

O QR de produto pode conter `LM-0001`, `leroynext://produto/LM-0001` ou `https://seu-backend/produto/LM-0001`. O QR de corredor pode conter `corredor-03`. Gere etiquetas com IDs reais do catálogo. Em [`docs/mobile/etiquetas.html`](../docs/mobile/etiquetas.html) há uma folha imprimível com QRs de exemplo. Na raiz, rode `npm run mobile:qr -- https://seu-backend/instalar` para incluir o QR de instalação quando os links de distribuição estiverem configurados.

## Verificar

```powershell
# Na raiz: testes existentes, autorização/isolamento do atendimento e leitura de etiquetas
npm test
npm run mobile:check
npm run mobile:preparar-git
# No diretório mobile: validação de versões e bundles
npx expo install --check
npm run export:android
```

Exportar bundles valida código/assets; não gera o APK e não substitui teste em aparelho. Antes da feira: instalar a build final em um Android físico, usar dados móveis para alcançar o backend hospedado, pedir ajuda, assumir pelo notebook e conferir a atualização na tela aberta do atendimento. Testar também lembrete local da lista, permissão negada, QR desconhecido e lista offline. Quando o push for habilitado em uma versão futura, testar também recebimento com a tela bloqueada e abertura pelo toque.

Referências oficiais: [câmera](https://docs.expo.dev/versions/latest/sdk/camera/), [push](https://docs.expo.dev/push-notifications/push-notifications-setup/) e [distribuição](https://docs.expo.dev/build/internal-distribution/).
