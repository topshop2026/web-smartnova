import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { mapMidtransPaymentStatus } from '../_shared/midtrans.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !serverKey) {
      return jsonResponse({ error: 'Payment verification is not configured.' }, 503);
    }

    const accessToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!accessToken) return jsonResponse({ error: 'Sign in is required.' }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return jsonResponse({ error: 'Invalid account session.' }, 401);

    const payload = await request.json();
    const orderNumber = typeof payload.order_number === 'string' ? payload.order_number.trim() : '';
    if (!orderNumber) return jsonResponse({ error: 'Order number is required.' }, 400);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('order_number, total_amount, status')
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .maybeSingle();
    if (orderError) {
      console.error('Unable to load order for payment verification:', orderError.message);
      return jsonResponse({ error: 'Unable to load order.' }, 500);
    }
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404);
    if (order.status !== 'pending') return jsonResponse({ status: order.status });

    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
    const apiBase = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    const response = await fetch(
      `${apiBase}/v2/${encodeURIComponent(order.order_number)}/status`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${serverKey}:`)}`,
          Accept: 'application/json',
        },
      }
    );
    if (!response.ok) {
      console.error('Midtrans status verification failed:', response.status, await response.text());
      return jsonResponse({ error: 'Unable to verify payment with Midtrans.' }, 502);
    }

    const notification = await response.json();
    if (notification.order_id !== order.order_number
      || !Number.isFinite(Number(notification.gross_amount))
      || Math.round(Number(notification.gross_amount)) !== Math.round(Number(order.total_amount))) {
      console.error('Midtrans returned mismatched order details:', order.order_number);
      return jsonResponse({ error: 'Midtrans order details do not match.' }, 502);
    }

    const nextStatus = mapMidtransPaymentStatus(
      String(notification.transaction_status ?? ''),
      String(notification.fraud_status ?? '')
    );
    const { data: finalStatus, error: updateError } = await adminClient.rpc(
      'update_midtrans_order_status',
      {
        p_order_number: order.order_number,
        p_total_amount: Number(order.total_amount),
        p_next_status: nextStatus,
      }
    );
    if (updateError) {
      console.error('Unable to save verified payment status:', updateError.message);
      return jsonResponse({ error: 'Unable to update order payment status.' }, 500);
    }

    return jsonResponse({ status: finalStatus ?? nextStatus });
  } catch (error) {
    console.error('Midtrans payment verification failed:', error);
    return jsonResponse({ error: 'Unable to verify payment status.' }, 500);
  }
});
