# StarQuest

StarQuest is a student learning platform with a React/Vite frontend and an Express/SQLite backend.

## Stack
- Frontend: React 19, Vite, Tailwind CSS, HeroUI, Zustand
- Backend: Express 5, SQLite
- Process manager: PM2
- Reverse proxy: Nginx

## Project Layout
- `src/`: frontend app
- `server/`: backend API and SQLite setup
- `dist/`: frontend production build output
- `server/database.sqlite`: runtime database file created on the server

## Local Development
Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
node server.js
```

The Vite dev server proxies `/api` to `http://localhost:3000`.

## Validation
- `npm run lint`
- `npm run build`
- `node --check server/server.js`
- `node --check server/database.js`

## Ubuntu Deployment
Use the Ubuntu deployment guide at [DEPLOY_UBUNTU.md](/D:/personal/DEPLOY_UBUNTU.md).

Key deployment files:
- [server/ecosystem.config.js](/D:/personal/server/ecosystem.config.js)
- [server/nginx.conf.example](/D:/personal/server/nginx.conf.example)
- [server/start-prod.sh](/D:/personal/server/start-prod.sh)
- [server/restart-prod.sh](/D:/personal/server/restart-prod.sh)
