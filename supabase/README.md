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

Product translations add optional English names and descriptions. Apply migrations with `supabase db push`, then enter English copy for each product in the admin dashboard. English storefront pages use the English copy when present and fall back to the Indonesian content otherwise.

The payment notification migration stores the customer's WhatsApp number and consent timestamp. Checkout requires the customer to opt in before a WhatsApp confirmation can be sent.

## Configure Midtrans Sandbox

The checkout and payment notification flow is implemented with Midtrans Snap. Before testing, get the **Sandbox Server Key** from your Midtrans account. Do not use the Client Key here, and never put the Server Key in frontend code, a `VITE_` variable, or a committed `.env` file.

In Supabase Dashboard, open **Edge Functions > Secrets** and set:

- `MIDTRANS_SERVER_KEY`: the Sandbox Server Key from Midtrans.
- `MIDTRANS_IS_PRODUCTION`: `false` (the payment function then uses the Midtrans Sandbox API).
- `SITE_URL`: the storefront's public URL, without a trailing slash.

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. The browser only needs the Supabase project URL and anon key as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Product **Chat** buttons open an in-app conversation with the admin; customers must sign in. The admin can open **Chat** from the navigation to view and answer conversations. Conversations and messages are protected by row-level security.

Deploy both functions after setting the secrets:

```sh
supabase functions deploy create-midtrans-payment
supabase functions deploy midtrans-webhook
```

In the Midtrans Sandbox dashboard, set the payment notification URL to `https://<project-ref>.supabase.co/functions/v1/midtrans-webhook`, replacing `<project-ref>` with the linked Supabase project's ref. The webhook validates each notification using the same Sandbox Server Key. The order becomes `completed` only after a valid `settlement` notification (or accepted `capture`); returning to the storefront alone does not confirm payment.

## Configure payment confirmations

Successful payments can send a transactional email through Resend and a template message through Meta WhatsApp Cloud API. Configure the following additional secrets in **Supabase Dashboard > Edge Functions > Secrets** before accepting payments:

- `RESEND_API_KEY`: API key for your Resend account.
- `RESEND_FROM_EMAIL`: sender address on a domain verified with Resend, for example `SmartNova <orders@your-domain.com>`.
- `WHATSAPP_ACCESS_TOKEN`: access token for your WhatsApp Cloud API app.
- `WHATSAPP_PHONE_NUMBER_ID`: the WhatsApp Cloud API phone number ID, not the displayed phone number.
- `WHATSAPP_TEMPLATE_NAME`: name of an approved utility template.
- `WHATSAPP_TEMPLATE_LANGUAGE`: approved template language code, commonly `id`.
- `WHATSAPP_API_VERSION`: supported Graph API version in the form `vNN.N`.

The approved WhatsApp template must have three body variables in this order: customer name, order number, and formatted total. The checkout asks for an Indonesian WhatsApp number and explicit consent. Only a verified Midtrans `settlement` (or accepted `capture`) triggers confirmations; pending, failed, and expired payments do not. Each channel is tracked separately so a retry for one provider does not resend a confirmation already delivered by the other. Configure these secrets before testing; provider failures return an error to Midtrans so its notification can be retried.

Apply the new migration and redeploy the payment functions:

```sh
supabase db push
supabase functions deploy create-midtrans-payment
supabase functions deploy midtrans-webhook
```

Configure the Supabase Auth site URL and email confirmation behavior for the storefront domain as well. Once the storefront and secrets are configured, place a test order and complete it with a payment method and test credentials supported by Midtrans Sandbox.

## Deploy in-app product chat

Apply the support chat and attachment migrations, then deploy the updated storefront:

```sh
supabase db push
npm run build
```

Customers sign in, open **Chat** on a product, and send their question. Admin users (with `app_metadata.role = 'admin'`) can select **Chat** in the navigation to reply. Messages refresh automatically while the chat is open.

The plus button in an open conversation supports the device gallery, camera, and documents. Attachments use a private Storage bucket, are limited to 10 MB each and five per message, and are visible only to conversation participants and admins. After pulling this change, run `supabase db push` to create the bucket and its access policies.

## Grant admin access

The admin panel requires `app_metadata.role = 'admin'`. Assign it to a trusted user's email from the Supabase SQL editor, then have that user sign out and back in so their JWT includes the new role:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE lower(email) = lower('admin@example.com');
```