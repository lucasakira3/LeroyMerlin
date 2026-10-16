# Publicação do backend e do app Android

Este guia acompanha os arquivos preparados no repositório. O envio ao GitHub e a configuração da Vercel são etapas separadas; a chave privada permanece nos ambientes locais e no painel da hospedagem.

## 1. Conferir os arquivos antes do GitHub

Na raiz:

```powershell
npm run mobile:preparar-git
npm test
npm run mobile:check
npm run build
git status --short
```

O primeiro comando confere as regras do `.gitignore` e procura os segredos de `.env.local` nos arquivos candidatos ao commit, sem imprimir os valores. Nenhum comando acima cria commit ou envia arquivos.

Entram no GitHub: código do app em `mobile/`, APIs em `app/api/mobile/`, painel em `app/funcionario/mobile/`, página `app/instalar/`, tipos, funções compartilhadas, scripts, guias, modelos `.env.example` e os dois `package-lock.json`.

Ficam fora: `.env.local`, `mobile/.env`, credenciais Firebase, certificados, dependências, dados de atendimento local, projetos nativos gerados e APKs. O código do app entra no GitHub; o instalador é disponibilizado por um link de distribuição.

## 2. Configurar a Vercel

No projeto que atende **https://leroy-merlin.vercel.app**, abra **Settings → Environment Variables**. Cadastre no ambiente **Production**:

| Variável                | Valor                                                    |
| ----------------------- | -------------------------------------------------------- |
| `SUPABASE_URL`          | Copiar a variável de mesmo nome do `.env.local` da raiz. |
| `SUPABASE_SECRET_KEY`   | Copiar a variável de mesmo nome do `.env.local` da raiz. |
| `MOBILE_SESSION_SECRET` | Copiar a variável de mesmo nome do `.env.local` da raiz. |
| `MOBILE_ADMIN_KEY`      | Copiar a variável de mesmo nome do `.env.local` da raiz. |

Mantenha também as chaves de IA que o site já usa, especialmente `GEMINI_API_KEY`. Não coloque prefixo `NEXT_PUBLIC_` nessas variáveis. Se testar em Preview Deployments, cadastre-as também no ambiente Preview.

Preserve ainda `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, usadas pelo site para login e sincronização. Elas são separadas da configuração privada do atendimento mobile e estão no modelo `.env.example`.

`MOBILE_STORAGE=file` é apenas para desenvolvimento e não precisa ser cadastrado na Vercel. Em produção o atendimento usa Supabase. Não é preciso cadastrar a chave pública do Supabase neste fluxo.

O link público do APK pronto pode ser registrado em `data/mobile-release.json`; a página `/instalar` o utiliza enquanto estiver disponível. `MOBILE_ANDROID_URL` é uma opção para substituir esse link por outro HTTPS, como uma hospedagem permanente. Sem APK pronto, a página informa que a versão ainda não está disponível. `EXPO_ACCESS_TOKEN` é opcional e só é usado se você habilitar a proteção do serviço de push no Expo.

## 3. Enviar o código e publicar

Revise os arquivos, crie o commit e envie para a branch de produção configurada na Vercel. Nenhum commit/push é feito pelo script de preparação.

As configurações do projeto Vercel continuam apontando para a **raiz** do repositório, framework **Next.js**, build **`npm run build`**. Não selecione `mobile/` como diretório raiz: o Android será compilado pelo Expo, separadamente. O `.vercelignore` exclui o app e arquivos locais do pacote de deploy.

Variáveis novas só passam a valer em um novo deployment. Se as cadastrar depois da publicação, faça um **Redeploy**.

## 4. Conferir o backend publicado

- `https://leroy-merlin.vercel.app/api/produto/LM-0001` deve retornar o produto.
- `https://leroy-merlin.vercel.app/api/mobile/equipe` deve retornar **401** sem a chave da equipe. **404** indica que o código novo não foi publicado; **503** indica configuração faltando.
- `https://leroy-merlin.vercel.app/instalar` deve abrir a página Android.
- Em `/funcionario/login`, entre no painel acadêmico e abra **Atendimento Mobile**. Informe a `MOBILE_ADMIN_KEY` para consultar a fila no Supabase.

As tabelas são criadas com [`supabase.sql`](./supabase.sql). Esse arquivo não é executado automaticamente pelo deploy. O app precisa das tabelas `mobile_chamados` e `mobile_dispositivos`.

## 5. Vincular Expo

Siga [o guia do app](../../mobile/README.md#gerar-o-apk-e-configurar-push). Para a primeira versão precisamos da conta Expo e do ID real do projeto EAS. Firebase não é necessário: push remoto fica desativado e o visitante acompanha o atendimento dentro do app.

O identificador do aplicativo é `br.com.fiap.leroynext`. Se ativarmos push em outra versão, usaremos esse identificador no Firebase e configuraremos a credencial FCM v1 no EAS. Credenciais privadas ficam fora do GitHub e do aplicativo.

## 6. APK, instalação e QR do evento

Depois de configurar o projeto Expo e as credenciais:

```powershell
# Dentro de mobile/
npx eas-cli@latest build --platform android --profile preview
```

Essa build gera um APK autônomo. Teste em um Android físico com dados móveis: fotografia, QR, lista offline e atualização do atendimento na tela aberta. Nesta versão não há aviso remoto com a tela bloqueada.

Com o link HTTPS do APK pronto, cadastre `MOBILE_ANDROID_URL` na Vercel e faça Redeploy. Na raiz do repositório, gere a folha de QRs:

```powershell
npm run mobile:qr -- https://leroy-merlin.vercel.app/instalar
```

O arquivo `docs/mobile/etiquetas.html` ficará pronto para imprimir. O visitante acessa a página, baixa o APK e permite a instalação pelo navegador. Não é necessário publicar na Play Store para essa distribuição por APK.

Referências: [arquivos ignorados no deploy Vercel](https://vercel.com/docs/deployments/vercel-ignore) e [variáveis e arquivos no EAS](https://docs.expo.dev/eas/environment-variables/).
