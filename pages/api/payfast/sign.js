// pages/api/payfast/sign.js
import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    merchant_id,
    merchant_key,
    return_url,
    cancel_url,
    notify_url,
    amount,
    item_name,
    m_payment_id,
    item_description,
    custom_str1
  } = req.body;

  try {
    // Build parameter object (NO merchant_key in signature string per Payfast docs)
    const params = {
      merchant_id,
      return_url,
      cancel_url,
      notify_url,
      amount: parseFloat(amount).toFixed(2), // Ensure correct format
      item_name,
      m_payment_id,
      item_description,
      custom_str1
    };

    // Sort keys alphabetically
    const sortedKeys = Object.keys(params).sort();

    // Build query string
    const queryString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join("&");

    // Append passphrase if using one (for now, we have NO passphrase)
    const signatureString = queryString; // No passphrase

    // Generate md5 signature
    const signature = crypto
      .createHash("md5")
      .update(signatureString)
      .digest("hex");

    // Send signature back to frontend
    res.status(200).json({
      signature,
      signatureString
    });

  } catch (err) {
    console.error("Signature generation error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
