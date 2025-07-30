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
    let balloonAmount = 0;
    if (loanType === "Vehicle Finance") {
      const depositAmount = principal * (deposit / 100);
      balloonAmount = principal * (balloon / 100);
      effectivePrincipal = principal - depositAmount - balloonAmount;
    } else if (loanType === "Home Loan") {
      const depositAmount = principal * (deposit / 100);
      effectivePrincipal = principal - depositAmount;
    }

    // Base interest rate logic
    let interestRate = 0.18;
    if (loanType === "Home Loan") interestRate = 0.10;
    else if (loanType === "Vehicle Finance") interestRate = 0.14;
    else if (monthlyIncome >= 30000) interestRate = 0.12;
    else if (monthlyIncome >= 20000) interestRate = 0.15;
    else if (monthlyIncome < 10000) interestRate = 0.22;

    // Enforce South African NCA interest rate cap
    interestRate = Math.min(interestRate, 0.2775);

    const r = interestRate / 12;
    const monthlyRepayment = (effectivePrincipal * r) / (1 - Math.pow(1 + r, -months));
    const totalRepayment = monthlyRepayment * months;
    const loanCost = totalRepayment - effectivePrincipal;
    const dti = (monthlyRepayment / disposable) * 100;

    // DTI risk level
    let dtiRisk = "Low";
    if (dti > 40 && dti <= 55) dtiRisk = "Moderate";
    else if (dti > 55) dtiRisk = "High";

    // Credit score estimate
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

    // Suggestions logic
    let suggestions = [];
    if (dti > 45) suggestions.push("Reduce loan amount or extend repayment term.");
    if (disposable < monthlyRepayment) suggestions.push("Increase income or reduce expenses.");
    if (creditScore < 620) suggestions.push("Improve your credit profile before applying.");
    if (creditScore >= 700 && dti < 20) suggestions.push("You may qualify for better interest rates or terms.");
    if (loanType === "Vehicle Finance" && balloon > 0) suggestions.push("Be prepared for the balloon payment at end of term.");
    if (suggestions.length === 0) suggestions.push("You're in a good position. Consider locking in your rate.");

    setResult({
      interestRate: (interestRate * 100).toFixed(2),
      repayment: monthlyRepayment.toFixed(2),
      dti: dti.toFixed(1),
      dtiRisk,
      disposable: disposable.toFixed(2),
      balloonAmount: balloonAmount.toFixed(2),
      creditScore,
      approvalChance,
      recommendation,
      suggestions,
      totalRepayment: totalRepayment.toFixed(2),
      loanCost: loanCost.toFixed(2),
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-xl space-y-6">
      <h2 className="text-2xl font-bold text-pink-600 text-center">Loan Qualification Tool</h2>

      {/* Inputs */}
      <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="w-full p-2 border rounded">
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

      <div className="flex gap-4">
        <button onClick={handleCalculate} className="bg-pink-600 text-white flex-1 py-2 rounded hover:bg-pink-700">Calculate</button>
        <button onClick={() => window.location.reload()} className="bg-gray-400 text-white flex-1 py-2 rounded hover:bg-gray-500">Clear</button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <p><strong>Interest Rate:</strong> {result.interestRate}%</p>
          <p><strong>Monthly Repayment:</strong> R{result.repayment}</p>
          <p><strong>Total Repayment:</strong> R{result.totalRepayment}</p>
          <p><strong>Loan Cost:</strong> R{result.loanCost}</p>
          <p><strong>Disposable Income:</strong> R{result.disposable}</p>
          <p><strong>DTI:</strong> {result.dti}% ({result.dtiRisk} Risk)</p>
          {loanType === "Vehicle Finance" && <p><strong>Balloon Due at Term End:</strong> R{result.balloonAmount}</p>}
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
