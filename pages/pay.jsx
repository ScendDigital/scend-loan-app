// pages/pay.jsx
import { useState } from "react";

const PF_ENDPOINTS = {
  sandbox: "https://sandbox.payfast.co.za/eng/process",
  live: "https://www.payfast.co.za/eng/process",
};

export default function PayPage() {
  const [mode, setMode] = useState(process.env.NEXT_PUBLIC_PAYFAST_MODE || "live");
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState("");
  const [pfFields, setPfFields] = useState(null);
  const [form, setForm] = useState({
    name_first: "",
    name_last: "",
    email_address: "",
    amount: "",
    item_name: "Scend Tool Access (2 hours)",
    custom_str1: "LoanTool",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const makePaymentId = () =>
    `SCEND-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  async function getSignature() {
    setSignature("");
    setPfFields(null);
    setLoading(true);
    try {
      const isSandbox = mode === "sandbox";
      const cleanAmount = (Number(form.amount) || 0).toFixed(2);
      const fields = {
        merchant_id: isSandbox
          ? "10000100"
          : process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "16535198",
        merchant_key: isSandbox
          ? "46f0cd694581a"
          : process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || "xc6fbuaqkyel6",
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

      const res = await fetch("/api/payfast/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok || !data.signature) {
        console.error("Sign failed:", data);
        alert("Signature API failed. Check console.");
        return;
      }
      setSignature(data.signature);
      setPfFields(fields);
      console.log("PF SIGNATURE:", data.signature);
      console.log("PF FIELDS:", fields);
    } catch (e) {
      console.error(e);
      alert("Could not generate signature.");
    } finally {
      setLoading(false);
    }
  }

  function continueToPayfast() {
    if (!pfFields || !signature) {
      alert("No signature yet.");
      return;
    }
    const isSandbox = mode === "sandbox";
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

    Object.entries(pfFields).forEach(([k, v]) => add(k, v));
    add("signature", signature); // ← you will now SEE this appear in Network → process → Form Data

    document.body.appendChild(formEl);
    formEl.submit();
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h1>Pay for Access (Diagnostic)</h1>
      <p>This page will fetch a signature first, show it, then enable the Payfast submit.</p>

      <div style={{ margin: "12px 0" }}>
        <label>
          Mode:&nbsp;
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </label>
      </div>

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

        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" onClick={getSignature} disabled={loading}>
            {loading ? "Generating signature..." : "1) Generate signature"}
          </button>
          <button
            type="button"
            onClick={continueToPayfast}
            disabled={!signature || !pfFields}
            title={!signature ? "Generate signature first" : "Continue"}
          >
            2) Continue to Payfast
          </button>
        </div>

        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div><strong>Signature:</strong> <code>{signature || "(none yet)"}</code></div>
          <div style={{ marginTop: 8 }}>
            <strong>Fields being posted:</strong>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
{JSON.stringify(pfFields, null, 2)}
            </pre>
          </div>
        </div>

        <p style={{ fontSize: 12, opacity: 0.8 }}>
          In DevTools → Network: after step (2), open the <code>process</code> request → Form Data. You
          should see a <code>signature</code> field. If Payfast still errors, copy that signature here.
        </p>
      </div>
    </main>
  );
}
