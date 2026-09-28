import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

type RequestedItem = {
  product_id: string;
  days: number;
  features: number;
  quantity: number;
};

type ProductPricing = {
  id: string;
  name: string;
  price: number;
  feature_price: number;
  duration_prices: { days: number; surcharge: number }[];
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    const siteUrl = Deno.env.get('SITE_URL');
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !serverKey || !siteUrl) {
      return jsonResponse({ error: 'Payment service is not configured.' }, 503);
    }

    const accessToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!accessToken) return jsonResponse({ error: 'Sign in is required.' }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user?.email) return jsonResponse({ error: 'Invalid account session.' }, 401);

    const payload = await request.json();
    const customerName = typeof payload.customer_name === 'string' ? payload.customer_name.trim() : '';
    const phoneDigits = typeof payload.customer_phone === 'string'
      ? payload.customer_phone.replace(/\D/g, '')
      : '';
    const customerPhone = phoneDigits.startsWith('0') ? `62${phoneDigits.slice(1)}` : phoneDigits;
    const requestedItems = payload.items as RequestedItem[];
    if (!customerName || customerName.length > 100 || !/^62\d{8,13}$/.test(customerPhone)
      || payload.whatsapp_consent !== true
      || !Array.isArray(requestedItems)
      || requestedItems.length < 1 || requestedItems.length > 20) {
      return jsonResponse({ error: 'Invalid checkout details.' }, 400);
    }

    const productIds = [...new Set(requestedItems.map((item) => item.product_id))];
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: productRows, error: productError } = await adminClient
      .from('products')
      .select('id, name, price, feature_price, duration_prices')
      .in('id', productIds);
    if (productError || !productRows || productRows.length !== productIds.length) {
      return jsonResponse({ error: 'One or more products are unavailable.' }, 400);
    }

    const products = new Map((productRows as ProductPricing[]).map((product) => [product.id, product]));
    const orderItems = [];
    const midtransItems = [];
    let totalAmount = 0;

    for (const requested of requestedItems) {
      const product = products.get(requested.product_id);
      const days = Number(requested.days);
      const features = Number(requested.features);
      const quantity = Number(requested.quantity);
      const duration = product?.duration_prices.find((option) => Number(option.days) === days);
      if (!product || !duration || !Number.isInteger(features) || features < 1 || features > 20
        || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return jsonResponse({ error: 'Invalid product options.' }, 400);
      }

      const unitPrice = Math.round(Number(product.price)
        + Number(product.feature_price) * features
        + Number(duration.surcharge));
      if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
        return jsonResponse({ error: 'Invalid product price.' }, 400);
      }
      totalAmount += unitPrice * quantity;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        days,
        features,
        quantity,
      });
      midtransItems.push({
        id: product.id,
        price: unitPrice,
        quantity,
        name: `${product.name} (${days} hari, ${features} fitur)`.slice(0, 50),
      });
    }

    if (!Number.isSafeInteger(totalAmount) || totalAmount > 1_000_000_000) {
      return jsonResponse({ error: 'Order total is outside the supported range.' }, 400);
    }

    const orderNumber = `SN-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { data: orderId, error: orderError } = await adminClient.rpc('reserve_order_inventory', {
      p_order_number: orderNumber,
      p_user_id: user.id,
      p_customer_email: user.email,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_total_amount: totalAmount,
      p_items_json: orderItems,
    });
    if (orderError || !orderId) {
      if (orderError?.message.includes('Insufficient stock')) {
        return jsonResponse({ error: 'One or more products no longer have enough stock.' }, 409);
      }
      console.error('Unable to reserve stock and create order:', orderError?.message);
      return jsonResponse({ error: 'Unable to create order.' }, 500);
    }

    const apiBase = isProduction
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com';
    const siteBase = siteUrl.replace(/\/$/, '');
    let snapResponse: Response;
    try {
      snapResponse = await fetch(`${apiBase}/snap/v1/transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${serverKey}:`)}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          transaction_details: { order_id: orderNumber, gross_amount: totalAmount },
          item_details: midtransItems,
          customer_details: { first_name: customerName, email: user.email, phone: customerPhone },
          callbacks: { finish: `${siteBase}/?order_id=${encodeURIComponent(orderNumber)}` },
        }),
      });
    } catch (error) {
      await adminClient.rpc('update_midtrans_order_status', {
        p_order_number: orderNumber,
        p_total_amount: totalAmount,
        p_next_status: 'failed',
      });
      throw error;
    }

    if (!snapResponse.ok) {
      console.error('Midtrans Snap rejected the transaction:', await snapResponse.text());
      await adminClient.rpc('update_midtrans_order_status', {
        p_order_number: orderNumber,
        p_total_amount: totalAmount,
        p_next_status: 'failed',
      });
      return jsonResponse({ error: 'Unable to start Midtrans checkout.' }, 502);
    }

    const snap = await snapResponse.json();
    const { error: updateError } = await adminClient.from('orders').update({
      payment_token: snap.token,
      payment_redirect_url: snap.redirect_url,
    }).eq('id', orderId);
    if (updateError || !snap.redirect_url) {
      console.error('Unable to store Midtrans checkout details:', updateError?.message);
      return jsonResponse({ error: 'Unable to store payment session.' }, 500);
    }

    return jsonResponse({ order_number: orderNumber, redirect_url: snap.redirect_url });
  } catch (error) {
    console.error('Payment initialization failed:', error);
    return jsonResponse({ error: 'Unable to start payment.' }, 500);
  }
});