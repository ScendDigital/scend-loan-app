// src/pages/api/payfast/sign.js
import crypto from "crypto";

export default function handler(req, res) {
  // If it's a GET request, just confirm the endpoint is live
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "PayFast sign.js API is live 🚀",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    if (!passphrase) {
      return res.status(500).json({ error: "Passphrase not set on server" });
    }

    const fields = req.body || {};
    console.log("Incoming PayFast fields:", fields);

    // Build the string for signing
    const pfString = Object.entries(fields)
      .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`)
      .join("&");

    const signature = crypto
      .createHash("md5")
      .update(`${pfString}&passphrase=${encodeURIComponent(passphrase)}`)
      .digest("hex");

    console.log("Generated signature:", signature);

    res.status(200).json({ signature });
  } catch (error) {
    console.error("Error in sign.js:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
