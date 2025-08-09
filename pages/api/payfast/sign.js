// pages/api/payfast/sign.js
import crypto from "crypto";

function rawurlencode(val) {
  return encodeURIComponent(String(val)).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}
function buildSigString(fields, passphrase = "") {
  const pairs = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== "")
    .sort()
    .map((k) => `${k}=${rawurlencode(fields[k])}`);
  if (passphrase) pairs.push(`passphrase=${rawurlencode(passphrase)}`);
  return pairs.join("&");
}
function md5Lower(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}
function makePaymentId(prefix = "SCEND") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now();
  return `${prefix}-${ts}-${rand}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      amount,
      item_name,
      item_description,
      custom_str1,     // e.g. LoanTool | TaxTool
      mode,            // 'sandbox' | 'live' (from client)
      return_url,
      cancel_url,
      notify_url,
      name_first,
      name_last,
      email_address,
      m_payment_id,    // optional from client; we’ll generate if missing
    } = req.body || {};

    if (!amount || !item_name) {
      return res.status(400).json({ error: "amount and item_name are required" });
    }

    // Decide environment
    const SANDBOX = (process.env.PAYFAST_SANDBOX === "true") || mode === "sandbox";
    const merchant_id  = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;
    const merchant_key = SANDBOX ? "46f0cd694581a" : process.env.PAYFAST_MERCHANT_KEY_LIVE;

    if (!merchant_id || !merchant_key) {
      return res.status(500).json({ error: "Merchant credentials are missing on server" });
    }

    // URLs
    const base = process.env.PUBLIC_BASE_URL || "https://www.scend.co.za";
    const retUrl = return_url || `${base}/success`;
    const canUrl = cancel_url || `${base}/cancel`;
    const notUrl = notify_url || `${base}/api/payfast/itn`;

    const normalizedAmount = Number.parseFloat(amount).toFixed(2);
    const paymentId = m_payment_id || makePaymentId(custom_str1 || "SCEND");

    // Build post fields (do NOT include signature yet)
    const postFields = {
      merchant_id,
      merchant_key,
      return_url: retUrl,
      cancel_url: canUrl,
      notify_url: notUrl,
      amount: normalizedAmount,
      item_name,
      m_payment_id: paymentId,
      ...(item_description ? { item_description } : {}),
      ...(custom_str1 ? { custom_str1 } : {}),
      ...(name_first ? { name_first } : {}),
      ...(name_last ? { name_last } : {}),
      ...(email_address ? { email_address } : {}),
    };

    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const sigString = buildSigString(postFields, passphrase);
    const signature = md5Lower(sigString);

    const endpoint = SANDBOX
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    return res.status(200).json({
      endpoint,
      post: { ...postFields, signature },
      debug: { SANDBOX }
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
