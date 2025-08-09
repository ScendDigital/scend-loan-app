// pages/pay.jsx
import { useState } from "react";

const PF_ENDPOINTS = {
  sandbox: "https://sandbox.payfast.co.za/eng/process",
  live: "https://www.payfast.co.za/eng/process",
};

export default function PayPage() {
  const [mode, setMode] = useState(process.env.NEXT_PUBLIC_PAYFAST_MODE || "live");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name_first: "",
    name_last: "",
    email_address: "",
    amount: "",
    item_name: "Scend Tool Access (2 hours)",
    custom_str1: "LoanTool",
  });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const makePaymentId = () =>
    `SCEND-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const isSandbox = mode === "sandbox";
      const cleanAmount = (Number(form.amount) || 0).toFixed(2);

      // EXACT fields Payfast accepts (NO merchant_key, NO signature yet)
      const fields = {
        merchant_id: isSandbox
          ? "10000100"
          : process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "16535198",

        return_url:
          process.env.NEXT_PUBLIC_PAYFAST_RETURN_URL ||
          "https://www.scend.co.za/success",
        cancel_url:
          process.env.NEXT_PUBLIC_PAYFAST_CANCEL_URL ||
          "https://www.scend.co.za/cancel",
        notify_url:
          process.env.NEXT_PUBLIC_PAYFAST_NOTIFY_URL ||
          "https://www.scend.co.za/api/payfast/ipn",

        amount: cleanAmount,
        item_name: form.item_name,
        m_payment_id: makePaymentId(),

        name_first: form.name_first,
        name_last: form.name_last,
        email_address: form.email_address,

        custom_str1: form.custom_str1,
      };

      // Ask our API to sign THESE EXACT FIELDS
      const r = await fetch("/api/payfast/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const j = await r.json();
      if (!r.ok || !j.signature) {
        console.error("Sign failed:", j);
        alert("Could not generate signature. Please try again.");
        return;
      }

      // Build Payfast form: fields + signature
      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = PF_ENDPOINTS[isSandbox ? "sandbox" : "live"];

      const add = (k, v) => {
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = k;
        i.value = v;
        formEl.appendChild(i);
      };

      Object.entries(fields).forEach(([k, v]) => add(k, v));
      add("signature", j.signature);

      document.body.appendChild(formEl);
      formEl.submit();
    } catch (e) {
      console.error(e);
      alert("Payment init failed. Check console for details.");
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

      <form onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            First name
            <input name="name_first" value={form.name_first} onChange={onChange} required />
          </label>
          <label>
            Last name
            <input name="name_last" value={form.name_last} onChange={onChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email_address" value={form.email_address} onChange={onChange} required />
          </label>
          <label>
            Amount (ZAR)
            <input type="number" step="0.01" min="1" name="amount" value={form.amount} onChange={onChange} required />
          </label>
          <label>
            Item name
            <input name="item_name" value={form.item_name} onChange={onChange} required />
          </label>
          <label>
            Tool (custom_str1)
            <select name="custom_str1" value={form.custom_str1} onChange={onChange}>
              <option>LoanTool</option>
              <option>TaxTool</option>
            </select>
          </label>

          {/* Use type="button" so native submit can’t bypass our JS */}
          <button type="button" onClick={handlePay} disabled={loading}>
            {loading ? "Redirecting..." : "Pay with Payfast"}
          </button>
        </div>
      </form>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
        After clicking Pay, DevTools → Network → <code>process</code> should show a <code>signature</code> field.
      </p>
    </main>
  );
}
