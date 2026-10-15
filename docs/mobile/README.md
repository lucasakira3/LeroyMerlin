# Entrega mobile para o FIAP NEXT

O código do app Android e o passo a passo local estão em [`mobile/README.md`](../../mobile/README.md). Para enviar ao GitHub e configurar a Vercel, siga [`PUBLICACAO.md`](./PUBLICACAO.md).

- [`supabase.sql`](./supabase.sql): tabelas para compartilhar atendimento entre dispositivos.
- [`etiquetas.html`](./etiquetas.html): folha imprimível com QRs reais de produtos e corredor.
- [`previews/busca.png`](./previews/busca.png), [`previews/lista.png`](./previews/lista.png), [`previews/loja.png`](./previews/loja.png) e [`previews/calculadora.png`](./previews/calculadora.png): capturas do código React Native executado em preview web com viewport de celular; não são capturas de aparelho Android/iOS.

## O que ainda exige configuração externa

O escopo de distribuição é Android por APK. Ainda é necessário configurar as variáveis na Vercel, publicar as alterações do backend, vincular o EAS à conta Expo, configurar o Firebase/FCM e gerar a build. O QR final de instalação depende do link do APK.

O código preparado não significa que já exista um APK publicado. A validação por bundle, testes e preview web não substitui testar câmera, push e instalação em um Android físico.

## Roteiro curto do estande

1. Instalar pelo QR de `/instalar` ou usar um aparelho preparado do estande.
2. Escanear a etiqueta `LM-0001` no app e abrir a furadeira.
3. Adicionar à lista e consultar o corredor no mapa.
4. Pedir ajuda e informar o primeiro nome.
5. Ativar notificações na build própria.
6. A equipe assume em `/funcionario/mobile` e o visitante recebe o aviso.
7. Bloquear a tela, repetir uma atualização e tocar no push para abrir atendimento.
8. Desligar a conexão e conferir que a lista continua disponível.
