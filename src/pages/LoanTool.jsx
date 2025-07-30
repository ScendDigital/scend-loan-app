import React, { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../assets/scend-logo.png";

const LoanTool = () => {
  const [form, setForm] = useState({
    income: "",
    expenses: "",
    amount: "",
    term: "",
    loanType: "Personal Loan",
    balloonPercent: "",
    deposit: ""
  });

  const [results, setResults] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalculate = () => {
    const income = parseFloat(form.income);
    const expenses = parseFloat(form.expenses);
    const loanAmount = parseFloat(form.amount);
    const term = parseInt(form.term);
    const balloonPercent = parseFloat(form.balloonPercent || 0);
    const deposit = parseFloat(form.deposit || 0);
    const disposable = income - expenses;

    let interestRate = 14;
    if (income > 20000 && expenses / income < 0.3) interestRate = 12;
    if (income > 50000 && expenses / income < 0.2) interestRate = 10;

    let balloonAmount = 0;
    let principal = loanAmount;

    if (form.loanType === "Vehicle Finance") {
      balloonAmount = (balloonPercent / 100) * loanAmount;
      principal = loanAmount - balloonAmount - deposit;
    } else if (form.loanType === "Home Loan") {
      principal = loanAmount - deposit;
    }

    const monthlyRate = interestRate / 100 / 12;
    const monthlyRepayment =
      (monthlyRate * principal) / (1 - Math.pow(1 + monthlyRate, -term));

    const totalRepayment = monthlyRepayment * term;
    const totalLoanCost = totalRepayment + balloonAmount - principal;
    const dti = (monthlyRepayment / income) * 100;

    const creditScore =
      700 +
      (disposable > 5000 ? 10 : 0) +
      (dti < 30 ? 10 : 0) +
      (expenses / income < 0.5 ? 10 : 0);

    let approval = "❌ Declined";
    let likelihood = "Low";
    let badge = "bg-red-500";
    if (dti <= 35 && monthlyRepayment <= disposable) {
      approval = "✅ Approved";
      likelihood = "High";
      badge = "bg-green-500";
    } else if (dti <= 50 && monthlyRepayment <= disposable) {
      approval = "⚠️ Borderline";
      likelihood = "Moderate";
      badge = "bg-yellow-500";
    }

    const dtiRisk =
      dti < 30 ? "Low Risk" : dti < 50 ? "Moderate Risk" : "High Risk";

    const suggestions =
      monthlyRepayment > disposable
        ? "Monthly repayment exceeds disposable income."
        : dti > 55
        ? "DTI too high. Consider reducing loan amount or increasing income."
        : approval === "✅ Approved"
        ? "You may qualify for better interest rates or terms."
        : "Consider reducing your loan amount or increasing your income for better chances.";

    setResults({
      interestRate,
      monthlyRepayment,
      totalRepayment,
      totalLoanCost,
      disposable,
      dti,
      dtiRisk,
      balloonAmount,
      creditScore,
      approval,
      likelihood,
      badge,
      suggestions
    });
  };

  const handleExportPDF = () => {
    if (!results) return;
    const doc = new jsPDF();

    doc.text("Scend Loan Qualification Result", 14, 15);
    doc.autoTable({
      startY: 25,
      body: [
        ["Loan Type", form.loanType],
        ["Loan Amount", `R${form.amount}`],
        ["Term", `${form.term} months`],
        ["Interest Rate", `${results.interestRate.toFixed(2)}%`],
        ["Monthly Repayment", `R${results.monthlyRepayment.toFixed(2)}`],
        ["Total Repayment", `R${results.totalRepayment.toFixed(2)}`],
        ["Loan Cost", `R${results.totalLoanCost.toFixed(2)}`],
        ["Disposable Income", `R${results.disposable.toFixed(2)}`],
        ["DTI", `${results.dti.toFixed(1)}% (${results.dtiRisk})`],
        ["Balloon Due at Term End", `R${results.balloonAmount.toFixed(2)}`],
        ["Estimated Credit Score", results.creditScore],
        ["Approval Likelihood", results.likelihood],
        ["Decision", results.approval],
        ["Suggestions", results.suggestions]
      ],
      theme: "grid"
    });

    doc.save("loan_qualification.pdf");
  };

  const handleClear = () => {
    setForm({
      income: "",
      expenses: "",
      amount: "",
      term: "",
      loanType: "Personal Loan",
      balloonPercent: "",
      deposit: ""
    });
    setResults(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded">
      <div className="flex items-center mb-6">
        <img src={logo} alt="Scend Logo" className="h-10 mr-3" />
        <h1 className="text-2xl font-bold">Loan Qualification Tool</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <select
          name="loanType"
          value={form.loanType}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option>Personal Loan</option>
          <option>Vehicle Finance</option>
          <option>Home Loan</option>
          <option>Credit Card</option>
        </select>
        <input
          name="income"
          placeholder="Monthly Income"
          value={form.income}
          onChange={handleChange}
          type="number"
          className="border p-2 rounded"
        />
        <input
          name="expenses"
          placeholder="Monthly Expenses"
          value={form.expenses}
          onChange={handleChange}
          type="number"
          className="border p-2 rounded"
        />
        <input
          name="amount"
          placeholder="Loan Amount"
          value={form.amount}
          onChange={handleChange}
          type="number"
          className="border p-2 rounded"
        />
        <input
          name="term"
          placeholder="Loan Term (months)"
          value={form.term}
          onChange={handleChange}
          type="number"
          className="border p-2 rounded"
        />
        {form.loanType === "Vehicle Finance" && (
          <>
            <input
              name="balloonPercent"
              placeholder="Balloon %"
              value={form.balloonPercent}
              onChange={handleChange}
              type="number"
              className="border p-2 rounded"
            />
            <input
              name="deposit"
              placeholder="Deposit"
              value={form.deposit}
              onChange={handleChange}
              type="number"
              className="border p-2 rounded"
            />
          </>
        )}
        {form.loanType === "Home Loan" && (
          <input
            name="deposit"
            placeholder="Deposit"
            value={form.deposit}
            onChange={handleChange}
            type="number"
            className="border p-2 rounded"
          />
        )}
      </div>

      <div className="space-x-2 mb-4">
        <button
          onClick={handleCalculate}
          className="bg-pink-600 text-white px-4 py-2 rounded"
        >
          Calculate
        </button>
        <button
          onClick={handleClear}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {results && (
        <div className="space-y-2 mt-6">
          <p>
            <strong>Interest Rate:</strong> {results.interestRate.toFixed(2)}%
          </p>
          <p>
            <strong>Monthly Repayment:</strong> R
            {results.monthlyRepayment.toFixed(2)}
          </p>
          <p>
            <strong>Total Repayment:</strong> R
            {results.totalRepayment.toFixed(2)}
          </p>
          <p>
            <strong>Loan Cost:</strong> R{results.totalLoanCost.toFixed(2)}
          </p>
          <p>
            <strong>Disposable Income:</strong> R
            {results.disposable.toFixed(2)}
          </p>
          <p>
            <strong>DTI:</strong> {results.dti.toFixed(1)}% (
            {results.dtiRisk})
          </p>
          <p>
            <strong>Balloon Due at Term End:</strong> R
            {results.balloonAmount.toFixed(2)}
          </p>
          <p>
            <strong>Estimated Credit Score:</strong> {results.creditScore}
          </p>
          <p>
            <strong>Approval Likelihood:</strong> {results.likelihood}
          </p>
          <p>
            <strong>
              Decision:{" "}
              <span
                className={`text-white px-2 py-1 rounded ${results.badge}`}
              >
                {results.approval}
              </span>
            </strong>
          </p>
          <p>
            <strong>Suggestions:</strong> {results.suggestions}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoanTool;
