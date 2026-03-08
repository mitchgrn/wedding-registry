# Wedding Registry

Simple Next.js wedding registry app with:

- Public registry browsing
- Quantity-based reservation tracking
- Admin management with Google One Tap
- Supabase-backed persistence
- Best-effort automatic price extraction on save

## Required environment variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ADMIN_EMAIL=you@example.com
```

## Supabase setup

1. Create a Supabase project.
2. Enable Google auth in Supabase Auth.
3. Configure the Google Identity Services client to allow your local and production origins.
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
