# Deploy on Render

## “Could not find a production build in the `.next` directory”

Next.js must run **`next build`** during the **Build** step so `.next` exists before **`node server.js`** / `next start`.

### In the Render dashboard

1. Open your **Web Service** → **Settings**.
2. **Build Command** — must install deps **and** build Next:

   ```bash
   npm install && npm run build
   ```

   If installs skip devDependencies (e.g. `NODE_ENV=production` during build), use:

   ```bash
   npm install --include=dev && npm run build
   ```

   This repo keeps **Tailwind, PostCSS, TypeScript, and `@types/*`** in `dependencies` so a plain `npm install` on Render (which often skips `devDependencies`) still runs `next build` + the TypeScript step. Production build uses **`next build --webpack`** to avoid Turbopack/PostCSS issues on some hosts.

3. **Start Command** (should match `package.json`):

   ```bash
   npm start
   ```

   This runs `node server.js`, which spawns `next start` in production.

4. Remove any build command that **only** runs `npm install -D tailwindcss …` — that does **not** create `.next`.

### Using `render.yaml` (Blueprint)

If you connect the repo as a **Blueprint**, Render uses `render.yaml` at the repo root. After changing it, sync or redeploy.

---

## Environment

- Render sets **`PORT`** — `server.js` already uses `process.env.PORT`.
- Set **`NODE_ENV=production`** for the **runtime** if not already set; avoid forcing it during **install** only if `npm install` drops devDependencies and `next build` fails (then use `npm install --include=dev` in the build command).
