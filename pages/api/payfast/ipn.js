// pages/api/payfast/ipn.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // Log raw body (configure bodyParser if you need raw)
  console.log("📬 Payfast IPN:", req.body);
  // TODO: Implement full validation roundtrip with Payfast before marking as definitive.
  res.status(200).end("OK");
}
