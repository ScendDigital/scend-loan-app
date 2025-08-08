// pages/pay.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PayPage() {
  const router = useRouter();
  const { tool } = router.query;

  useEffect(() => {
    if (!tool || (tool !== "loan" && tool !== "tax")) {
      router.push("/select-tool");
      return;
    }

    const run = async () => {
      // Fields required by PayFast; ASCII in item_name (use hyphen, not en–dash)
      const fields = {
        merchant_id: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID,
        merchant_key: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY,
        amount: "55.00",
        item_name: `Scend - ${tool === "loan" ? "Loan Tool" : "Tax Tool"} Access`,
        email_address: "motlatsi.lenyatsa@gmail.com",
        name_first: "Motlatsi",
        name_last: "Lenyatsa",
        return_url: `https://www.scend.co.za/${tool}`,
        cancel_url: `https://www.scend.co.za/select-tool`,
        notify_url: `https://www.scend.co.za/api/payfast/notify`,
      };

      // Ask our API to sign with the server-side passphrase
      const resp = await fetch("/api/payfast/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!resp.ok) {
        console.error("Signing failed", await resp.text());
        return;
      }

      const { signature } = await resp.json();

      // Build and post the form to LIVE PayFast
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://www.payfast.co.za/eng/process";

      const payload = { ...fields, signature };
      Object.entries(payload).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    };

    run();
  }, [tool, router]);

  return <p>Redirecting to Payfast for secure R55.00 payment...</p>;
}
