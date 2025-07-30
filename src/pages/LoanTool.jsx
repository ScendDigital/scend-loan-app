// src/pages/LoanTool.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/scend-logo.png";

const LoanTool = () => {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [term, setTerm] = useState(12);
  const [balloon, setBalloon] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [results, setResults] = useState(null);

  const calculateLoan = () => {
    const loan = Number(loanAmount) - Number(deposit);
    const interestRate = loan > 200000 ? 0.12 : loan > 100000 ? 0.14 : 0.18;
    const monthlyRate = interestRate / 12;
    const balloonAmount = (loan * balloon) / 100;
    const monthlyRepayment =
      (loan - balloonAmount) *
      (monthlyRate / (1 - Math.pow(1 + monthlyRate, -term)));
    const totalRepayment = monthlyRepayment * term + balloonAmount;
    const loanCost = totalRepayment - loan;

    const disposable = Number(income) - Number(expenses);
    const dti = (monthlyRepayment / Number(income)) * 100;
    let dtiRisk = "Low";
    if (dti > 45) dtiRisk = "High";
    else if (dti > 30) dtiRisk = "Moderate";

    const creditScore = disposable > 20000 ? 720 : disposable > 10000 ? 680 : 640;
    const approval =
      monthlyRepayment > disposable || dti > 55 ? "Declined" : dti > 45 ? "Borderline" : "Approved";
    const likelihood =
      creditScore >= 720 ? "High" : creditScore >= 680 ? "Moderate" : "Low";

    let suggestion = "";
    if (approval === "Declined") {
      suggestion = "Monthly repayment exceeds disposable income.";
    } else if (approval === "Borderline") {
      suggestion = "Consider reducing your loan amount or increasing your income for better chances.";
    } else {
      suggestion = "You may qualify for better interest rates or terms.";
    }

    setResults({
      interestRate: (interestRate * 100).toFixed(2) + "%",
      monthlyRepayment: monthlyRepayment.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      loanCost: loanCost.toFixed(2),
      disposableIncome: disposable.toFixed(2),
      dti: dti.toFixed(1),
      dtiRisk,
      balloonAmount: balloonAmount.toFixed(2),
      estimatedCreditScore: creditScore,
      approvalLikelihood: likelihood,
      decision: approval,
      suggestion,
    });
  };

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text("Scend Loan Qualification Report", 20, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Monthly Income", income],
        ["Monthly Expenses", expenses],
        ["Loan Amount", loanAmount],
        ["Deposit", deposit],
        ["Balloon %", balloon],
        ["Term (months)", term],
        ["Interest Rate", results.interestRate],
        ["Monthly Repayment", "R" + results.monthlyRepayment],
        ["Total Repayment", "R" + results.totalRepayment],
        ["Loan Cost", "R" + results.loanCost],
        ["Disposable Income", "R" + results.disposableIncome],
        ["DTI", results.dti + "% (" + results.dtiRisk + ")"],
        ["Balloon Due at Term End", "R" + results.balloonAmount],
        ["Estimated Credit Score", results.estimatedCreditScore],
        ["Approval Likelihood", results.approvalLikelihood],
        ["Decision", results.decision],
        ["Suggestions", results.suggestion],
      ],
    });
    doc.save("loan-qualification.pdf");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-4 mb-6">
        <img src={logo} alt="Scend Logo" className="h-10" />
        <h2 className="text-2xl font-bold text-pink-600">Welcome to Scend</h2>
      </div>

      <h1 className="text-xl font-semibold mb-4">Loan Qualification Tool</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          placeholder="Monthly Income"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Monthly Expenses"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Loan Amount"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Deposit (if any)"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Balloon % (e.g. 10)"
          value={balloon}
          onChange={(e) => setBalloon(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Term (months)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      <div className="flex space-x-4 mb-4">
        <button onClick={calculateLoan} className="bg-pink-600 text-white px-4 py-2 rounded">
          Calculate
        </button>
        <button onClick={() => window.location.reload()} className="bg-gray-400 text-white px-4 py-2 rounded">
          Clear
        </button>
        {results && (
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded">
            Export PDF
          </button>
        )}
      </div>

      {results && (
        <div className="bg-white shadow p-4 rounded space-y-2">
          <p><strong>Interest Rate:</strong> {results.interestRate}</p>
          <p><strong>Monthly Repayment:</strong> R{results.monthlyRepayment}</p>
          <p><strong>Total Repayment:</strong> R{results.totalRepayment}</p>
          <p><strong>Loan Cost:</strong> R{results.loanCost}</p>
          <p><strong>Disposable Income:</strong> R{results.disposableIncome}</p>
          <p><strong>DTI:</strong> {results.dti}% ({results.dtiRisk} Risk)</p>
          <p><strong>Balloon Due at Term End:</strong> R{results.balloonAmount}</p>
          <p><strong>Estimated Credit Score:</strong> {results.estimatedCreditScore}</p>
          <p><strong>Approval Likelihood:</strong> {results.approvalLikelihood}</p>
          <p>
            <strong>Decision:</strong>{" "}
            <span className={
              results.decision === "Approved"
                ? "text-green-600 font-bold"
                : results.decision === "Borderline"
                ? "text-yellow-600 font-bold"
                : "text-red-600 font-bold"
            }>
              {results.decision === "Approved"
                ? "✅ Approved"
                : results.decision === "Borderline"
                ? "⚠️ Borderline"
                : "❌ Declined"}
            </span>
          </p>
          <p><strong>Suggestions:</strong> {results.suggestion}</p>
        </div>
      )}
    </div>
  );
};

export default LoanTool;
