import { useState } from "react";
import jsPDF from "jspdf";

export default function TaxTool() {
  const [income, setIncome] = useState(0);
  const [dependents, setDependents] = useState(0);
  const [idNumber, setIdNumber] = useState("");
  const [retirement, setRetirement] = useState(0);
  const [carAllowance, setCarAllowance] = useState(0);
  const [taxPaid, setTaxPaid] = useState(0);
  const [result, setResult] = useState(null);

  const calculateTax = () => {
    const age = getAgeFromID(idNumber);
    const isUnder65 = age < 65;
    const isUnder75 = age < 75;

    const primaryRebate = 17235;
    const secondaryRebate = 9444;
    const tertiaryRebate = 3145;

    let rebate = primaryRebate;
    if (!isUnder65) rebate += secondaryRebate;
    if (!isUnder75) rebate += tertiaryRebate;

    const taxableIncome = income - retirement - (carAllowance * 0.8);

    let tax = 0;
    if (taxableIncome <= 237100) tax = taxableIncome * 0.18;
    else if (taxableIncome <= 370500) tax = 42678 + (taxableIncome - 237100) * 0.26;
    else if (taxableIncome <= 512800) tax = 77362 + (taxableIncome - 370500) * 0.31;
    else if (taxableIncome <= 673000) tax = 121475 + (taxableIncome - 512800) * 0.36;
    else if (taxableIncome <= 857900) tax = 179147 + (taxableIncome - 673000) * 0.39;
    else if (taxableIncome <= 1817000) tax = 251258 + (taxableIncome - 857900) * 0.41;
    else tax = 644489 + (taxableIncome - 1817000) * 0.45;

    // Medical tax credit
    let medCredit = 0;
    if (dependents >= 1) medCredit += 364;
    if (dependents >= 2) medCredit += 364;
    if (dependents >= 3) medCredit += (dependents - 2) * 246;
    const annualMedCredit = medCredit * 12;

    const finalTax = Math.max(tax - rebate - annualMedCredit, 0);
    const difference = taxPaid - finalTax;

    const message = difference > 0
      ? `✅ You have overpaid. SARS owes you R${difference.toFixed(2)}`
      : difference < 0
      ? `❌ You owe SARS R${Math.abs(difference).toFixed(2)}`
      : `✅ Your tax is correctly calculated. No amount due to or from SARS.`;

    setResult({
      tax: tax.toFixed(2),
      rebate,
      annualMedCredit,
      finalTax: finalTax.toFixed(2),
      message
    });
  };

  const clearAll = () => {
    setIncome(0);
    setDependents(0);
    setIdNumber("");
    setRetirement(0);
    setCarAllowance(0);
    setTaxPaid(0);
    setResult(null);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SARS Tax Calculation Results", 20, 20);
    const lines = [
      `Annual Income: R ${income}`,
      `Dependents: ${dependents}`,
      `Retirement Contribution: R ${retirement}`,
      `Car Allowance: R ${carAllowance}`,
      `Tax Paid: R ${taxPaid}`,
      `Tax Before Rebates: R ${result.tax}`,
      `Primary + Age Rebates: R ${result.rebate}`,
      `Medical Aid Credit: R ${result.annualMedCredit}`,
      `Final Tax Due: R ${result.finalTax}`,
      `Outcome: ${result.message}`
    ];
    doc.setFontSize(12);
    doc.text(lines, 20, 40);
    doc.save("tax-results.pdf");
  };

  const getAgeFromID = (id) => {
    const birthYear = parseInt(id.slice(0, 2), 10);
    const fullYear = birthYear > 50 ? 1900 + birthYear : 2000 + birthYear;
    const birthMonth = parseInt(id.slice(2, 4), 10) - 1;
    const birthDay = parseInt(id.slice(4, 6), 10);
    const birthDate = new Date(fullYear, birthMonth, birthDay);
    const ageDifMs = Date.now() - birthDate.getTime();
    return Math.floor(ageDifMs / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "1rem", border: "2px solid #ec4899", borderRadius: "10px", backgroundColor: "#fdf2f8" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#6b7280", marginBottom: "1rem" }}>Tax Calculator (SARS 2024/2025)</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label>Gross Annual Income: <input type="number" value={income} onChange={e => setIncome(parseFloat(e.target.value))} /></label>
        <label>Medical Aid Dependents: <input type="number" value={dependents} onChange={e => setDependents(parseInt(e.target.value))} /></label>
        <label>ID Number: <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} /></label>
        <label>Retirement Contributions: <input type="number" value={retirement} onChange={e => setRetirement(parseFloat(e.target.value))} /></label>
        <label>Car Allowance: <input type="number" value={carAllowance} onChange={e => setCarAllowance(parseFloat(e.target.value))} /></label>
        <label>Tax Paid: <input type="number" value={taxPaid} onChange={e => setTaxPaid(parseFloat(e.target.value))} /></label>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={calculateTax}>Calculate</button>
        <button onClick={clearAll} style={{ marginLeft: "1rem" }}>Clear</button>
        <button onClick={exportPDF} style={{ marginLeft: "1rem" }}>Export PDF</button>
      </div>

      {result && (
        <div style={{ marginTop: "2rem", backgroundColor: "#fff0f6", padding: "1rem", borderRadius: "8px" }}>
          <h3 style={{ color: "#6b7280" }}>Results:</h3>
          <p>Tax Before Rebates: R {result.tax}</p>
          <p>Rebates: R {result.rebate}</p>
          <p>Medical Aid Credit: R {result.annualMedCredit}</p>
          <p><strong>Final Tax Payable: R {result.finalTax}</strong></p>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}
