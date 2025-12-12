# FitHub — App Mobile

Aplicativo mobile esportivo inspirado em um "Tinder do esporte" para combinar jogos, registrar presença e movimentar campeonatos comunitários em Salvador. Disponível para **Android**, **iOS** e **Web**.

## 📱 Download

- **Android:** [Play Store](#) _(em breve)_
- **iOS:** [App Store](#) _(em breve)_
- **Web:** [fithub.app](#) _(em breve)_

## 🚀 Acesso rápido

- **Login demo:** `Lucas Santiago`
- **Senha:** `123`

### Acesso master (consolidado)

- **Usuário:** `Luidil Gois`
- **Senha:** `123`

## ⚡ Principais recursos

- **Feed de partidas:** swipe/tinder-like com taxa única de R$1 por atleta e check-in via QR, foto ou vídeo
- **Campeonatos:** inscrições individuais ou por time, com alocação automática e confirmação de presença
- **Ping de confirmação:** sistema de confirmação de presença para times antes das partidas
- **Estatísticas e histórico:** registro de gols, passes, quilômetros e vídeos
- **Stories:** fotos pré/pós jogo com compartilhamento nativo
- **Times fixos e chat:** gerenciamento de squads, notificações e chat
- **Ranking:** filtros por estado, cidade, quadra e faixa-etária

## 🛠️ Stack

- **Frontend:** React 18 + Vite
- **Mobile:** Capacitor 6 (Android + iOS)
- **PWA:** Instalável diretamente do navegador
- **Estilo:** CSS com glassmorphism e safe-area-insets

## 📦 Instalação (Desenvolvimento)

```bash
npm install
npm run dev
```

## 📱 Build Mobile

### Android

```bash
# Build completo e abrir no Android Studio
npm run android
```

Requisitos:
- [Android Studio](https://developer.android.com/studio)
- JDK 17+

### iOS (apenas macOS)

```bash
# Build completo e abrir no Xcode
npm run ios
```

Requisitos:
- Xcode 15+
- CocoaPods
- macOS

### Scripts úteis

| Comando              | Descrição                                      |
|----------------------|------------------------------------------------|
| `npm run dev`        | Dev server com HMR                             |
| `npm run build`      | Build para produção                            |
| `npm run icons`      | Gerar ícones PNG a partir do SVG               |
| `npm run mobile:build` | Build + sync Capacitor                       |
| `npm run android`    | Build e abrir no Android Studio                |
| `npm run ios`        | Build e abrir no Xcode                         |

## 🌐 Deploy Web

1. `npm run build`
2. Suba o conteúdo da pasta `dist/` para um servidor estático ou use Vercel/Netlify

## 📤 Publicar nas Lojas

### Google Play Store

1. Abra o projeto no Android Studio: `npm run android`
2. Configure a assinatura (signing) em `android/app/build.gradle`
3. Build → Generate Signed Bundle (AAB)
4. Suba o AAB no [Google Play Console](https://play.google.com/console)

### Apple App Store

1. Abra o projeto no Xcode: `npm run ios`
2. Configure o Team e Bundle ID nas settings do projeto
3. Product → Archive
4. Distribua via App Store Connect

## 📊 Banco de Dados (opcional)

Um esquema SQLite está disponível em [db/schema.sql](db/schema.sql) para backend futuro:

```bash
sqlite3 fithub.db < db/schema.sql
```

## 🤝 Contribuindo

Abra issues ou PRs em [Luidil/FitHub](https://github.com/Luidil/FitHub---Prot-tipo-).
