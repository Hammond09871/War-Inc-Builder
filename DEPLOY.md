# War Inc Rising Builder — Deployment Guide

This app is a lineup builder/optimizer for War Inc Rising with user accounts and persistent data.

## Quick Deploy to Railway (Recommended — Easiest)

Railway gives you $5/month free credit, which is more than enough for this app.

### Steps:

1. **Create a GitHub account** (if you don't have one): https://github.com/signup
2. **Create a new repository**: https://github.com/new
   - Name it `war-inc-builder`
   - Make it **Private** (or Public, your choice)
   - Click "Create repository"
3. **Upload this code** to the repo:
   - On the repo page, click "Upload files"
   - Drag and drop ALL the files from this folder
   - Click "Commit changes"
4. **Sign up for Railway**: https://railway.app
   - Sign in with your GitHub account
5. **Create a new project**:
   - Click "New Project"
   - Select "Deploy from GitHub Repo"
   - Pick your `war-inc-builder` repo
6. **Add a persistent volume** (this keeps your data forever):
   - Click on your service
   - Go to "Volumes" tab
   - Click "New Volume"
   - Mount path: `/data`
   - Size: 1 GB (more than enough)
7. **Add environment variables**:
   - Go to "Variables" tab
   - Add these:
     - `DATABASE_PATH` = `/data/warinc.db`
     - `NODE_ENV` = `production`
     - `PORT` = `3000`
8. **Deploy**: Railway will automatically build and deploy
9. **Get your URL**: Go to Settings → Networking → Generate Domain
   - This is your permanent URL that you can share with anyone

That's it! Your app is live forever. Anyone can create an account and their data persists permanently.

---

## Alternative: Deploy to Render

Render's free tier doesn't include persistent disk, so you'd need the $7/month Starter plan for SQLite persistence. But it's very reliable.

1. Sign up at https://render.com
2. Connect your GitHub
3. Create a new Web Service from your repo
4. Build command: `npm install && npm run build && npx drizzle-kit push`
5. Start command: `node dist/index.cjs`
6. Add a Disk: mount at `/data`, 1 GB
7. Set env vars: `DATABASE_PATH=/data/warinc.db`, `NODE_ENV=production`

---

## Alternative: Deploy to Fly.io

1. Install flyctl: https://fly.io/docs/flyctl/install/
2. Run: `fly launch`
3. Create a volume: `fly volumes create warinc_data --size 1`
4. Update fly.toml to mount the volume at `/data`
5. Set secrets: `fly secrets set DATABASE_PATH=/data/warinc.db`
6. Deploy: `fly deploy`

---

## Tech Stack
- **Backend**: Express.js + SQLite (Drizzle ORM)
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Auth**: bcrypt password hashing, server-side sessions
- **Database**: SQLite with WAL mode for performance
