import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

async function sha512(value: string) {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!supabaseUrl || !serviceRoleKey || !serverKey) {
      return jsonResponse({ error: 'Webhook is not configured.' }, 503);
    }

    const notification = await request.json();
    const orderNumber = String(notification.order_id ?? '');
    const statusCode = String(notification.status_code ?? '');
    const grossAmount = String(notification.gross_amount ?? '');
    const receivedSignature = String(notification.signature_key ?? '').toLowerCase();
    if (!orderNumber || !statusCode || !grossAmount || !receivedSignature) {
      return jsonResponse({ error: 'Invalid notification.' }, 400);
    }

    const expectedSignature = await sha512(`${orderNumber}${statusCode}${grossAmount}${serverKey}`);
    if (!constantTimeEquals(expectedSignature, receivedSignature)) {
      return jsonResponse({ error: 'Invalid signature.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const paymentAmount = Number(grossAmount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return jsonResponse({ error: 'Invalid payment amount.' }, 400);
    }

    const transactionStatus = String(notification.transaction_status ?? '');
    const fraudStatus = String(notification.fraud_status ?? '');
    let orderStatus: string;
    if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
      orderStatus = 'completed';
    } else if (transactionStatus === 'expire') {
      orderStatus = 'expired';
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
      orderStatus = 'failed';
    } else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
      orderStatus = 'refunded';
    } else {
      orderStatus = 'pending';
    }

    const { data: finalStatus, error: updateError } = await adminClient.rpc(
      'update_midtrans_order_status',
      {
        p_order_number: orderNumber,
        p_total_amount: paymentAmount,
        p_next_status: orderStatus,
      }
    );
    if (updateError) {
      console.error('Unable to update payment status:', updateError.message);
      return jsonResponse({ error: 'Unable to update order.' }, 500);
    }
    return jsonResponse({ status: finalStatus ?? orderStatus });
  } catch (error) {
    console.error('Midtrans notification failed:', error);
    return jsonResponse({ error: 'Unable to process notification.' }, 500);
  }
});