import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LoanTool() {
  const [loanType, setLoanType] = useState("Home Loan");
  const [loanAmount, setLoanAmount] = useState(0);
  const [term, setTerm] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [balloon, setBalloon] = useState(0);
  const [result, setResult] = useState(null);

  const getInterestRate = () => {
    if (loanType === "Home Loan") return 0.105;
    if (loanType === "Vehicle Finance") return 0.1375;
    if (loanType === "Personal Loan") return 0.22;
    if (loanType === "Credit Card") return 0.24;
    return 0.2;
  };

  const calculate = () => {
    const interestRate = getInterestRate();
    const disposable = income - expenses;
    const baseAmount = loanAmount - deposit;
    const balloonAmount = loanType === "Vehicle Finance" ? baseAmount * (balloon / 100) : 0;
    const principal = baseAmount - balloonAmount;
    const monthlyRate = interestRate / 12;

    const monthlyRepayment =
      principal *
      (monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1);

    const totalRepayment = monthlyRepayment * term + balloonAmount;
    const totalCost = totalRepayment - baseAmount;
    const dti = (monthlyRepayment / income) * 100;

    let dtiRisk = "Low";
    if (dti >= 36 && dti < 50) dtiRisk = "Moderate";
    else if (dti >= 50) dtiRisk = "High";

    const ncaCompliant =
      interestRate <= 0.2775 && dti < 55 && monthlyRepayment <= disposable;

    const approved = dti < 50 && monthlyRepayment <= disposable;

    const suggestions = [];
    if (!approved) {
      if (dti >= 50) suggestions.push("Lower the loan amount or extend the term");
      if (monthlyRepayment > disposable)
        suggestions.push("Reduce monthly expenses to increase disposable income");
      if (interestRate > 0.2775) suggestions.push("Interest exceeds NCA limit");
    } else {
      suggestions.push("Loan appears to be within affordable and compliant range");
    }

    const estimatedScore = 800 - dti;

    setResult({
      monthlyRepayment,
      totalRepayment,
      totalCost,
      dti,
      dtiRisk,
      disposable,
      approved,
      suggestions,
      balloonAmount,
      interestRate,
      baseAmount,
      ncaCompliant,
      estimatedScore,
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Loan Qualification Results", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Item", "Value"]],
      body: [
        ["Loan Type", loanType],
        ["Loan Amount", `R ${loanAmount}`],
        ["Term", `${term} months`],
        ["Gross Income", `R ${income}`],
        ["Expenses", `R ${expenses}`],
        ["Deposit", `R ${deposit}`],
        ["Balloon %", `${balloon}%`],
        ["Balloon Amount", `R ${result?.balloonAmount.toFixed(2)}`],
        ["Interest Rate", `${(result?.interestRate * 100).toFixed(2)}%`],
        ["Base Amount", `R ${result?.baseAmount.toFixed(2)}`],
        ["Monthly Repayment", `R ${result?.monthlyRepayment.toFixed(2)}`],
        ["Disposable Income", `R ${result?.disposable.toFixed(2)}`],
        ["DTI", `${result?.dti.toFixed(2)}%`],
        ["Risk", result?.dtiRisk],
        ["Compliance", result?.ncaCompliant ? "Yes" : "No"],
        ["Approval", result?.approved ? "Approved" : "Declined"],
        ["Estimated Score", result?.estimatedScore.toFixed(0)],
        ["Total Cost", `R ${result?.totalCost.toFixed(2)}`],
        ["Total Repayment", `R ${result?.totalRepayment.toFixed(2)}`],
      ],
    });
    doc.save("Loan_Results.pdf");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Loan Qualification Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <select
          value={loanType}
          onChange={(e) => setLoanType(e.target.value)}
          className="border p-2 rounded"
        >
          <option>Home Loan</option>
          <option>Vehicle Finance</option>
          <option>Personal Loan</option>
          <option>Credit Card</option>
        </select>
        <input
          placeholder="Loan Amount"
          type="number"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Term (months)"
          type="number"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Gross Income"
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Monthly Expenses"
          type="number"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
          className="border p-2 rounded"
        />
        {loanType === "Home Loan" || loanType === "Vehicle Finance" ? (
          <input
            placeholder="Deposit Amount"
            type="number"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="border p-2 rounded"
          />
        ) : null}
        {loanType === "Vehicle Finance" ? (
          <input
            placeholder="Balloon %"
            type="number"
            value={balloon}
            onChange={(e) => setBalloon(e.target.value)}
            className="border p-2 rounded"
          />
        ) : null}
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={calculate}
          className="bg-pink-600 text-white px-4 py-2 rounded"
        >
          Calculate
        </button>
        <button
          onClick={() => {
            setLoanAmount(0);
            setTerm(0);
            setIncome(0);
            setExpenses(0);
            setDeposit(0);
            setBalloon(0);
            setResult(null);
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
        <button
          onClick={exportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {result && (
        <div className="border-t pt-4 space-y-2 text-sm">
          <p><strong>Estimated Credit Score:</strong> {result.estimatedScore.toFixed(0)}</p>
          <p><strong>Disposable Income:</strong> R {result.disposable.toFixed(2)}</p>
          <p><strong>Balloon Payment Due:</strong> R {result.balloonAmount.toFixed(2)}</p>
          <p><strong>Base Amount:</strong> R {result.baseAmount.toFixed(2)}</p>
          <p><strong>Interest Rate:</strong> {(result.interestRate * 100).toFixed(2)}%</p>
          <p><strong>Monthly Repayment:</strong> R {result.monthlyRepayment.toFixed(2)}</p>
          <p><strong>Total Repayment:</strong> R {result.totalRepayment.toFixed(2)}</p>
          <p><strong>Total Loan Cost:</strong> R {result.totalCost.toFixed(2)}</p>
          <p><strong>Debt-to-Income (DTI):</strong> {result.dti.toFixed(2)}% — <span className={`font-bold ${result.dtiRisk === "High" ? "text-red-600" : result.dtiRisk === "Moderate" ? "text-yellow-600" : "text-green-600"}`}>{result.dtiRisk} Risk</span></p>
          <p><strong>Compliant with NCA:</strong> {result.ncaCompliant ? "✅ Yes" : "❌ No"}</p>
          <p><strong>Loan Decision:</strong> {result.approved ? "✅ Approved" : "❌ Declined"}</p>
          <div>
            <strong>Suggestions:</strong>
            <ul className="list-disc pl-5">
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
