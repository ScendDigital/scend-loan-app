// pages/api/payfast/itn.js
// Receives Payfast ITN (x-www-form-urlencoded), rebuilds signature with PHP-style urlencode,
// verifies, and (optionally) sanity-checks merchant_id. Always 200 OK to acknowledge.

import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false, // we need the raw form body
  },
};

function phpUrlEncode(val) {
  return encodeURIComponent(String(val))
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildSigStringItn(fields, passphrase = "") {
  const data = { ...fields };
  delete data.signature; // never include signature in the string
  const pairs = Object.keys(data)
    .filter(k => data[k] !== undefined && data[k] !== null && data[k] !== "")
    .sort()
    .map(k => `${k}=${phpUrlEncode(data[k])}`);
  if (passphrase) pairs.push(`passphrase=${phpUrlEncode(passphrase)}`);
  return pairs.join("&");
}

function md5Lower(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function parseForm(bodyBuffer) {
  const text = bodyBuffer.toString("utf8");
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default async function itnHandler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const raw = await readRawBody(req);
    const data = parseForm(raw);

    // 1) Verify signature
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const rebuiltSig = md5Lower(buildSigStringItn(data, passphrase));
    const incomingSig = data.signature;

    const validSignature = Boolean(incomingSig) && incomingSig === rebuiltSig;
    if (!validSignature) {
      console.warn("Payfast ITN: signature mismatch", { incomingSig, rebuiltSig });
      // Acknowledge with 200 but ignore processing
      return res.status(200).send("Invalid signature");
    }

    // 2) Optional merchant check (handles sandbox vs live)
    const SANDBOX = process.env.PAYFAST_SANDBOX === "true";
    const expectedMerchant = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;
    if (!expectedMerchant || data.merchant_id !== expectedMerchant) {
      console.warn("Payfast ITN: unexpected merchant_id", {
        got: data.merchant_id,
        expected: expectedMerchant,
      });
      return res.status(200).send("Merchant mismatch");
    }

    // 3) Handle status
    const status = (data.payment_status || "").toUpperCase(); // COMPLETE | PENDING | FAILED
    const orderRef = data.m_payment_id || data.custom_str1 || "unknown";

    try {
      if (status === "COMPLETE") {
        // TODO: mark order/session paid (e.g., unlock tool for 2 hours)
        // await grantToolAccess(orderRef, { tool: data.custom_str1, durationHours: 2 });
      } else if (status === "FAILED") {
        // TODO: mark as failed
      } else if (status === "PENDING") {
        // optional: track pending
      }
    } catch (inner) {
      console.error("ITN post-processing error:", inner);
      // Still acknowledge with 200 so Payfast doesn't retry forever
    }

    return res.status(200).send("ITN received");
  } catch (e) {
    console.error("ITN handler error:", e);
    // Still return 200 per Payfast spec
    return res.status(200).send("ITN error logged");
  }
}
