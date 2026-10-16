# Android 1.0.0 — FIAP NEXT

- Instalação e endereço do QR: https://leroy-merlin.vercel.app/instalar
- [Baixar APK](https://expo.dev/artifacts/eas/-sdi5XU9r7czI7oYSPRH84LpDYkQFIBWX2HL-GAVKbs.apk)
- [Build concluída na Expo](https://expo.dev/accounts/fbrcmgg/projects/leroy-next-mobile/builds/da44a565-f6e7-4125-a7b2-38c533ace129)
- Pacote: `br.com.fiap.leroynext`, versão `1.0.0`, código `1`.
- Cópia local: `mobile/build/leroy-next-1.0.0-da44a565.apk` (ignorada pelo Git).
- QR em imagem: [qr-instalacao.png](./qr-instalacao.png).
- Folha para impressão: [etiquetas.html](./etiquetas.html).

O artefato da Expo tem expiração informada em **30/10/2026**. Para distribuir depois dessa data, hospede a cópia do APK em um endereço HTTPS permanente e atualize `data/mobile-release.json` ou a variável `MOBILE_ANDROID_URL` da Vercel. O QR continua apontando para a mesma página de instalação.

Não é necessário Expo Go, Firebase ou Play Store. O visitante baixa o APK e permite a instalação pelo navegador quando o Android solicitar. Push remoto está desativado; lembretes locais e acompanhamento do atendimento dentro do app permanecem disponíveis.

A build assinada, o TypeScript, os 95 testes do projeto, o bundle Android e a build do site passaram. O APK baixado contém manifesto, código Android e bundle JavaScript. Ainda é necessário testar em um Android físico: abrir o app, buscar produtos, usar câmera e QR, salvar a lista, agendar lembrete e acompanhar um chamado atualizado pelo painel da equipe. A compilação não substitui esse teste no aparelho.
