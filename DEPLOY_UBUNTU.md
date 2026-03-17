# Ubuntu Deployment Guide

This guide assumes Ubuntu Server 22.04 LTS or later.

## 1. Install Base Packages

```bash
sudo apt update
sudo apt install -y nginx curl git build-essential python3 g++
```

Install Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install PM2 globally:

```bash
sudo npm install -g pm2
```

## 2. Place The Project

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <YOUR_REPOSITORY_URL> starquest
cd /var/www/starquest
```

## 3. Build Frontend And Install Backend

Frontend:

```bash
npm ci
npm run build
```

Backend:

```bash
cd /var/www/starquest/server
npm ci
```

## 4. Start The API With PM2

The PM2 config expects the project at `/var/www/starquest`.

```bash
cd /var/www/starquest/server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

If PM2 prints a `sudo` command after `pm2 startup`, run that command once.

## 5. Configure Nginx

Copy the example config and update `server_name`:

```bash
sudo cp /var/www/starquest/server/nginx.conf.example /etc/nginx/sites-available/starquest
sudo nano /etc/nginx/sites-available/starquest
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/starquest /etc/nginx/sites-enabled/starquest
sudo nginx -t
sudo systemctl reload nginx
```

Optional: remove the default site if it conflicts.

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Update Procedure

```bash
cd /var/www/starquest
git pull
/var/www/starquest/server/restart-prod.sh
```

## 7. Operational Notes
- The SQLite DB file is created at `/var/www/starquest/server/database.sqlite`.
- The database file is intentionally ignored by Git.
- Frontend requests `/api`, and Nginx proxies those requests to the Node server on port `3000`.
- If you change the deployment path, update [server/ecosystem.config.js](/D:/personal/server/ecosystem.config.js).

## 8. Deployment Checklist
- `node -v` shows Node 20 LTS or newer.
- `pm2 -v` works.
- `npm run lint` succeeds in the repo root.
- `npm run build` succeeds in the repo root.
- `node --check server/server.js` succeeds.
- `node --check server/database.js` succeeds.
- `pm2 status` shows `starquest-api` as `online`.
- `curl http://127.0.0.1:3000/` returns the API health message.
- `sudo nginx -t` succeeds.
- Opening `http://YOUR_SERVER_IP/` loads the frontend.
- Logging in from the deployed site works for both admin and student flows.
