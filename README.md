# Wedding Registry

Simple Next.js wedding registry app with:

- Public registry browsing
- Quantity-based reservation tracking
- Admin management with Supabase Google OAuth
- Supabase-backed persistence
- Best-effort automatic price extraction on save

## Required environment variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=you@example.com
```

## Supabase setup

1. Create a Supabase project.
2. Enable Google auth in Supabase Auth.
3. Set `NEXT_PUBLIC_SITE_URL` to your canonical app URL and set the Supabase Auth `Site URL` and redirect URLs for local and production.
4. Run the SQL in [supabase/migrations/0001_registry.sql](/Users/mgreen/Workplace/wedding-registry/supabase/migrations/0001_registry.sql).

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Price extraction is best-effort and will fail on some retailer pages.
- Public guests do not sign in.
- Admin access is restricted to the configured `ADMIN_EMAIL`.
