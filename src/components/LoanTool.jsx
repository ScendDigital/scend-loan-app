import React, { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function LoanTool() {
  const [loanType, setLoanType] = useState("Personal Loan");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [deposit, setDeposit] = useState("");
  const [balloonPercent, setBalloonPercent] = useState("");
  const [result, setResult] = useState(null);

  const calculateCreditScore = (dti, disposableIncome) => {
    if (dti < 20 && disposableIncome > 3000) return 680;
    if (dti < 30 && disposableIncome > 2000) return 640;
    if (dti < 40 && disposableIncome > 1000) return 600;
    return 550;
  };

  const getInterestRate = (score, type) => {
    if (type === "Home Loan") return 11.75;
    if (score >= 680) return 18;
    if (score >= 640) return 21;
    if (score >= 600) return 23.5;
    return 27.75;
  };

  const handleCalculate = () => {
    const loanAmount = parseFloat(amount) || 0;
    const termMonths = parseInt(term) || 0;
    const monthlyIncome = parseFloat(income) || 0;
    const monthlyExpenses = parseFloat(expenses) || 0;
    const depositAmount = parseFloat(deposit) || 0;
    const balloonPct = parseFloat(balloonPercent) || 0;

    let balloonAmount = 0;
    if (loanType === "Vehicle Finance") {
      balloonAmount = loanAmount * (balloonPct / 100);
    }

    const baseLoan = loanAmount - depositAmount - balloonAmount;
    const estimatedScore = calculateCreditScore(
      monthlyIncome > 0 ? (baseLoan / termMonths) / monthlyIncome * 100 : 0,
      monthlyIncome - monthlyExpenses
    );
    const interestRate = getInterestRate(estimatedScore, loanType);
    const totalRepayment = baseLoan * Math.pow(1 + interestRate / 100 / 12, termMonths);
    const monthlyRepayment = termMonths > 0 ? totalRepayment / termMonths : 0;
    const dti = monthlyIncome > 0 ? (monthlyRepayment / monthlyIncome) * 100 : 0;
    const disposableIncome = monthlyIncome - monthlyExpenses;

    let dtiRisk = "Low";
    if (disposableIncome <= 0) dtiRisk = "Very High";
    else if (dti > 55) dtiRisk = "Very High";
    else if (dti > 45) dtiRisk = "High";
    else if (dti > 30) dtiRisk = "Moderate";

    const compliant = interestRate <= 27.75 && disposableIncome > monthlyRepayment;
    let approval = "Declined";
    if (dti <= 40 && disposableIncome > monthlyRepayment) approval = "Approved";
    else if (dti <= 55 && disposableIncome > monthlyRepayment) approval = "Borderline";

    const generateRecommendation = (approval, dtiRisk, compliant) => {
      if (approval === "Approved" && compliant === "Yes") {
        return "Your loan is approved. Great work keeping your finances healthy!";
      }
      if (approval === "Borderline") {
        return "Your loan is borderline. Improve approval chances by reducing expenses or increasing deposit.";
      }
      return "Your loan was declined. Consider lowering your expenses, increasing your income, or reducing the loan amount.";
    };

    setResult({
      monthlyRepayment: monthlyRepayment.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      loanCost: (totalRepayment - baseLoan).toFixed(2),
      balloonAmount: balloonAmount.toFixed(2),
      interestRate: interestRate.toFixed(2),
      creditScore: estimatedScore,
      dti: dti.toFixed(2),
      dtiRisk,
      disposableIncome: disposableIncome.toFixed(2),
      compliant: compliant ? "Yes" : "No",
      approval,
      recommendation: generateRecommendation(approval, dtiRisk, compliant ? "Yes" : "No"),
    });
  };

  const handleClear = () => {
    setAmount("");
    setTerm("");
    setIncome("");
    setExpenses("");
    setDeposit("");
    setBalloonPercent("");
    setResult(null);
  };

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text("Scend Loan Qualification Report", 14, 16);
    doc.autoTable({
      startY: 20,
      head: [["Field", "Value"]],
      body: Object.entries(result || {}).map(([key, value]) => [key, value]),
    });
    doc.save("loan_report.pdf");
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-pink-600">Scend Loan Tool</h1>
      <select
        value={loanType}
        onChange={(e) => setLoanType(e.target.value)}
        className="border p-2 mb-2 w-full text-gray-800"
      >
        <option>Personal Loan</option>
        <option>Vehicle Finance</option>
        <option>Home Loan</option>
        <option>Credit Card</option>
      </select>
      <input type="number" placeholder="Loan Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="border p-2 mb-2 w-full" />
      <input type="number" placeholder="Term (months)" value={term} onChange={(e) => setTerm(e.target.value)} className="border p-2 mb-2 w-full" />
      <input type="number" placeholder="Monthly Income" value={income} onChange={(e) => setIncome(e.target.value)} className="border p-2 mb-2 w-full" />
      <input type="number" placeholder="Monthly Expenses" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="border p-2 mb-2 w-full" />
      {(loanType === "Home Loan" || loanType === "Vehicle Finance") && (
        <input type="number" placeholder="Deposit Amount" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="border p-2 mb-2 w-full" />
      )}
      {loanType === "Vehicle Finance" && (
        <input type="number" placeholder="Balloon %" value={balloonPercent} onChange={(e) => setBalloonPercent(e.target.value)} className="border p-2 mb-2 w-full" />
      )}
      <div className="space-x-2 mb-4">
        <button onClick={handleCalculate} className="bg-pink-600 text-white px-4 py-2 rounded">Calculate</button>
        <button onClick={handleClear} className="bg-gray-600 text-white px-4 py-2 rounded">Clear</button>
        <button onClick={handleExport} className="bg-pink-700 text-white px-4 py-2 rounded">Export PDF</button>
      </div>

      {result && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-pink-600">Results</h2>
          <p><strong>Interest Rate:</strong> {result.interestRate}%</p>
          <p><strong>Monthly Repayment:</strong> R {result.monthlyRepayment}</p>
          <p><strong>Balloon Amount (due at end):</strong> R {result.balloonAmount}</p>
          <p><strong>Total Repayment:</strong> R {result.totalRepayment}</p>
          <p><strong>Loan Cost (Interest):</strong> R {result.loanCost}</p>
          <p><strong>Estimated Credit Score:</strong> {result.creditScore}</p>
          <p><strong>DTI:</strong> {result.dti}% — Risk: {result.dtiRisk}</p>
          <p><strong>Disposable Income:</strong> R {result.disposableIncome}</p>
          <p><strong>Compliance:</strong> {result.compliant}</p>
          <p><strong>Decision:</strong> {result.approval}</p>
          <p><strong>Recommendation:</strong> {result.recommendation}</p>
        </div>
      )}
    </div>
  );
}
