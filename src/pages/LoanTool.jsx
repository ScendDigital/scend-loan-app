// src/pages/LoanTool.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../assets/scend-logo.png";

const LoanTool = () => {
  const [loanType, setLoanType] = useState("Personal Loan");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [balloonPercent, setBalloonPercent] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [results, setResults] = useState(null);

  const handleCalculate = () => {
    const inc = parseFloat(income);
    const exp = parseFloat(expenses);
    const loanAmt = parseFloat(amount);
    const months = parseInt(term);
    const balloon = parseFloat(balloonPercent) || 0;
    const deposit = parseFloat(depositAmount) || 0;

    if (isNaN(inc) || isNaN(exp) || isNaN(loanAmt) || isNaN(months)) return;

    const disposable = inc - exp;
    const dtiRaw = (exp / inc) * 100;
    const dti = parseFloat(dtiRaw.toFixed(1));

    const balloonValue = loanType === "Vehicle Finance" ? (loanAmt * (balloon / 100)) : 0;
    const principal = loanAmt - deposit - balloonValue;

    const rate = getInterestRate(loanType, dti);
    const monthlyRate = rate / 12 / 100;
    const repayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    const totalRepayment = repayment * months;
    const loanCost = totalRepayment - principal;

    const repaymentRounded = parseFloat(repayment.toFixed(2));
    const totalRounded = parseFloat(totalRepayment.toFixed(2));
    const costRounded = parseFloat(loanCost.toFixed(2));

    const estimatedCreditScore = estimateCreditScore(dti, inc, disposable);
    const decision = repayment > disposable ? "Declined" : dti > 55 ? "Declined" : dti < 40 ? "Approved" : "Borderline";
    const dtiRisk = dti > 50 ? "High Risk" : dti > 40 ? "Moderate Risk" : "Low Risk";

    const suggestions = generateSuggestions(disposable, repayment, dti, decision);

    setResults({
      rate,
      repayment: repaymentRounded,
      totalRepayment: totalRounded,
      loanCost: costRounded,
      dti: parseFloat(((repayment / inc) * 100).toFixed(1)),
      dtiRisk,
      disposable,
      balloonDue: balloonValue,
      estimatedCreditScore,
      approval: decision,
      suggestions
    });
  };

  const getInterestRate = (type, dti) => {
    let base = type === "Home Loan" ? 11 : type === "Vehicle Finance" ? 13 : 14;
    if (dti > 50) base += 3;
    return Math.min(base, 27.75); // SA NCA max cap
  };

  const estimateCreditScore = (dti, income, disposable) => {
    if (dti < 35 && disposable > income * 0.4) return 720;
    if (dti < 45) return 680;
    return 640;
  };

  const generateSuggestions = (disposable, repayment, dti, decision) => {
    const suggestions = [];

    if (repayment > disposable) {
      suggestions.push("Monthly repayment exceeds disposable income.");
    }
    if (decision === "Declined") {
      suggestions.push("Consider reducing your loan amount or increasing your income.");
    }
    if (decision === "Approved" && dti < 35) {
      suggestions.push("You may qualify for better interest rates or terms.");
    }
    if (loanType === "Vehicle Finance" && results?.balloonDue > 0) {
      suggestions.push("Be prepared for the balloon payment at end of term.");
    }

    return suggestions;
  };

  const handleExportPDF = () => {
    if (!results) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Loan Qualification Report", 14, 22);
    doc.setFontSize(11);

    doc.autoTable({
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Loan Type", loanType],
        ["Monthly Income", `R${income}`],
        ["Monthly Expenses", `R${expenses}`],
        ["Loan Amount", `R${amount}`],
        ["Term (months)", term],
        ["Interest Rate", `${results.rate.toFixed(2)}%`],
        ["Monthly Repayment", `R${results.repayment}`],
        ["Total Repayment", `R${results.totalRepayment}`],
        ["Loan Cost", `R${results.loanCost}`],
        ["Disposable Income", `R${results.disposable}`],
        ["DTI", `${results.dti}% (${results.dtiRisk})`],
        ["Balloon Due at Term End", `R${results.balloonDue}`],
        ["Estimated Credit Score", results.estimatedCreditScore],
        ["Approval Decision", results.approval],
        ["Suggestions", results.suggestions.join("; ")]
      ]
    });

    doc.save("loan_qualification_report.pdf");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow rounded">
      <div className="flex items-center space-x-4 mb-6">
        <img src={logo} alt="Scend Logo" className="h-10" />
        <h2 className="text-xl font-bold text-pink-600">Loan Qualification Tool</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <select value={loanType} onChange={e => setLoanType(e.target.value)} className="p-2 border rounded">
          <option>Personal Loan</option>
          <option>Vehicle Finance</option>
          <option>Home Loan</option>
          <option>Credit Card</option>
        </select>
        <input type="number" placeholder="Monthly Income" value={income} onChange={e => setIncome(e.target.value)} className="p-2 border rounded" />
        <input type="number" placeholder="Monthly Expenses" value={expenses} onChange={e => setExpenses(e.target.value)} className="p-2 border rounded" />
        <input type="number" placeholder="Loan Amount" value={amount} onChange={e => setAmount(e.target.value)} className="p-2 border rounded" />
        <input type="number" placeholder="Term (months)" value={term} onChange={e => setTerm(e.target.value)} className="p-2 border rounded" />
        {loanType === "Vehicle Finance" && (
          <>
            <input type="number" placeholder="Balloon Payment (%)" value={balloonPercent} onChange={e => setBalloonPercent(e.target.value)} className="p-2 border rounded" />
            <input type="number" placeholder="Deposit Amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="p-2 border rounded" />
          </>
        )}
        {loanType === "Home Loan" && (
          <input type="number" placeholder="Deposit Amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="p-2 border rounded" />
        )}
      </div>

      <div className="space-x-2 mb-4">
        <button onClick={handleCalculate} className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">Calculate</button>
        <button onClick={() => { setIncome(""); setExpenses(""); setAmount(""); setTerm(""); setResults(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Clear</button>
        <button onClick={handleExportPDF} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Export PDF</button>
      </div>

      {results && (
        <div className="space-y-2">
          <p><strong>Interest Rate:</strong> {results.rate.toFixed(2)}%</p>
          <p><strong>Monthly Repayment:</strong> R{results.repayment}</p>
          <p><strong>Total Repayment:</strong> R{results.totalRepayment}</p>
          <p><strong>Loan Cost:</strong> R{results.loanCost}</p>
          <p><strong>Disposable Income:</strong> R{results.disposable}</p>
          <p><strong>DTI:</strong> {results.dti}% <span className="text-xs text-gray-600">({results.dtiRisk})</span></p>
          {results.balloonDue > 0 && <p><strong>Balloon Due at Term End:</strong> R{results.balloonDue}</p>}
          <p><strong>Estimated Credit Score:</strong> {results.estimatedCreditScore}</p>
          <p><strong>Approval Likelihood:</strong> {results.approval === "Approved" ? "High" : results.approval === "Borderline" ? "Moderate" : "Low"}</p>
          <p><strong>Decision:</strong> <span className={`font-bold ${results.approval === "Approved" ? "text-green-600" : results.approval === "Borderline" ? "text-yellow-600" : "text-red-600"}`}>
            {results.approval === "Approved" ? "✅ Approved" : results.approval === "Borderline" ? "⚠️ Borderline" : "❌ Declined"}
          </span></p>
          {results.suggestions.length > 0 && (
            <div>
              <strong>Suggestions:</strong>
              <ul className="list-disc ml-6">
                {results.suggestions.map((msg, idx) => <li key={idx}>{msg}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanTool;
