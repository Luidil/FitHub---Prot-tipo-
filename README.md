# FitHub — Protótipo

Experimento em React/Vite inspirado em um "Tinder do esporte" para combinar jogos, registrar presença e movimentar campeonatos comunitários em Salvador. Todo o estado é mantido em `localStorage`, permitindo simular um painel completo sem backend.

## Acesso rápido

- **Login demo:** `Lucas Santiago`
- **Senha:** `123`
- Todos os dados (partidas, histórias, times etc.) são locais e podem ser resetados limpando o `localStorage` do navegador.

### Acesso master (somente leitura consolidada)

- **Usuário:** `Luidil Gois`
- **Senha:** `123`
- Visão "Master" adicionada ao menu: mostra métricas agregadas locais (fundos, vagas, receitas estimadas, ranking, notificações e chat) para uso privado.

## Principais recursos

- **Feed de partidas:** swipe/tinder-like com taxa única de R$1 por atleta e check-in via QR, foto ou vídeo.
- **Fundo comunitário:** metade da taxa vai para melhoria das quadras, com painel dedicado ao fundo.
- **Estatísticas e histórico:** registro de gols, passes, quilômetros, vídeos e agora stories com fotos antes/depois.
- **Stories estilo Strava/Instagram:** aba exclusiva para subir fotos pré/pós jogo e compartilhar carrossel.
- **Times fixos e chat:** gerenciamento de squads, notificações e chat amigo/feed dentro do app.
- **Campeonatos kids:** pais cadastram filhos, criam copas com taxa simbólica e fazem inscrições vinculadas.
- **Ranking filtrável:** filtros por estado, cidade, quadra e faixa-etária usando o diretório de jogadores.

## Stack

- React 18 + Vite
- CSS puro com layout neon/glassmorphism
- Persistência via `localStorage`
- Sem backend; ideal para demos rápidas ou adaptação futura com APIs reais

## Instalação

```bash
npm install
npm run dev
```

O Vite exibirá a URL local (ex.: `http://localhost:5173`).

### Scripts úteis

| Comando            | Descrição                                  |
|--------------------|---------------------------------------------|
| `npm run dev`      | Dev server com HMR                         |
| `npm run build`    | Build para produção em `dist/`             |
| `npm run preview`  | Servir o build localmente para validação   |

## Deploy rápido

1. `npm run build`
2. Suba o conteúdo da pasta `dist/` para um servidor estático (Nginx/Apache/VPS) ou use GitHub Pages/Netlify/Vercel.
3. Para GitHub Pages clássico: crie o branch `gh-pages` com o conteúdo de `dist` ou configure um workflow.

> Se quiser servir a partir de um IP/porta específicos (ex.: `http://131.100.24.212:50001/index.html`), copie a pasta `dist` para essa máquina e use um servidor simples (`npx serve dist --listen 50001`) ou configure o serviço web desejado apontando para esse diretório.

## Próximos passos sugeridos

- Integrar APIs reais para autenticação, pagamentos e check-ins.
- Sincronizar stories/fotos em um storage externo (S3/Cloudinary).
- Criar endpoints para campeonatos/kids e dashboards administrativos.

## Banco de Dados (SQLite rápido)

Um esquema relacional simples foi adicionado em `db/schema.sql` para espelhar as entidades usadas no front (eventos, quadras, times, histórias, kids e campeonatos).

### Como criar o banco local

```powershell
cd c:\Users\NOT-NAC106\Desktop\FitHub
sqlite3 fithub.db < db/schema.sql
```

Isso gera `fithub.db` com seeds equivalentes aos mocks do app (Lucas, partidas, quadras etc.).

### Como consumir

1. Suba uma API rápida (ex.: Express + better-sqlite3) e exponha rotas REST/JSON.
2. No front, troque os acessos a `localStorage` por fetch para essas rotas. Sugestão de endpoints:
	- `GET /events`, `POST /events`, `POST /events/:id/join`, `POST /events/:id/checkin`
	- `GET /stories`, `POST /stories`
	- `GET /teams`, `POST /teams`
	- `GET /championships`, `POST /championships`, `POST /championships/:id/enroll`
3. Para testar sem backend, continue usando o front atual; o schema serve como base para uma futura API.

Qualquer contribuição é bem-vinda! Abra issues ou PRs em [`Luidil/FitHub---Prot-tipo-`](https://github.com/Luidil/FitHub---Prot-tipo-).
