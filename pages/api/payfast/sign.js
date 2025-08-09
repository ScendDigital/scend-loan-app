// Builds Payfast POST + signature (PHP-style urlencode).
// Sandbox: no passphrase. Live: append passphrase if set.
// Signature = MD5 of ALL posted fields except 'signature' (merchant_key IS included).

import crypto from "crypto";

function phpUrlEncode(v) {
  return encodeURIComponent(String(v))
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
function buildSigString(fields, passphrase = "") {
  const pairs = Object.keys(fields)
    .filter(k => k !== "signature" && fields[k] !== undefined && fields[k] !== null && fields[k] !== "")
    .sort()
    .map(k => `${k}=${phpUrlEncode(fields[k])}`);
  if (passphrase) pairs.push(`passphrase=${phpUrlEncode(passphrase)}`);
  return pairs.join("&");
}
const md5 = s => crypto.createHash("md5").update(s).digest("hex");

function makePaymentId(prefix = "SCEND") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      amount, item_name, item_description, custom_str1, mode,
      return_url, cancel_url, notify_url, name_first, name_last, email_address, m_payment_id
    } = req.body || {};

    if (!amount || !item_name) return res.status(400).json({ error: "amount and item_name are required" });

    const SANDBOX = (process.env.PAYFAST_SANDBOX === "true") || mode === "sandbox";
    const merchant_id  = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;
    const merchant_key = SANDBOX ? "46f0cd694581a" : process.env.PAYFAST_MERCHANT_KEY_LIVE;
    if (!merchant_id || !merchant_key) return res.status(500).json({ error: "Merchant credentials are missing on server" });

    const base = process.env.PUBLIC_BASE_URL || "https://www.scend.co.za";
    const postFields = {
      merchant_id,
      merchant_key, // included & signed
      return_url: return_url || `${base}/success`,
      cancel_url:  cancel_url  || `${base}/cancel`,
      notify_url:  notify_url  || `${base}/api/payfast/itn`,
      amount: Number.parseFloat(amount).toFixed(2),
      item_name,
      m_payment_id: m_payment_id || makePaymentId(custom_str1 || "SCEND"),
      ...(item_description ? { item_description } : {}),
      ...(custom_str1 ? { custom_str1 } : {}),
      ...(name_first ? { name_first } : {}),
      ...(name_last ? { name_last } : {}),
      ...(email_address ? { email_address } : {}),
    };

    // Only append passphrase in LIVE (sandbox has none)
    const passphrase = (!SANDBOX && process.env.PAYFAST_PASSPHRASE) ? process.env.PAYFAST_PASSPHRASE : "";
    const sigString  = buildSigString(postFields, passphrase);
    const signature  = md5(sigString);

    const endpoint = SANDBOX
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    return res.status(200).json({
      endpoint,
      post: { ...postFields, signature },
      debug: { SANDBOX, sigString }
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
