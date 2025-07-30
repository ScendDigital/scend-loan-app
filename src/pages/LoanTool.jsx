// src/pages/LoanTool.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LoanTool = () => {
  const [form, setForm] = useState({
    loanType: "Personal Loan",
    income: "",
    expenses: "",
    amount: "",
    term: "",
    balloon: "",
    deposit: "",
  });

  const [result, setResult] = useState(null);

  const getInterestRate = (score, loanType) => {
    let rate = 18;
    if (score > 700) rate = 12;
    else if (score >= 650) rate = 14;
    else if (score >= 600) rate = 18;
    else rate = 22;

    // NCA compliance cap
    return Math.min(rate, 27.75);
  };

  const estimateCreditScore = (income, dti) => {
    if (dti < 20 && income > 10000) return 720;
    if (dti < 35) return 680;
    if (dti < 50) return 640;
    return 580;
  };

  const getApproval = (dti, repayment, disposable) => {
    if (dti > 55 || repayment > disposable) return "Declined";
    if (dti <= 30) return "Approved";
    return "Borderline";
  };

  const getSuggestions = (decision, dti, score, repayment, disposable) => {
    const tips = [];
    if (decision === "Approved") {
      tips.push("You're in a good position. Consider locking in your rate.");
    } else {
      if (dti > 55) tips.push("Your DTI is too high. Reduce debt or increase income.");
      if (repayment > disposable) tips.push("Monthly repayment exceeds disposable income.");
      if (score < 640) tips.push("Improve credit habits to raise your score.");
      else tips.push("Consider reducing your loan amount or increasing your income for better chances.");
    }
    return tips;
  };

  const getDTIRisk = (dti) => {
    if (dti <= 30) return "Low Risk";
    if (dti <= 50) return "Moderate Risk";
    return "High Risk";
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calculateLoan = () => {
    const income = parseFloat(form.income);
    const expenses = parseFloat(form.expenses);
    const amount = parseFloat(form.amount);
    const term = parseInt(form.term);
    const deposit = parseFloat(form.deposit) || 0;
    const balloon = parseFloat(form.balloon) || 0;

    const financed = amount - deposit;
    const monthlyRate = getInterestRate(700, form.loanType) / 100 / 12;
    const monthlyRepayment =
      (financed - (balloon / (1 + monthlyRate) ** term)) *
      ((monthlyRate * (1 + monthlyRate) ** term) / ((1 + monthlyRate) ** term - 1));

    const totalRepayment = monthlyRepayment * term;
    const loanCost = totalRepayment - financed;
    const disposable = income - expenses;
    const dti = (monthlyRepayment / income) * 100;
    const score = estimateCreditScore(income, dti);
    const approval = getApproval(dti, monthlyRepayment, disposable);
    const suggestions = getSuggestions(approval, dti, score, monthlyRepayment, disposable);
    const dtiRisk = getDTIRisk(dti);

    setResult({
      interestRate: (monthlyRate * 12 * 100).toFixed(2),
      monthlyRepayment: monthlyRepayment.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      loanCost: loanCost.toFixed(2),
      dti: dti.toFixed(1),
      score,
      approval,
      suggestions,
      disposable: disposable.toFixed(2),
      dtiRisk,
      balloonDue: balloon.toFixed(2),
    });
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.text("Loan Qualification Results", 14, 20);
    autoTable(doc, {
      startY: 30,
      body: [
        ["Loan Type", form.loanType],
        ["Interest Rate", `${result.interestRate}%`],
        ["Monthly Repayment", `R${result.monthlyRepayment}`],
        ["Total Repayment", `R${result.totalRepayment}`],
        ["Loan Cost", `R${result.loanCost}`],
        ["Disposable Income", `R${result.disposable}`],
        ["DTI", `${result.dti}% (${result.dtiRisk})`],
        ["Balloon Due", `R${result.balloonDue}`],
        ["Credit Score", result.score],
        ["Approval", result.approval],
      ],
    });
    doc.text("Suggestions:", 14, doc.autoTable.previous.finalY + 10);
    result.suggestions.forEach((s, i) => {
      doc.text(`- ${s}`, 14, doc.autoTable.previous.finalY + 20 + i * 8);
    });
    doc.save("loan_qualification.pdf");
  };

  const getBadgeColor = (decision) => {
    switch (decision) {
      case "Approved":
        return "bg-green-500";
      case "Declined":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Loan Qualification Tool</h2>

      <select name="loanType" value={form.loanType} onChange={handleChange} className="mb-2 w-full border px-2 py-1">
        <option>Personal Loan</option>
        <option>Vehicle Finance</option>
        <option>Home Loan</option>
        <option>Credit Card</option>
      </select>

      <input type="number" name="income" placeholder="Monthly Income" value={form.income} onChange={handleChange} className="mb-2 w-full border px-2 py-1" />
      <input type="number" name="expenses" placeholder="Monthly Expenses" value={form.expenses} onChange={handleChange} className="mb-2 w-full border px-2 py-1" />
      <input type="number" name="amount" placeholder="Loan Amount" value={form.amount} onChange={handleChange} className="mb-2 w-full border px-2 py-1" />
      <input type="number" name="term" placeholder="Loan Term (months)" value={form.term} onChange={handleChange} className="mb-2 w-full border px-2 py-1" />

      {form.loanType === "Vehicle Finance" && (
        <>
          <input type="number" name="balloon" placeholder="Balloon (%)" value={form.balloon} onChange={handleChange} className="mb-2 w-full border px-2 py-1" />
          <input type="number" name="deposit" placeholder="Deposit" value={form.deposit} onChange={handleChange} className="mb-2 w-full border px-2 py-1" />
        </>
      )}
      {form.loanType === "Home Loan" && (
        <input type="number" name="deposit" placeholder="Deposit" value={form.deposit} onChange={handleChange} className="mb-2 w-full border px-2 py-1" />
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={calculateLoan} className="bg-pink-600 text-white px-4 py-2 rounded">Calculate</button>
        <button onClick={() => setResult(null)} className="bg-gray-400 text-white px-4 py-2 rounded">Clear</button>
        <button onClick={exportPDF} className="bg-green-600 text-white px-4 py-2 rounded">Export PDF</button>
      </div>

      {result && (
        <div className="mt-4 space-y-2">
          <div>Interest Rate: {result.interestRate}%</div>
          <div>Monthly Repayment: R{result.monthlyRepayment}</div>
          <div>Total Repayment: R{result.totalRepayment}</div>
          <div>Loan Cost: R{result.loanCost}</div>
          <div>Disposable Income: R{result.disposable}</div>
          <div>DTI: {result.dti}% ({result.dtiRisk})</div>
          <div>Balloon Due at Term End: R{result.balloonDue}</div>
          <div>Estimated Credit Score: {result.score}</div>
          <div>Approval Likelihood: {result.score >= 700 ? "High" : result.score >= 650 ? "Moderate" : "Low"}</div>
          <div className={`text-white px-2 py-1 inline-block rounded ${getBadgeColor(result.approval)}`}>
            Decision: {result.approval === "Approved" ? "✅ Approved" : result.approval === "Declined" ? "❌ Declined" : "⚠️ Borderline"}
          </div>
          {result.suggestions.length > 0 && (
            <div>
              <strong>Suggestions:</strong>
              <ul className="list-disc ml-5">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanTool;
