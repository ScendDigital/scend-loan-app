import React, { useState } from "react";

export default function LoanTool() {
  const [loanType, setLoanType] = useState("Home Loan");
  const [loanAmount, setLoanAmount] = useState("");
  const [term, setTerm] = useState("");
  const [grossIncome, setGrossIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [deposit, setDeposit] = useState("");
  const [balloon, setBalloon] = useState("");
  const [result, setResult] = useState(null);

  const calculateRepayment = () => {
    const loan = parseFloat(loanAmount) || 0;
    const months = parseInt(term) || 0;
    const income = parseFloat(grossIncome) || 0;
    const monthlyExpenses = parseFloat(expenses) || 0;
    const depositAmt = parseFloat(deposit) || 0;
    const balloonPct = parseFloat(balloon) || 0;

    let rate = 0.22; // Default rate
    if (loanType === "Home Loan") rate = 0.13;
    else if (loanType === "Vehicle Finance") rate = 0.18;
    else if (loanType === "Credit Card") rate = 0.24;

    const principal = loan - depositAmt;
    const monthlyRate = rate / 12;
    const balloonAmount = loanType === "Vehicle Finance" ? (balloonPct / 100) * principal : 0;
    const financedAmount = principal - balloonAmount;

    const repayment =
      financedAmount *
      (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));

    const disposable = income - monthlyExpenses;
    const dti = (repayment / income) * 100;

    let decision = "Declined";
    if (dti <= 35 && repayment < disposable) decision = "Approved";
    else if (dti <= 50 && repayment <= disposable) decision = "Borderline";

    setResult({
      repayment: repayment.toFixed(2),
      disposable: disposable.toFixed(2),
      dti: dti.toFixed(2),
      decision,
      balloonDue: balloonAmount.toFixed(2),
    });
  };

  const reset = () => {
    setLoanAmount("");
    setTerm("");
    setGrossIncome("");
    setExpenses("");
    setDeposit("");
    setBalloon("");
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-xl border border-gray-200">
      <img src="/scend-logo.png" alt="Scend Logo" className="h-12 mb-4" />

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Loan Qualification Tool</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label>Loan Type</label>
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option>Home Loan</option>
            <option>Vehicle Finance</option>
            <option>Personal Loan</option>
            <option>Credit Card</option>
          </select>
        </div>
        <div>
          <label>Loan Amount</label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label>Term (months)</label>
          <input
            type="number"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label>Gross Income</label>
          <input
            type="number"
            value={grossIncome}
            onChange={(e) => setGrossIncome(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label>Monthly Expenses</label>
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {loanType === "Home Loan" || loanType === "Vehicle Finance" ? (
          <div>
            <label>Deposit Amount</label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        ) : null}

        {loanType === "Vehicle Finance" ? (
          <div>
            <label>Balloon Payment (%)</label>
            <input
              type="number"
              value={balloon}
              onChange={(e) => setBalloon(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        ) : null}
      </div>

      <div className="flex gap-4">
        <button
          onClick={calculateRepayment}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
        >
          Calculate
        </button>
        <button
          onClick={reset}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Clear
        </button>
      </div>

      {result && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">Results</h3>
          <p>Monthly Repayment: <strong>R {result.repayment}</strong></p>
          <p>Disposable Income: R {result.disposable}</p>
          <p>DTI: {result.dti}%</p>
          <p>Decision: <strong>{result.decision}</strong></p>
          {loanType === "Vehicle Finance" && (
            <p>Balloon Payment Due: R {result.balloonDue}</p>
          )}
        </div>
      )}
    </div>
  );
}
