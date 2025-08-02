import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LoanTool() {
HEAD
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

    // Estimate credit score if missing
    const estimatedScore = creditScore
      ? parseInt(creditScore)
      : estimateCreditScore(monthlyIncome, monthlyExpenses);

    const interestRate = getInterestRate(loanType, estimatedScore);
    const cappedRate = Math.min(interestRate, 27.75); // NCA cap
    const monthlyRate = cappedRate / 100 / 12;

    // Balloon logic (Vehicle Finance)
    let balloonValue = 0;
    if (loanType === "Vehicle Finance") {
      balloonValue = (loanAmount * (balloonPercent / 100)) || 0;
    }

    // Adjusted principal after deposit and balloon
    const principal = loanAmount - depositAmount - balloonValue;

    const monthlyRepayment =
      (principal * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -termMonths));

    const totalRepayment = monthlyRepayment * termMonths + balloonValue;
    const loanCost = totalRepayment - loanAmount;

    const dti = (monthlyRepayment / monthlyIncome) * 100;
    const affordability = monthlyRepayment <= disposableIncome;
    const compliant =
      dti <= 55 && affordability && cappedRate <= 27.75 ? "Yes" : "No";

    const approval =
      dti <= 40 && affordability
        ? "Approved"
        : dti <= 55 && affordability
        ? "Borderline"
        : "Declined";

    const dtiRisk =
      dti <= 30 ? "Low" : dti <= 45 ? "Moderate" : "High";

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
      compliant,
    });
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

  const estimateCreditScore = (income, expenses) => {
    const dti = (expenses / income) * 100;
    if (dti < 30) return 750;
    if (dti < 45) return 680;
    return 600;
  };

  const handleClear = () => {
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
    doc.text("Scend Loan Qualification Summary", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Loan Type", loanType],
        ["Loan Amount", `R ${result.loanAmount.toFixed(2)}`],
        ["Deposit", `R ${result.depositAmount.toFixed(2)}`],
        ["Balloon Amount", `R ${result.balloonValue.toFixed(2)}`],
        ["Loan Term", `${result.termMonths} months`],
        ["Interest Rate", `${result.interestRate.toFixed(2)} %`],
        ["Monthly Repayment", `R ${result.monthlyRepayment.toFixed(2)}`],
        ["Loan Cost (Interest)", `R ${result.loanCost.toFixed(2)}`],
        ["Total Repayment", `R ${result.totalRepayment.toFixed(2)}`],
        ["Estimated Credit Score", result.estimatedScore],
        ["Disposable Income", `R ${result.disposableIncome.toFixed(2)}`],
        ["DTI", `${result.dti.toFixed(2)} %`],
        ["DTI Risk", result.dtiRisk],
        ["NCA Compliant", result.compliant],
        ["Loan Decision", result.approval],
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
        {(loanType === "Vehicle Finance") && (
          <input type="number" placeholder="Balloon (%)" value={balloon} onChange={(e) => setBalloon(e.target.value)} className="border p-2 rounded" />
        )}
        {(loanType === "Vehicle Finance" || loanType === "Home Loan") && (
          <input type="number" placeholder="Deposit Amount" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="border p-2 rounded" />
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={handleCalculate} className="bg-pink-600 text-white px-4 py-2 rounded">Calculate</button>
        <button onClick={handleClear} className="bg-gray-500 text-white px-4 py-2 rounded">Clear</button>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded">Export PDF</button>
      </div>

      {result && (
        <div className="mt-4 space-y-2">
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
 main
        </div>
      )}
    </div>
  );
}
