# Entrega mobile para o FIAP NEXT

O código do app Android e o passo a passo local estão em [`mobile/README.md`](../../mobile/README.md). Para enviar ao GitHub e configurar a Vercel, siga [`PUBLICACAO.md`](./PUBLICACAO.md).

- [`supabase.sql`](./supabase.sql): tabelas para compartilhar atendimento entre dispositivos.
- [`etiquetas.html`](./etiquetas.html): folha imprimível com QRs reais de produtos e corredor.
- [`previews/busca.png`](./previews/busca.png), [`previews/lista.png`](./previews/lista.png), [`previews/loja.png`](./previews/loja.png) e [`previews/calculadora.png`](./previews/calculadora.png): capturas do código React Native executado em preview web com viewport de celular; não são capturas de aparelho Android/iOS.

## O que ainda exige configuração externa

O escopo de distribuição é Android por APK. Depois de publicar o backend e configurar a Vercel, basta vincular o EAS à conta Expo e gerar a build. Firebase/FCM é opcional para uma versão futura; o push remoto está desativado por padrão. O QR final de instalação depende do link do APK.

O código preparado não significa que já exista um APK publicado. A validação por bundle, testes e preview web não substitui testar câmera, push e instalação em um Android físico.

## Roteiro curto do estande

1. Instalar pelo QR de `/instalar` ou usar um aparelho preparado do estande.
2. Escanear a etiqueta `LM-0001` no app e abrir a furadeira.
3. Adicionar à lista e consultar o corredor no mapa.
4. Pedir ajuda e informar o primeiro nome.
5. Manter a tela de atendimento aberta.
6. A equipe assume em `/funcionario/mobile` e o visitante vê o status atualizado.
7. Na lista, experimentar o lembrete local na build instalada e autorizar a notificação.
8. Desligar a conexão e conferir que a lista continua disponível.
