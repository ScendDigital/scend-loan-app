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

    // Create the payment form dynamically
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.payfast.co.za/eng/process"; // LIVE URL

    // Live merchant details with required fields for live mode
    const fields = {
      merchant_id: "16535198",
      merchant_key: "xc6fbuaqkyel6",
      amount: "55.00", // two decimal places
      item_name: `Scend - ${tool === "loan" ? "Loan Tool" : "Tax Tool"} Access`, // normal hyphen instead of en-dash
      name_first: "Motlatsi",
      name_last: "Lenyatsa",
      email_address: "motlatsi.lenyatsa@gmail.com",
      return_url: `https://www.scend.co.za/${tool}`,
      cancel_url: `https://www.scend.co.za/select-tool`,
      notify_url: `https://www.scend.co.za/api/payfast/notify`,
    };

    // Append hidden inputs
    for (const key in fields) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    }

    // Append and submit
    document.body.appendChild(form);
    form.submit();
  }, [tool]);

  return <p>Redirecting to Payfast for secure R55.00 payment...</p>;
}
