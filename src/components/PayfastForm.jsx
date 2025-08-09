// =========================
// 1) .env.local (create this)
// =========================
// NEVER commit to Git!
// Switch SANDBOX to 'true' while testing
// PAYFAST_SANDBOX=true
// PAYFAST_MERCHANT_ID_LIVE=16535198
// PAYFAST_MERCHANT_KEY_LIVE=xc6fbuaqkyel6
// optional: set only if you added a passphrase in Payfast Dashboard > Settings
// PAYFAST_PASSPHRASE=
// PUBLIC_BASE_URL=https://www.scend.co.za

// =====================================================
// 2) pages/api/payfast/sign.js  (server-side signature)
// =====================================================
import crypto from 'crypto';

function encode(val) {
  // Payfast uses PHP rawurlencode semantics; encodeURIComponent matches closely
  return encodeURIComponent(String(val)).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function toSigString(fields, passphrase) {
  // Expects fields WITHOUT signature. Keys sorted A-Z. Values URL-encoded.
  const pairs = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== '')
    .sort()
    .map((k) => `${k}=${encode(fields[k])}`);
  if (passphrase) {
    pairs.push(`passphrase=${encode(passphrase)}`);
  }
  return pairs.join('&');
}

function md5Lower(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      amount,
      item_name,
      item_description,
      custom_str1, // e.g., LoanTool or TaxTool
      mode = 'sandbox', // 'sandbox' | 'live'
      return_url,
      cancel_url,
      notify_url,
      name_first,
      name_last,
      email_address,
    } = req.body || {};

    if (!amount || !item_name) {
      return res.status(400).json({ error: 'amount and item_name are required' });
    }

    // Choose credentials based on mode
    const SANDBOX = (process.env.PAYFAST_SANDBOX === 'true') || mode === 'sandbox';
    const merchant_id = SANDBOX ? '10000100' : process.env.PAYFAST_MERCHANT_ID_LIVE;
    const merchant_key = SANDBOX ? '46f0cd694581a' : process.env.PAYFAST_MERCHANT_KEY_LIVE;

    if (!merchant_id || !merchant_key) {
      return res.status(500).json({ error: 'Merchant credentials are missing on server' });
    }

    const base = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    const retUrl = return_url || `${base}/success`;
    const canUrl = cancel_url || `${base}/cancel`;
    // IMPORTANT: notify_url must be PUBLIC
    const notUrl = notify_url || `${base}/api/payfast/itn`;

    // Normalize amount format to two decimals with dot
    const normalizedAmount = Number.parseFloat(amount).toFixed(2);

    // Build the posting fields (do NOT include signature here)
    const postFields = {
      merchant_id,
      merchant_key,
      return_url: retUrl,
      cancel_url: canUrl,
      notify_url: notUrl,
      amount: normalizedAmount,
      item_name,
      ...(item_description ? { item_description } : {}),
      ...(custom_str1 ? { custom_str1 } : {}),
      ...(name_first ? { name_first } : {}),
      ...(name_last ? { name_last } : {}),
      ...(email_address ? { email_address } : {}),
    };

    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    const sigString = toSigString(postFields, passphrase);
    const signature = md5Lower(sigString);

    const endpoint = SANDBOX
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    return res.status(200).json({
      endpoint,
      post: { ...postFields, signature },
      debug: {
        SANDBOX,
        sigString, // useful while testing; remove in production if you prefer
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}

// =====================================================
// 3) pages/api/payfast/itn.js  (ITN listener + signature verify)
// =====================================================
import cryptoItn from 'crypto';

function encode2(val) {
  return encodeURIComponent(String(val)).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function sigForItn(fields, passphrase) {
  const clone = { ...fields };
  delete clone.signature; // never include signature when recreating
  const pairs = Object.keys(clone)
    .filter((k) => clone[k] !== undefined && clone[k] !== null && clone[k] !== '')
    .sort()
    .map((k) => `${k}=${encode2(clone[k])}`);
  if (passphrase) pairs.push(`passphrase=${encode2(passphrase)}`);
  const sigString = pairs.join('&');
  return cryptoItn.createHash('md5').update(sigString).digest('hex');
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function itnHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const data = req.body || {};

    // Verify signature
    const incomingSig = data.signature;
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    const rebuiltSig = sigForItn(data, passphrase);

    if (!incomingSig || incomingSig !== rebuiltSig) {
      console.warn('ITN signature mismatch', { incomingSig, rebuiltSig, data });
      // Always reply 200 OK to acknowledge receipt (per Payfast docs), but ignore payload internally
      return res.status(200).send('Invalid signature');
    }

    // TODO: Optionally verify source IP matches Payfast ranges, and validate amount, merchant_id, etc.

    // Handle statuses: COMPLETE, FAILED, PENDING
    const paymentStatus = data.payment_status;
    // Example: mark order/session active for 2 hours, etc.

    return res.status(200).send('ITN received');
  } catch (e) {
    console.error('ITN error', e);
    return res.status(200).send('ITN error logged');
  }
}

// =====================================================
// 4) src/components/PayfastForm.jsx (Front-end submitter)
// =====================================================
import { useState } from 'react';

export default function PayfastForm({
  defaultAmount = 100,
  itemName = 'Scend Tool Access (2 hours)',
  tool = 'LoanTool', // or 'TaxTool'
  mode = 'sandbox', // switch to 'live' when ready
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [postFields, setPostFields] = useState(null);

  const createSignature = async () => {
    setError('');
    setLoading(true);
    try {
      const resp = await fetch('/api/payfast/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: defaultAmount,
          item_name: itemName,
          item_description: `${tool} access for 2 hours`,
          custom_str1: tool,
          mode,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Failed to sign');
      setEndpoint(json.endpoint);
      setPostFields(json.post);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitToPayfast = () => {
    if (!postFields || !endpoint) return;
    // Build a form and post as application/x-www-form-urlencoded
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = endpoint;

    Object.entries(postFields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="space-y-4">
      <div className="text-sm opacity-80">Mode: {mode === 'sandbox' ? 'Sandbox' : 'Live'}</div>
      <div className="flex gap-2">
        <button disabled={loading} onClick={createSignature} className="px-3 py-2 rounded bg-black text-white">
          1) Generate signature
        </button>
        <button disabled={!postFields} onClick={submitToPayfast} className="px-3 py-2 rounded border">
          2) Continue to Payfast
        </button>
      </div>
      {postFields && (
        <div className="text-xs break-all">
          <div><b>Signature:</b> {postFields.signature}</div>
          <details className="mt-2">
            <summary>Fields being posted</summary>
            <pre className="p-2 bg-gray-100 rounded">{JSON.stringify(postFields, null, 2)}</pre>
          </details>
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}

// =====================================================
// 5) Example usage page – pages/pay.js
// =====================================================
import dynamic from 'next/dynamic';
const PayfastForm = dynamic(() => import('../src/components/PayfastForm'), { ssr: false });

export default function PayPage() {
  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 16 }}>
      <h1>Pay for Access (Diagnostic)</h1>
      <PayfastForm mode={process.env.NEXT_PUBLIC_PAYFAST_MODE || 'sandbox'} tool="LoanTool" />
    </div>
  );
}

// =====================
// 6) Notes / Gotchas
// =====================
// • A 500 often happens when: signature is wrong, a required field is blank, or amount format is invalid.
// • Make sure amount has two decimals (e.g., 100.00) and item_name is non-empty.
// • notify_url must be publicly reachable. In dev, use sandbox + a public tunnel (e.g., ngrok) and set PUBLIC_BASE_URL.
// • If you configured a Payfast passphrase in Dashboard, you MUST include it in both signing and ITN verification.
// • Only ever generate signatures server-side (API route). Never expose your live merchant key in the browser.
