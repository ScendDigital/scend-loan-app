// src/components/LoanTool.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getInterestRate = ({ loanType, creditScore, dti }) => {
  let rate = 10.5;

  if (loanType === "Home Loan") {
    if (creditScore > 750 && dti < 30) rate = 9.5;
    else if (creditScore > 650) rate = 10.25;
    else rate = 11.5;
  } else if (loanType === "Personal Loan") {
    if (creditScore > 700) rate = 13.5;
    else rate = 17.5;
  } else if (loanType === "Credit Card") {
    rate = 20.0;
  } else if (loanType === "Vehicle Finance") {
    if (creditScore > 720 && dti < 35) rate = 10.25;
    else rate = 12.0;
  }

  return Math.min(rate, 27.75);
};

const LoanTool = () => {
  const [form, setForm] = useState({
    loanType: "Home Loan",
    loanAmount: 500000,
    termMonths: 240,
    income: 30000,
    expenses: 15000,
    deposit: 0,
    creditScore: 750,
  });

  const [results, setResults] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: +value || value }));
  };

  const handleClear = () => {
    setForm({
      loanType: "Home Loan",
      loanAmount: 500000,
      termMonths: 240,
      income: 30000,
      expenses: 15000,
      deposit: 0,
      creditScore: 750,
    });
    setResults(null);
  };

  const handleCalculate = () => {
    const { loanType, loanAmount, termMonths, income, expenses, deposit, creditScore } = form;
    const disposableIncome = income - expenses;
    const dti = income > 0 ? (expenses / income) * 100 : 0;
    const interestRate = getInterestRate({ loanType, creditScore, dti });

    const baseAmount = loanAmount - deposit;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyRepayment =
      baseAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
    const totalRepayment = monthlyRepayment * termMonths;
    const totalCost = totalRepayment - baseAmount;

    const approval =
      disposableIncome > monthlyRepayment && dti < 55 && interestRate <= 27.75;

    setResults({
      disposableIncome,
      dti,
      interestRate,
      monthlyRepayment,
      totalRepayment,
      totalCost,
      approval,
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Loan Qualification Results", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Field", "Value"]],
      body: [
        ["Loan Type", form.loanType],
        ["Loan Amount", `R ${form.loanAmount.toFixed(2)}`],
        ["Deposit", `R ${form.deposit.toFixed(2)}`],
        ["Term", `${form.termMonths} months`],
        ["Gross Income", `R ${form.income.toFixed(2)}`],
        ["Expenses", `R ${form.expenses.toFixed(2)}`],
        ["Credit Score", form.creditScore],
        ["Disposable Income", `R ${results?.disposableIncome.toFixed(2)}`],
        ["Interest Rate", `${results?.interestRate.toFixed(2)}%`],
        ["Monthly Repayment", `R ${results?.monthlyRepayment.toFixed(2)}`],
        ["Total Repayment", `R ${results?.totalRepayment.toFixed(2)}`],
        ["Total Loan Cost", `R ${results?.totalCost.toFixed(2)}`],
        ["DTI", `${results?.dti.toFixed(2)}%`],
        ["Decision", results?.approval ? "✅ Approved" : "❌ Declined"],
      ],
    });
    doc.save("loan_summary.pdf");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-pink-600">Loan Qualification Tool</h1>
      <div className="grid grid-cols-1 gap-4">
        <select name="loanType" value={form.loanType} onChange={handleChange} className="p-2 border rounded">
          <option>Home Loan</option>
          <option>Personal Loan</option>
          <option>Vehicle Finance</option>
          <option>Credit Card</option>
        </select>
        <input type="number" name="loanAmount" value={form.loanAmount} onChange={handleChange} placeholder="Loan Amount" className="p-2 border rounded" />
        <input type="number" name="termMonths" value={form.termMonths} onChange={handleChange} placeholder="Term (months)" className="p-2 border rounded" />
        <input type="number" name="income" value={form.income} onChange={handleChange} placeholder="Gross Income" className="p-2 border rounded" />
        <input type="number" name="expenses" value={form.expenses} onChange={handleChange} placeholder="Monthly Expenses" className="p-2 border rounded" />
        <input type="number" name="deposit" value={form.deposit} onChange={handleChange} placeholder="Deposit Amount" className="p-2 border rounded" />
        <input type="number" name="creditScore" value={form.creditScore} onChange={handleChange} placeholder="Credit Score" className="p-2 border rounded" />
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={handleCalculate} className="bg-pink-600 text-white px-4 py-2 rounded">Calculate</button>
        <button onClick={handleClear} className="bg-gray-300 px-4 py-2 rounded">Clear</button>
        {results && (
          <button onClick={exportPDF} className="bg-green-600 text-white px-4 py-2 rounded">Export PDF</button>
        )}
      </div>

      {results && (
        <div className="mt-6 space-y-2">
          <p>Disposable Income: R {results.disposableIncome.toFixed(2)}</p>
          <p>Interest Rate: {results.interestRate.toFixed(2)}%</p>
          <p>Monthly Repayment: R {results.monthlyRepayment.toFixed(2)}</p>
          <p>Total Repayment: R {results.totalRepayment.toFixed(2)}</p>
          <p>Total Loan Cost: R {results.totalCost.toFixed(2)}</p>
          <p>Debt-to-Income (DTI): {results.dti.toFixed(2)}%</p>
          <p className={`font-semibold ${results.approval ? "text-green-600" : "text-red-600"}`}>
            Decision: {results.approval ? "✅ Approved" : "❌ Declined"}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoanTool;
