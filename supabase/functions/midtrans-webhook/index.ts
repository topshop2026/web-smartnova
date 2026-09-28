import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

type ClaimedOrder = {
  order_id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  items_json: unknown;
  claim_token: string;
};

type OrderLine = {
  product_name?: unknown;
  product?: { name?: unknown };
  unit_price?: unknown;
  unitPrice?: unknown;
  quantity?: unknown;
  days?: unknown;
  features?: unknown;
};

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

function formatPrice(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function getOrderLines(items: unknown) {
  if (!Array.isArray(items)) return [];
  return (items as OrderLine[]).map((item) => {
    const name = typeof item.product_name === 'string'
      ? item.product_name
      : typeof item.product?.name === 'string' ? item.product.name : 'Produk';
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    const quantity = Number(item.quantity ?? 1);
    const days = Number(item.days ?? 0);
    const features = Number(item.features ?? 0);
    return {
      name,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      days: Number.isFinite(days) ? days : 0,
      features: Number.isFinite(features) ? features : 0,
    };
  });
}

async function sendEmailConfirmation(order: ClaimedOrder) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM_EMAIL');
  if (!apiKey || !from) throw new Error('Email confirmation is not configured.');

  const items = getOrderLines(order.items_json).map((item) => `
    <tr>
      <td style="padding:8px 0">${escapeHtml(item.name)}<br><small>${item.days || 'Durasi standar'} hari · ${item.features || 1} fitur · Qty ${item.quantity}</small></td>
      <td style="padding:8px 0;text-align:right">${formatPrice(item.unitPrice * item.quantity)}</td>
    </tr>`).join('');
  const html = `
    <div style="font-family:Arial,sans-serif;color:#172033;max-width:600px;margin:auto">
      <h1 style="font-size:22px">Pembayaran berhasil</h1>
      <p>Halo ${escapeHtml(order.customer_name)}, pembayaran untuk pesanan <strong>${escapeHtml(order.order_number)}</strong> telah berhasil kami terima.</p>
      <table style="width:100%;border-collapse:collapse">${items}</table>
      <p style="border-top:1px solid #ddd;padding-top:12px"><strong>Total: ${formatPrice(Number(order.total_amount))}</strong></p>
      <p>Terima kasih telah berbelanja di SmartNova.</p>
    </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [order.customer_email],
      subject: `Pembayaran berhasil - ${order.order_number}`,
      html,
    }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}

async function sendWhatsAppConfirmation(order: ClaimedOrder) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const templateName = Deno.env.get('WHATSAPP_TEMPLATE_NAME');
  const language = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') ?? 'id';
  const apiVersion = Deno.env.get('WHATSAPP_API_VERSION');
  if (!accessToken || !phoneNumberId || !templateName || !apiVersion) {
    throw new Error('WhatsApp confirmation is not configured.');
  }
  if (!/^v\d+\.\d+$/.test(apiVersion)) throw new Error('Invalid WhatsApp API version.');
  if (!order.customer_phone) throw new Error('Customer WhatsApp number is missing.');

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: order.customer_phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: order.customer_name },
            { type: 'text', text: order.order_number },
            { type: 'text', text: formatPrice(Number(order.total_amount)) },
          ],
        }],
      },
    }),
  });
  if (!response.ok) throw new Error(`WhatsApp provider returned ${response.status}.`);
}

async function sendClaimedConfirmation(
  adminClient: ReturnType<typeof createClient>,
  orderNumber: string,
  channel: 'email' | 'whatsapp'
) {
  const claimToken = crypto.randomUUID();
  const { data, error } = await adminClient.rpc('claim_order_payment_notification', {
    p_order_number: orderNumber,
    p_channel: channel,
    p_claim_token: claimToken,
  });
  if (error) throw new Error(`Unable to claim ${channel} confirmation.`);

  const order = (Array.isArray(data) ? data[0] : null) as ClaimedOrder | undefined;
  if (!order) return;

  try {
    if (channel === 'email') await sendEmailConfirmation(order);
    else await sendWhatsAppConfirmation(order);

    const { data: completed, error: completeError } = await adminClient.rpc('complete_order_payment_notification', {
      p_order_id: order.order_id,
      p_channel: channel,
      p_claim_token: claimToken,
    });
    if (completeError || !completed) throw new Error(`Unable to record ${channel} confirmation.`);
  } catch (error) {
    await adminClient.rpc('release_order_payment_notification', {
      p_order_id: order.order_id,
      p_channel: channel,
      p_claim_token: claimToken,
    });
    throw error;
  }
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

    if (finalStatus === 'completed') {
      const failedChannels: string[] = [];
      for (const channel of ['email', 'whatsapp'] as const) {
        try {
          await sendClaimedConfirmation(adminClient, orderNumber, channel);
        } catch {
          console.error(`Unable to send ${channel} payment confirmation for ${orderNumber}.`);
          failedChannels.push(channel);
        }
      }
      if (failedChannels.length > 0) {
        return jsonResponse({ status: finalStatus, retry_notifications: failedChannels }, 503);
      }
    }

    return jsonResponse({ status: finalStatus ?? orderStatus });
  } catch (error) {
    console.error('Midtrans notification failed:', error);
    return jsonResponse({ error: 'Unable to process notification.' }, 500);
  }
});