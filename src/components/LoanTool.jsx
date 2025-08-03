import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LoanTool() {
  const [loanType, setLoanType] = useState("Personal Loan");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [balloon, setBalloon] = useState("");
  const [deposit, setDeposit] = useState("");
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const loanAmount = parseFloat(amount) || 0;
    const termMonths = parseInt(term) || 0;
    const monthlyIncome = parseFloat(income) || 0;
    const monthlyExpenses = parseFloat(expenses) || 0;
    const balloonPercent = parseFloat(balloon) || 0;
    const depositAmount = parseFloat(deposit) || 0;

    const disposableIncome = monthlyIncome - monthlyExpenses;

    const estimatedScore =
      creditScore.trim() === ""
        ? estimateCreditScore(monthlyIncome, monthlyExpenses)
        : parseInt(creditScore);

    const interestRate = getInterestRate(loanType, estimatedScore);
    const cappedRate = Math.min(interestRate, 27.75);
    const monthlyRate = cappedRate / 100 / 12;

    let balloonValue = 0;
    if (loanType === "Vehicle Finance") {
      balloonValue = loanAmount * (balloonPercent / 100);
    }

    const principal = loanAmount - depositAmount - balloonValue;

    const monthlyRepayment =
      (principal * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -termMonths));

    const totalRepayment = monthlyRepayment * termMonths + balloonValue;
    const loanCost = totalRepayment - loanAmount;

    const dti = (monthlyRepayment / monthlyIncome) * 100;
    const affordability = monthlyRepayment <= disposableIncome;
    const compliant = dti <= 55 && affordability && cappedRate <= 27.75;

    const approval =
      dti <= 40 && affordability
        ? "Approved"
        : dti <= 55 && affordability
        ? "Borderline"
        : "Declined";

    const dtiRisk = dti <= 30 ? "Low" : dti <= 45 ? "Moderate" : "High";

    setResult({
      loanAmount,
      termMonths,
      interestRate: cappedRate,
      depositAmount,
      balloonValue,
      monthlyRepayment,
      totalRepayment,
      loanCost,
      disposableIncome,
      dti,
      dtiRisk,
      estimatedScore,
      approval,
      compliant: compliant ? "Yes" : "No",
    });
  };

  const estimateCreditScore = (income, expenses) => {
    const dti = (expenses / income) * 100;
    if (dti < 30) return 750;
    if (dti < 45) return 680;
    return 600;
  };

  const getInterestRate = (type, score) => {
    switch (type) {
      case "Home Loan":
        return score >= 750 ? 9.5 : score >= 650 ? 11.5 : 14.5;
      case "Vehicle Finance":
        return score >= 750 ? 10.25 : score >= 650 ? 12.75 : 15.75;
      case "Credit Card":
        return score >= 750 ? 14 : score >= 650 ? 18 : 24;
      default:
        return score >= 750 ? 12.5 : score >= 650 ? 18 : 25;
    }
  };

  const handleClear = () => {
    setLoanType("Personal Loan");
    setAmount("");
    setTerm("");
    setIncome("");
    setExpenses("");
    setCreditScore("");
    setBalloon("");
    setDeposit("");
    setResult(null);
  };

  const handleExport = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.text("Scend Loan Summary", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Loan Type", loanType],
        ["Loan Amount", `R ${result.loanAmount.toFixed(2)}`],
        ["Deposit", `R ${result.depositAmount.toFixed(2)}`],
        ["Balloon Amount", `R ${result.balloonValue.toFixed(2)}`],
        ["Term", `${result.termMonths} months`],
        ["Interest Rate", `${result.interestRate.toFixed(2)} %`],
        ["Monthly Repayment", `R ${result.monthlyRepayment.toFixed(2)}`],
        ["Loan Cost", `R ${result.loanCost.toFixed(2)}`],
        ["Total Repayment", `R ${result.totalRepayment.toFixed(2)}`],
        ["Disposable Income", `R ${result.disposableIncome.toFixed(2)}`],
        ["DTI", `${result.dti.toFixed(2)}%`],
        ["DTI Risk", result.dtiRisk],
        ["Estimated Credit Score", result.estimatedScore],
        ["Compliant", result.compliant],
        ["Decision", result.approval],
      ],
    });
    doc.save("scend_loan_summary.pdf");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-pink-600">Scend Loan Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="border p-2 rounded">
          <option>Personal Loan</option>
          <option>Home Loan</option>
          <option>Vehicle Finance</option>
          <option>Credit Card</option>
        </select>
        <input type="number" placeholder="Loan Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="border p-2 rounded" />
        <input type="number" placeholder="Term (Months)" value={term} onChange={(e) => setTerm(e.target.value)} className="border p-2 rounded" />
        <input type="number" placeholder="Monthly Income" value={income} onChange={(e) => setIncome(e.target.value)} className="border p-2 rounded" />
        <input type="number" placeholder="Monthly Expenses" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="border p-2 rounded" />
        <input type="number" placeholder="Credit Score (Optional)" value={creditScore} onChange={(e) => setCreditScore(e.target.value)} className="border p-2 rounded" />
        {loanType === "Vehicle Finance" && (
          <input type="number" placeholder="Balloon (%)" value={balloon} onChange={(e) => setBalloon(e.target.value)} className="border p-2 rounded" />
        )}
        {(loanType === "Vehicle Finance" || loanType === "Home Loan") && (
          <input type="number" placeholder="Deposit Amount" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="border p-2 rounded" />
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={handleCalculate} className="bg-pink-600 text-white px-4 py-2 rounded">Calculate</button>
        <button onClick={handleClear} className="bg-gray-600 text-white px-4 py-2 rounded">Clear</button>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded">Export PDF</button>
      </div>

      {result && (
        <div className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">Results</h2>
          <div>Monthly Repayment: <strong>R {result.monthlyRepayment.toFixed(2)}</strong></div>
          <div>Balloon Amount (due at end): <strong>R {result.balloonValue.toFixed(2)}</strong></div>
          <div>Total Repayment: <strong>R {result.totalRepayment.toFixed(2)}</strong></div>
          <div>Loan Cost (Interest): <strong>R {result.loanCost.toFixed(2)}</strong></div>
          <div>Estimated Credit Score: <strong>{result.estimatedScore}</strong></div>
          <div>DTI: <strong>{result.dti.toFixed(2)}%</strong> — Risk: <strong>{result.dtiRisk}</strong></div>
          <div>Disposable Income: <strong>R {result.disposableIncome.toFixed(2)}</strong></div>
          <div>Compliance: <span className={`font-semibold ${result.compliant === "Yes" ? "text-green-600" : "text-red-600"}`}>{result.compliant}</span></div>
          <div>Decision: <span className={`font-semibold ${result.approval === "Approved" ? "text-green-600" : result.approval === "Borderline" ? "text-yellow-600" : "text-red-600"}`}>{result.approval}</span></div>
        </div>
      )}
    </div>
  );
}
