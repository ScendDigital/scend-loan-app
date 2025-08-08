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

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.payfast.co.za/eng/process"; // LIVE URL

    const fields = {
      merchant_id: "16535198",         // LIVE ID
      merchant_key: "xc6fbuaqkyel6",   // LIVE Key
      amount: "55.00",
      item_name: `Scend - ${tool === "loan" ? "Loan Tool" : "Tax Tool"} Access`, // replaced en dash with dash
      email_address: "motlatsi.lenyatsa@gmail.com", // added buyer email
      return_url: `https://www.scend.co.za/${tool}`,
      cancel_url: `https://www.scend.co.za/select-tool`,
      notify_url: `https://www.scend.co.za/api/payfast/notify`,
    };

    for (const key in fields) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }, [tool]);

  return <p>Redirecting to Payfast for secure R55.00 payment...</p>;
}
