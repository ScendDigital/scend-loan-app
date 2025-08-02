import React, { useState } from "react";

const LoanTool = () => {
  const [loanType, setLoanType] = useState("Home Loan");
  const [loanAmount, setLoanAmount] = useState(150000);
  const [termMonths, setTermMonths] = useState(48);
  const [income, setIncome] = useState(36000);
  const [expenses, setExpenses] = useState(15980);
  const [balloonPercentage, setBalloonPercentage] = useState(0);
  const [deposit, setDeposit] = useState(0);

  // Derived values
  const disposableIncome = income - expenses;
  const dti = (expenses / income) * 100;

  // Estimate credit score (mock logic)
  const creditScore = (() => {
    if (dti < 25 && income > 30000) return 760;
    if (dti < 35 && income > 20000) return 700;
    if (dti < 45 && income > 10000) return 640;
    return 580;
  })();

  // Interest Rate Logic
  const getInterestRate = () => {
    let rate = 10.5;

    if (loanType === "Home Loan") {
      if (creditScore >= 750 && dti < 30) rate = 9.5;
      else if (creditScore >= 700 && dti < 35) rate = 10.25;
      else rate = 12.75;
    } else if (loanType === "Vehicle Finance") {
      if (creditScore >= 720 && dti < 35) rate = 10.25;
      else rate = 12.5;
    } else if (loanType === "Personal Loan") {
      if (creditScore >= 700 && dti < 40) rate = 13.5;
      else rate = 18.0;
    } else if (loanType === "Credit Card") {
      rate = 20.0;
    }

    return Math.min(rate, 27.75);
  };

  const interestRate = getInterestRate();

  // Base loan after deposit and balloon
  const balloonAmount = loanType === "Vehicle Finance"
    ? (loanAmount * (balloonPercentage / 100))
    : 0;

  const baseAmount = loanAmount - deposit - balloonAmount;
  const monthlyRate = interestRate / 100 / 12;

  const monthlyRepayment = monthlyRate === 0
    ? baseAmount / termMonths
    : (baseAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

  const totalRepayment = monthlyRepayment * termMonths + balloonAmount;
  const totalCost = totalRepayment - (loanAmount - deposit);

  // DTI based on monthly repayment
  const repaymentDTI = (monthlyRepayment / income) * 100;

  // Risk level
  const dtiRisk = repaymentDTI <= 35
    ? "Low"
    : repaymentDTI <= 50
    ? "Moderate"
    : "High";

  // NCA Compliance
  const isCompliant =
    repaymentDTI <= 55 && monthlyRepayment <= disposableIncome;

  // Approval Decision
  const approval =
    isCompliant && disposableIncome > 0
      ? repaymentDTI < 60
        ? "Approved"
        : "Borderline"
      : "Declined";

  const approvalLikelihood =
    repaymentDTI <= 35 && creditScore >= 700
      ? "High"
      : repaymentDTI <= 50 && creditScore >= 640
      ? "Moderate"
      : "Low";

  const decisionBadge = approval === "Approved"
    ? "✅"
    : approval === "Borderline"
    ? "⚠️"
    : "❌";

  return (
    <div className="p-4 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Loan Qualification Tool</h1>

      <div className="space-y-2">
        <label className="block">
          Loan Type:
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="w-full border px-2 py-1"
          >
            <option>Home Loan</option>
            <option>Vehicle Finance</option>
            <option>Personal Loan</option>
            <option>Credit Card</option>
          </select>
        </label>

        <label className="block">
          Gross Income:
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(+e.target.value)}
            className="w-full border px-2 py-1"
          />
        </label>

        <label className="block">
          Monthly Expenses:
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(+e.target.value)}
            className="w-full border px-2 py-1"
          />
        </label>

        <label className="block">
          Loan Amount:
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(+e.target.value)}
            className="w-full border px-2 py-1"
          />
        </label>

        <label className="block">
          Term (months):
          <input
            type="number"
            value={termMonths}
            onChange={(e) => setTermMonths(+e.target.value)}
            className="w-full border px-2 py-1"
          />
        </label>

        {loanType === "Vehicle Finance" && (
          <label className="block">
            Balloon Payment (%):
            <input
              type="number"
              value={balloonPercentage}
              onChange={(e) => setBalloonPercentage(+e.target.value)}
              className="w-full border px-2 py-1"
            />
          </label>
        )}

        {(loanType === "Vehicle Finance" || loanType === "Home Loan") && (
          <label className="block">
            Deposit Amount:
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(+e.target.value)}
              className="w-full border px-2 py-1"
            />
          </label>
        )}
      </div>

      <hr className="my-4" />

      <div className="space-y-1">
        <p>Interest Rate: <strong>{interestRate.toFixed(2)}%</strong></p>
        <p>Monthly Repayment: <strong>R {monthlyRepayment.toFixed(2)}</strong></p>
        <p>Total Repayment: <strong>R {totalRepayment.toFixed(2)}</strong></p>
        <p>Loan Cost: <strong>R {totalCost.toFixed(2)}</strong></p>
        <p>Disposable Income: <strong>R {disposableIncome.toFixed(2)}</strong></p>
        <p>DTI: <strong>{repaymentDTI.toFixed(2)}%</strong> ({dtiRisk} Risk)</p>
        <p>Estimated Credit Score: <strong>{creditScore}</strong></p>
        <p>Approval Likelihood: <strong>{approvalLikelihood}</strong></p>
        <p>
          Decision: <strong>{decisionBadge} {approval}</strong>
        </p>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <p className="font-semibold">Suggestions:</p>
        {approval === "Approved" ? (
          <p>Loan appears to be within affordable and compliant range.</p>
        ) : (
          <ul className="list-disc ml-5">
            {repaymentDTI > 50 && <li>Consider lowering your loan amount or increasing the term.</li>}
            {disposableIncome <= 0 && <li>Reduce monthly expenses or increase income.</li>}
            {creditScore < 650 && <li>Improve your credit score to reduce interest rate.</li>}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LoanTool;
