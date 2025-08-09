// pages/api/payfast/itn.js
// Next.js API route to receive Payfast ITN (Instant Transaction Notification)
// - Parses x-www-form-urlencoded body
// - Rebuilds and verifies signature (with optional passphrase)
// - (Optional) validates merchant_id/amount/tool, etc.
// - Always responds 200 to acknowledge receipt (per Payfast docs)

import crypto from "crypto";

// We need the raw body for accurate parsing & signature checks
export const config = {
  api: {
    bodyParser: false,
  },
};

// --- Helpers -------------------------------------------------------------

function rawurlencode(val) {
  // Match PHP rawurlencode behaviour
  return encodeURIComponent(String(val)).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function buildSigString(fields, passphrase = "") {
  // Recreate the signature string from all fields except `signature`
  const copy = { ...fields };
  delete copy.signature;

  const pairs = Object.keys(copy)
    .filter((k) => copy[k] !== undefined && copy[k] !== null && copy[k] !== "")
    .sort()
    .map((k) => `${k}=${rawurlencode(copy[k])}`);

  if (passphrase) {
    pairs.push(`passphrase=${rawurlencode(passphrase)}`);
  }
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
  // Payfast sends application/x-www-form-urlencoded
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

// --- MAIN HANDLER -------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    // ITN is POST only
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const raw = await readRawBody(req);
    const data = parseForm(raw);

    // Optional: basic sanity logging (remove or redact in production)
    // console.log("ITN received:", data);

    // 1) Verify signature
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const sigString = buildSigString(data, passphrase);
    const rebuiltSig = md5Lower(sigString);
    const incomingSig = data.signature;

    const validSignature =
      incomingSig && typeof incomingSig === "string" && incomingSig === rebuiltSig;

    if (!validSignature) {
      // Acknowledge to Payfast with 200, but do not process the order
      console.warn("Payfast ITN: signature mismatch", {
        incomingSig,
        rebuiltSig,
      });
      res.status(200).send("Invalid signature");
      return;
    }

    // 2) Optional: Validate known fields (recommended)
    //    Make sure the ITN is actually for your merchant and expected amount/tool.
    //    (Adjust checks to your logic. These are examples.)
    const SANDBOX = process.env.PAYFAST_SANDBOX === "true";
    const expectedMerchant = SANDBOX ? "10000100" : process.env.PAYFAST_MERCHANT_ID_LIVE;

    if (!expectedMerchant || data.merchant_id !== expectedMerchant) {
      console.warn("Payfast ITN: unexpected merchant_id", {
        got: data.merchant_id,
        expected: expectedMerchant,
      });
      res.status(200).send("Merchant mismatch");
      return;
    }

    // Example integrity checks you can enable:
    // const expectedTool = /* look up by custom_str1 or your order ref */;
    // const expectedAmount = /* look up from your DB by m_payment_id */;
    // if (Number(data.amount_gross) !== Number(expectedAmount)) { ... }

    // 3) Payment status handling
    // COMPLETE | PENDING | FAILED
    const status = (data.payment_status || "").toUpperCase();
    const orderRef = data.m_payment_id || data.custom_str1 || "unknown";

    try {
      if (status === "COMPLETE") {
        // TODO: mark order paid, unlock access/session, send receipt, etc.
        // await grantToolAccess(orderRef, { tool: data.custom_str1, durationHours: 2 });
      } else if (status === "PENDING") {
        // TODO: hold state as pending if you wish
      } else if (status === "FAILED") {
        // TODO: mark order failed / notify user
      }
    } catch (inner) {
      console.error("ITN post-processing error:", inner);
      // Still reply 200 so Payfast stops retrying; log & handle internally
    }

    // 4) Always 200 OK to acknowledge receipt
    res.status(200).send("ITN received");
  } catch (err) {
    // Per Payfast spec, still return 200 to acknowledge receipt
    console.error("ITN handler error:", err);
    res.status(200).send("ITN error logged");
  }
}
