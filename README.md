# User management

React and Vite frontend with Supabase Auth, a `profiles` table protected by row level security, and Edge Functions for admin actions. New signups are Staff. Existing accounts keep their roles when the Staff migration is applied.

| Role | Access |
| --- | --- |
| Staff | View their own profile. |
| Manager | Browse and search the team directory. Cannot change accounts. |
| Administrator | Browse the directory and create users, change roles, or delete accounts. |

## Features

- Email and password sign-in and sign-up with Supabase Auth.
- Team directory for Managers and Administrators with live member counts, email search, and role filtering.
- Admin-only account creation, role changes, and deletion through authenticated Edge Functions.
- Staff profile view with access level and join date.
- Responsive layout for desktop and mobile.

## Connect a Supabase project

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from **Supabase Dashboard → Project Settings → API Keys**. A legacy anon key also works. Never put a secret or service role key in a `VITE_` variable.
2. Apply both SQL migrations in order in the project's **SQL Editor**: [`20261017000000_create_profiles.sql`](supabase/migrations/20261017000000_create_profiles.sql), then [`20261017000001_add_staff_role.sql`](supabase/migrations/20261017000001_add_staff_role.sql). If the first migration is already applied, run only the second. For a fresh CLI-managed project, link it and push both migrations:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

3. Deploy all three functions from this repository:

   ```bash
   supabase functions deploy create-user
   supabase functions deploy update-user-auth-role
   supabase functions deploy delete-user
   ```

   Functions use Supabase's built-in `SUPABASE_URL` and server-side secret/service role key. No server key belongs in `.env` for Vite.

4. In **Authentication → URL Configuration**, set the Site URL to the frontend URL (for local development, `http://127.0.0.1:5173`) and add any other frontend origins you use. Configure email confirmation in **Authentication → Providers → Email** as desired.
5. Sign up through the app. The first account will be Staff. To make your own account the initial admin, run this **once** in the SQL Editor, replacing the email with yours:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

   Check that the query changed one row. Thereafter, that admin can manage roles in the app. Public signup cannot grant Manager or Administrator access.

## Run locally

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. `pnpm build` and `pnpm lint` check the frontend. If the app shows **Supabase setup needed**, verify `.env` and restart Vite.

## Deploy the frontend on Vercel

1. Commit and push this repository, then import it into Vercel with **Framework Preset: Vite**. Use `pnpm build` as the build command and `dist` as the output directory. Vercel detects pnpm from `pnpm-lock.yaml`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if needed). Copy the values from your Supabase project's API settings. Vite reads the `VITE_` prefix; `NEXT_PUBLIC_` names will not configure this app. These are public browser values; never put a secret or service role key in Vercel's `VITE_` variables.
3. Apply the migrations and deploy the Edge Functions from the steps above before using the deployed frontend.
4. In **Supabase → Authentication → URL Configuration**, set the Site URL to the Vercel production URL and add that URL as an allowed redirect URL. Keep your local URL in the allowed redirects if you still use local development. Redeploy after changing Vercel environment variables.

The included `vercel.json` routes direct visits to `/signup` and `/admindashboard` through React Router. Vercel's [Vite deployment guide](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas) documents this SPA rewrite.

The frontend only reads profiles. Row level security restricts Staff to their own row and allows Managers and Administrators to read the directory. All account mutations go through Edge Functions that verify the caller's Supabase Auth session and current admin role before using a server-side key. The database trigger creates Staff profiles and deletes them with Auth users. Role checks use the `profiles` table as the source of truth.
