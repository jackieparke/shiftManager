# Restaurant Scheduler

Static Vercel-ready setup.

## Files

- `index.html` — page structure
- `styles.css` — app styling
- `script.js` — scheduler logic
- `client.js` — Supabase connection

## Supabase setup

1. Open `client.js`.
2. Replace `YOUR_SUPABASE_URL` with your Supabase Project URL.
3. Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon public key.

Find both in Supabase Dashboard → Project Settings → API.

## Vercel

This can deploy as a static site. Keep `index.html` at the project root.

After editing:

```bash
git add .
git commit -m "Set up scheduler project structure"
git push
```
