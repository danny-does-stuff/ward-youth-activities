# Ward Youth Activities

A shared-codebase event board for LDS ward youth activities. Anyone can submit an event; leaders approve at `/admin` before it appears on the public list.

## Stack

- TanStack Start (React) on Cloudflare Workers
- Cloudflare D1 (SQLite)
- Drizzle ORM
- Tailwind CSS

Local D1 and production D1 are separate databases. Submissions do not persist across a server restart until they are written to D1.

## Local development

```bash
yarn install
cp .dev.vars.example .dev.vars
yarn db:migrate:local
yarn dev
```

- Site: http://localhost:3000
- Submit: http://localhost:3000/submit
- Admin: http://localhost:3000/admin

Default local admin password is in `.dev.vars` (`local-dev-password` if you copied the example and then set it yourself). This checkout is configured for **Celina Ward** (`WARD_NAME` and D1 in `wrangler.jsonc`).

## Deploy

Celina’s D1 database already exists. Production deploys from **GitHub Actions** on push to `main` on `danny-does-stuff/ward-youth-activities`.

### One-time GitHub setup

1. In Cloudflare, create an API token: [Account API tokens](https://dash.cloudflare.com/?to=/:account/api-tokens) → **Create Token** → template **Edit Cloudflare Workers**. Scope it to this account. Also grant **D1 Edit** if that template does not include it.
2. In GitHub, put those values on the **production** environment (not repo-wide secrets):
   - `CLOUDFLARE_API_TOKEN` — the token
   - `CLOUDFLARE_ACCOUNT_ID` — `17276b4a174c452ff88d8c9219a126cb`
   Restrict that environment to `main`: **Settings → Environments → production → Deployment branches** → **Selected branches** → `main`.
3. Set the admin password once (not in GitHub; it lives on the Worker):

   ```bash
   yarn wrangler login
   printf '%s' 'your-admin-password' | yarn wrangler secret put ADMIN_PASSWORD
   ```

After that, merge/push to `main`. The workflow installs, applies D1 migrations, then `yarn deploy`.

Manual deploy is still `yarn wrangler login` then `yarn deploy`.
