import { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function LoanTool() {
  const [loanType, setLoanType] = useState("Personal Loan");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [term, setTerm] = useState(12);
  const [deposit, setDeposit] = useState(0);
  const [balloon, setBalloon] = useState(0);
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const monthlyIncome = parseFloat(income);
    const monthlyExpenses = parseFloat(expenses);
    const principal = parseFloat(loanAmount);
    const months = parseInt(term);
    const disposable = monthlyIncome - monthlyExpenses;

    let effectivePrincipal = principal;
    if (loanType === "Vehicle Finance") {
      const depositAmount = principal * (deposit / 100);
      const balloonAmount = principal * (balloon / 100);
      effectivePrincipal = principal - depositAmount - balloonAmount;
    } else if (loanType === "Home Loan") {
      const depositAmount = principal * (deposit / 100);
      effectivePrincipal = principal - depositAmount;
    }

    let interestRate = 0.18;
    if (loanType === "Home Loan") interestRate = 0.10;
    else if (loanType === "Vehicle Finance") interestRate = 0.14;
    else if (monthlyIncome >= 30000) interestRate = 0.12;
    else if (monthlyIncome >= 20000) interestRate = 0.15;
    else if (monthlyIncome < 10000) interestRate = 0.22;

    const r = interestRate / 12;
    const monthlyRepayment = (effectivePrincipal * r) / (1 - Math.pow(1 + r, -months));
    const dti = (monthlyRepayment / disposable) * 100;
    const totalRepayment = monthlyRepayment * months;
    const loanCost = totalRepayment - effectivePrincipal;

    let creditScore = 600;
    if (dti < 20 && monthlyIncome >= 20000) creditScore = 720;
    else if (dti < 35 && monthlyIncome >= 15000) creditScore = 680;
    else if (dti < 45) creditScore = 640;
    else creditScore = 580;

    let approvalChance = "Moderate";
    if (creditScore >= 700) approvalChance = "High";
    else if (creditScore < 620) approvalChance = "Low";

    let recommendation = "Review Manually";
    if (dti <= 30 && creditScore >= 660) recommendation = "✅ Approved";
    else if (dti <= 45 && creditScore >= 620) recommendation = "⚠️ Borderline";
    else recommendation = "❌ Declined";

    let suggestions = [];
    if (dti > 45) suggestions.push("Reduce loan amount or extend repayment term.");
    if (disposable < monthlyRepayment) suggestions.push("Increase income or reduce expenses.");
    if (creditScore < 620) suggestions.push("Improve credit profile.");
    if (creditScore >= 700 && dti < 20) suggestions.push("You may qualify for better interest rates or terms.");
    if (loanType === "Vehicle Finance" && balloon > 0) suggestions.push("Ensure you're aware of the balloon payment due at term end.");
    if (suggestions.length === 0) suggestions.push("You're in a good position. Consider locking in your rate.");

    setResult({
      interestRate: (interestRate * 100).toFixed(1),
      repayment: monthlyRepayment.toFixed(2),
      dti: dti.toFixed(1),
      creditScore,
      approvalChance,
      recommendation,
      suggestions,
      totalRepayment: totalRepayment.toFixed(2),
      loanCost: loanCost.toFixed(2),
    });
  };

  const handleClear = () => {
    setLoanType("Personal Loan");
    setIncome("");
    setExpenses("");
    setLoanAmount("");
    setTerm(12);
    setDeposit(0);
    setBalloon(0);
    setResult(null);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Scend Loan Qualification Summary", 14, 20);
    doc.setFontSize(12);
    doc.autoTable({
      startY: 30,
      body: [
        ["Loan Type", loanType],
        ["Monthly Income", `R${income}`],
        ["Monthly Expenses", `R${expenses}`],
        ["Loan Amount", `R${loanAmount}`],
        ["Term", `${term} months`],
        ["Deposit", `${deposit}%`],
        ["Balloon", `${balloon}%`],
        ["Interest Rate", `${result.interestRate}%`],
        ["Monthly Repayment", `R${result.repayment}`],
        ["Total Repayment", `R${result.totalRepayment}`],
        ["Loan Cost", `R${result.loanCost}`],
        ["DTI", `${result.dti}%`],
        ["Credit Score", `${result.creditScore}`],
        ["Approval Likelihood", result.approvalChance],
        ["Decision", result.recommendation],
      ],
      theme: "striped",
    });
    doc.save("loan_summary.pdf");
  };

  const handleSubmit = () => {
    if (!result) return;
    console.log("Submitting to backend (mock):", {
      loanType,
      income,
      expenses,
      loanAmount,
      term,
      deposit,
      balloon,
      ...result,
    });
    alert("Submission complete (placeholder)");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-xl space-y-6">
      <h2 className="text-2xl font-bold text-pink-600 text-center">Loan Qualification Tool</h2>

      <select
        value={loanType}
        onChange={(e) => setLoanType(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option>Personal Loan</option>
        <option>Vehicle Finance</option>
        <option>Home Loan</option>
        <option>Credit Card</option>
      </select>

      <input type="number" placeholder="Monthly Income" value={income} onChange={(e) => setIncome(e.target.value)} className="w-full p-2 border rounded" />
      <input type="number" placeholder="Monthly Expenses" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="w-full p-2 border rounded" />
      <input type="number" placeholder="Loan Amount" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="w-full p-2 border rounded" />
      <input type="number" placeholder="Term (months)" value={term} onChange={(e) => setTerm(e.target.value)} className="w-full p-2 border rounded" />

      {(loanType === "Vehicle Finance" || loanType === "Home Loan") && (
        <input type="number" placeholder="Deposit %" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-full p-2 border rounded" />
      )}
      {loanType === "Vehicle Finance" && (
        <input type="number" placeholder="Balloon Payment %" value={balloon} onChange={(e) => setBalloon(e.target.value)} className="w-full p-2 border rounded" />
      )}

      <div className="flex flex-wrap gap-4">
        <button onClick={handleCalculate} className="bg-pink-600 text-white flex-1 py-2 rounded hover:bg-pink-700">Calculate</button>
        <button onClick={handleClear} className="bg-gray-400 text-white flex-1 py-2 rounded hover:bg-gray-500">Clear</button>
        <button onClick={handleDownloadPDF} disabled={!result} className="bg-blue-600 text-white flex-1 py-2 rounded hover:bg-blue-700 disabled:opacity-50">Export PDF</button>
        <button onClick={handleSubmit} disabled={!result} className="bg-green-600 text-white flex-1 py-2 rounded hover:bg-green-700 disabled:opacity-50">Submit</button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <p><strong>Interest Rate:</strong> {result.interestRate}%</p>
          <p><strong>Monthly Repayment:</strong> R{result.repayment}</p>
          <p><strong>Total Repayment:</strong> R{result.totalRepayment}</p>
          <p><strong>Loan Cost:</strong> R{result.loanCost}</p>
          <p><strong>DTI:</strong> {result.dti}%</p>
          <p><strong>Estimated Credit Score:</strong> {result.creditScore}</p>
          <p><strong>Approval Likelihood:</strong> {result.approvalChance}</p>
          <p><strong>Decision:</strong> {result.recommendation}</p>

          <div>
            <p className="font-semibold">Suggestions:</p>
            <ul className="list-disc list-inside text-sm">
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
