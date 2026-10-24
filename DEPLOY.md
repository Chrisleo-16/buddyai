# Deploying BuddyAI

In production the Express server serves the built PWA (`client/dist`) with an SPA fallback, so a single port serves the app, `/api/*` and Socket.io on the same origin.

```bash
npm ci && npm run build
NODE_ENV=production PORT=8080 JWT_SECRET=$(openssl rand -hex 48) \
  GEMMA_PROVIDER=gemini GEMINI_API_KEY=... MONGO_URI=... npm start -w server
```

Without `MONGO_URI` the server starts an in-memory MongoDB with seed data (resets on restart).

## Option 1: DigitalOcean App Platform + MongoDB Atlas

1. **MongoDB Atlas**: create a free M0 cluster, add a database user, allow access from `0.0.0.0/0` (or App Platform egress IPs), and copy the `mongodb+srv://...` URI.
2. **DigitalOcean**: Apps → Create App → GitHub → `Chrisleo-16/buddyai`, branch `main`.
3. Component type **Web Service**, source directory `/`:
   - Build command: `npm ci && npm run build`
   - Run command: `npm start -w server`
   - HTTP port: `8080`
4. Environment variables (mark secrets as encrypted): `NODE_ENV=production`, `PORT=8080`, `MONGO_URI`, `JWT_SECRET` (random 48+ bytes), `GEMMA_PROVIDER=gemini`, `GEMINI_API_KEY`, optional `DEMO_MODE=false`.
5. Deploy. App Platform gives an HTTPS `*.ondigitalocean.app` URL (HTTPS is required for camera access). Seed once with `npm run seed` from the console if the database is empty (the server also seeds automatically when no protocols exist).

## Option 2: Any VM or on-prem box (offline, Ollama)

```bash
ollama pull gemma4
NODE_ENV=production GEMMA_PROVIDER=ollama OLLAMA_HOST=http://localhost:11434 \
  JWT_SECRET=$(openssl rand -hex 48) MONGO_URI=mongodb://localhost/buddyai npm start -w server
```

Put it behind HTTPS (Caddy or nginx with a certificate) so browsers allow the camera. `docker-compose.yml` is also included.
