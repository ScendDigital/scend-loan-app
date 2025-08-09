// pages/pay.jsx
import { useState } from "react";

const PF_ENDPOINTS = {
  sandbox: "https://sandbox.payfast.co.za/eng/process",
  live: "https://www.payfast.co.za/eng/process",
};

export default function PayPage() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(process.env.NEXT_PUBLIC_PAYFAST_MODE || "live");

  const [form, setForm] = useState({
    name_first: "",
    name_last: "",
    email_address: "",
    amount: "",
    item_name: "Scend Tool Access (2 hours)",
    custom_str1: "LoanTool", // or "TaxTool"
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const makePaymentId = () =>
    `SCEND-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handlePay = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const isSandbox = mode === "sandbox";
      const m_payment_id = makePaymentId();
      const cleanAmount = (Number(form.amount) || 0).toFixed(2);

      // 1) Build EXACT fields we’ll sign and later post to Payfast
      const pfFields = {
        // merchant
        merchant_id: isSandbox
          ? "10000100"
          : process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "16535198",
        merchant_key: isSandbox
          ? "46f0cd694581a"
          : process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || "xc6fbuaqkyel6",

        // urls
        return_url:
          process.env.NEXT_PUBLIC_PAYFAST_RETURN_URL ||
          "https://www.scend.co.za/success",
        cancel_url:
          process.env.NEXT_PUBLIC_PAYFAST_CANCEL_URL ||
          "https://www.scend.co.za/cancel",
        notify_url:
          process.env.NEXT_PUBLIC_PAYFAST_NOTIFY_URL ||
          "https://www.scend.co.za/api/payfast/ipn",

        // txn
        amount: cleanAmount,
        item_name: form.item_name,
        m_payment_id,

        // buyer
        name_first: form.name_first,
        name_last: form.name_last,
        email_address: form.email_address,

        // custom
        custom_str1: form.custom_str1,
      };

      // 2) Ask your API to generate the signature for THESE EXACT FIELDS
      const res = await fetch("/api/payfast/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pfFields),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Signature API failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      const signature = data?.signature;
      if (!signature) {
        console.error("No signature returned:", data);
        alert("Could not generate signature. Please try again.");
        return; // prevent posting without signature
      }

      // 3) Build form POST to Payfast (fields + signature)
      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = PF_ENDPOINTS[isSandbox ? "sandbox" : "live"];

      const add = (k, v) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        formEl.appendChild(input);
      };

      Object.entries(pfFields).forEach(([k, v]) => add(k, v));
      add("signature", signature); // REQUIRED

      document.body.appendChild(formEl);
      formEl.submit();
    } catch (err) {
      console.error(err);
      alert(err.message || "Payment init failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h1>Pay for Access</h1>
      <p>Payfast Standard Redirect</p>

      <div style={{ margin: "12px 0" }}>
        <label>
          Mode:&nbsp;
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </label>
      </div>

      {/* We keep a <form> for layout/validation, but the button is type="button" so only handlePay runs */}
      <form onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            First name
            <input
              name="name_first"
              value={form.name_first}
              onChange={onChange}
              required
              placeholder="John"
            />
          </label>

          <label>
            Last name
            <input
              name="name_last"
              value={form.name_last}
              onChange={onChange}
              required
              placeholder="Doe"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email_address"
              value={form.email_address}
              onChange={onChange}
              required
              placeholder="john@example.com"
            />
          </label>

          <label>
            Amount (ZAR)
            <input
              type="number"
              step="0.01"
              min="1"
              name="amount"
              value={form.amount}
              onChange={onChange}
              required
              placeholder="99.00"
            />
          </label>

          <label>
            Item name
            <input
              name="item_name"
              value={form.item_name}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Tool (custom_str1)
            <select
              name="custom_str1"
              value={form.custom_str1}
              onChange={onChange}
            >
              <option>LoanTool</option>
              <option>TaxTool</option>
            </select>
          </label>

          {/* IMPORTANT: type="button" so native submit can't bypass our signature step */}
          <button type="button" onClick={handlePay} disabled={loading}>
            {loading ? "Redirecting..." : "Pay with Payfast"}
          </button>
        </div>
      </form>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
        Tip: In DevTools → Network, the <code>process</code> request’s Form Data must include
        a <code>signature</code> field. If it’s missing, this page will not submit.
      </p>
    </main>
  );
}
