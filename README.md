# Restaurant POS and Inventory Management

A complete Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase starter for a small restaurant POS and inventory system.

## What Is Included

- Admin and staff role experience.
- Login screen demo.
- Owner dashboard.
- Staff POS screen with large item buttons.
- Category filters, quantity controls, discount, tax, and payment method.
- Sale completion with local inventory reduction.
- Menu management.
- Inventory levels, minimum stock alerts, and logs.
- Transactions and CSV export endpoint.
- Reports for revenue, items, staff, and low stock.
- User management and audit activity view.
- Supabase client/server helpers.
- Supabase PostgreSQL schema, seed data, indexes, and RLS policies.
- Vercel-ready environment configuration.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

The local UI includes demo data so the app can be reviewed before Supabase is connected.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. In Supabase Auth, create the owner user first.
6. Set the owner role to admin:

```sql
update public.users
set role = 'admin'
where email = 'owner@example.com';
```

7. Add the values from Supabase Project Settings to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service role key must only be used in trusted server scripts. Do not expose it in browser code.

## Deployment on Vercel

1. Push this folder to GitHub.
2. Import the project in Vercel.
3. Add the same environment variables in Vercel Project Settings.
4. Deploy.

## Production Notes

- The UI currently uses local demo state for easy review.
- Supabase Auth helpers, middleware, schema, and RLS policies are included for production integration.
- The next production step is replacing the local state actions with Supabase queries or server actions.
- For inventory safety, completed sale creation should be handled in a database transaction or RPC so sale rows, sale items, inventory reduction, inventory logs, and audit logs commit together.
