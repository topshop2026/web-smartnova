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

## Configure Midtrans Sandbox

The checkout and payment notification flow is implemented with Midtrans Snap. Before testing, get the **Sandbox Server Key** from your Midtrans account. Do not use the Client Key here, and never put the Server Key in frontend code, a `VITE_` variable, or a committed `.env` file.

In Supabase Dashboard, open **Edge Functions > Secrets** and set:

- `MIDTRANS_SERVER_KEY`: the Sandbox Server Key from Midtrans.
- `MIDTRANS_IS_PRODUCTION`: `false` (the payment function then uses the Midtrans Sandbox API).
- `SITE_URL`: the storefront's public URL, without a trailing slash.

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. The browser only needs the Supabase project URL and anon key as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Deploy both functions after setting the secrets:

```sh
supabase functions deploy create-midtrans-payment
supabase functions deploy midtrans-webhook
```

In the Midtrans Sandbox dashboard, set the payment notification URL to `https://<project-ref>.supabase.co/functions/v1/midtrans-webhook`, replacing `<project-ref>` with the linked Supabase project's ref. The webhook validates each notification using the same Sandbox Server Key. The order becomes `completed` only after a valid `settlement` notification (or accepted `capture`); returning to the storefront alone does not confirm payment.

Configure the Supabase Auth site URL and email confirmation behavior for the storefront domain as well. Once the storefront and secrets are configured, place a test order and complete it with a payment method and test credentials supported by Midtrans Sandbox.

## Grant admin access

The admin panel requires `app_metadata.role = 'admin'`. Assign it to a trusted user's email from the Supabase SQL editor, then have that user sign out and back in so their JWT includes the new role:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE lower(email) = lower('admin@example.com');
```