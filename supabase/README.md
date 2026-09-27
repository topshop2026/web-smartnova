# SmartNova Supabase setup

## Apply database changes

Link the project and apply the migrations:

```sh
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

The pricing migration converts the starter catalog at Rp16,000 per USD. It sets the default feature rate to Rp10,000 per feature and default rush surcharges to 50%, 25%, and 10% of the base product price for 1, 2, and 3 days; 7- and 14-day options have no surcharge. Admins can change these values in the app.

The inventory migration gives existing and new products 100 units by default. The admin dashboard is available at `/admin` to add products and edit stock and pricing. Checkout reserves stock atomically; stock is restored if payment fails or expires.

## Configure Midtrans

Set these Supabase Edge Function secrets in the Supabase dashboard or with the Supabase CLI. Never put the Midtrans Server Key in a `VITE_` variable or browser code.

- `MIDTRANS_SERVER_KEY`: Server Key from the Midtrans account.
- `MIDTRANS_IS_PRODUCTION`: `false` for Sandbox, `true` for Production.
- `SITE_URL`: public storefront URL, without a trailing slash.

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.

Deploy both functions:

```sh
supabase functions deploy create-midtrans-payment
supabase functions deploy midtrans-webhook
```

Set the Midtrans payment notification URL to `https://<project-ref>.supabase.co/functions/v1/midtrans-webhook`. The order becomes `completed` only after a valid Midtrans `settlement` notification (or accepted `capture`). Configure the Supabase Auth site URL and email confirmation behavior for the storefront domain as well.

## Grant admin access

The admin panel requires `app_metadata.role = 'admin'`. Assign it to a trusted user's email from the Supabase SQL editor, then have that user sign out and back in so their JWT includes the new role:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE lower(email) = lower('admin@example.com');
```