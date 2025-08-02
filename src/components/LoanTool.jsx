import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Dummy change to force Git update — 2025-08-02

const LoanTool = () => {
  const [loanType, setLoanType] = useState("Home Loan");
  const [loanAmount, setLoanAmount] = useState(500000);
  const [termMonths, setTermMonths] = useState(240);
  const [income, setIncome] = useState(30000);
  const [expenses, setExpenses] = useState(15000);
  const [deposit, setDeposit] = useState(0);
  const [balloonPercent, setBalloonPercent] = useState(0);
  const [creditScore, setCreditScore] = useState(700);

  const disposableIncome = income - expenses;
  const dti = (expenses / income) * 100;

  const getInterestRate = () => {
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

  const interestRate = getInterestRate();
  const balloonAmount = loanType === "Vehicle Finance" ? (balloonPercent / 100) * loanAmount : 0;
  const baseAmount = loanAmount - deposit - balloonAmount;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyRepayment = baseAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
  const totalRepayment = monthlyRepayment * termMonths + balloonAmount;
  const loanCost = totalRepayment - (loanAmount - deposit);

  const dtiRisk = dti < 30 ? "Low" : dti < 45 ? "Moderate" : "High";
  const isCompliant = dti <= 55 && monthlyRepayment <= disposableIncome;
  const approval = isCompliant && creditScore >= 550;
  const decision = approval ? "Approved" : "Declined";
  const approvalLikelihood = creditScore > 750 ? "High" : creditScore > 650 ? "Moderate" : "Low";

  const handleClear = () => {
    setLoanType("Home Loan");
    setLoanAmount(500000);
    setTermMonths(240);
    setIncome(30000);
    setExpenses(15000);
    setDeposit(0);
    setBalloonPercent(0);
    setCreditScore(700);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Scend Loan Qualification Report", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Field", "Value"]],
      body: [
        ["Loan Type", loanType],
        ["Loan Amount", `R ${loanAmount.toLocaleString()}`],
        ["Term (Months)", termMonths],
        ["Deposit Amount", `R ${deposit.toLocaleString()}`],
        ["Balloon Payment", `R ${balloonAmount.toFixed(2)}`],
        ["Interest Rate", `${interestRate.toFixed(2)}%`],
        ["Monthly Repayment", `R ${monthlyRepayment.toFixed(2)}`],
        ["Total Repayment", `R ${totalRepayment.toFixed(2)}`],
        ["Loan Cost", `R ${loanCost.toFixed(2)}`],
        ["Gross Income", `R ${income}`],
        ["Expenses", `R ${expenses}`],
        ["Disposable Income", `R ${disposableIncome.toFixed(2)}`],
        ["DTI", `${dti.toFixed(2)}% (${dtiRisk})`],
        ["Credit Score", creditScore],
        ["Compliant with NCA", isCompliant ? "Yes" : "No"],
        ["Decision", decision],
      ],
    });
    doc.save("Scend-Loan-Report.pdf");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl">
      <h2 className="text-2xl font-bold text-pink-600 mb-4">Loan Qualification Tool</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>Loan Type:
          <select value={loanType} onChange={e => setLoanType(e.target.value)} className="w-full">
            <option>Home Loan</option>
            <option>Vehicle Finance</option>
            <option>Personal Loan</option>
            <option>Credit Card</option>
          </select>
        </label>
        <label>Loan Amount:
          <input type="number" value={loanAmount} onChange={e => setLoanAmount(+e.target.value)} className="w-full" />
        </label>
        <label>Term (months):
          <input type="number" value={termMonths} onChange={e => setTermMonths(+e.target.value)} className="w-full" />
        </label>
        <label>Deposit Amount:
          <input type="number" value={deposit} onChange={e => setDeposit(+e.target.value)} className="w-full" />
        </label>
        {loanType === "Vehicle Finance" && (
          <label>Balloon Payment (%):
            <input type="number" value={balloonPercent} onChange={e => setBalloonPercent(+e.target.value)} className="w-full" />
          </label>
        )}
        <label>Gross Income:
          <input type="number" value={income} onChange={e => setIncome(+e.target.value)} className="w-full" />
        </label>
        <label>Monthly Expenses:
          <input type="number" value={expenses} onChange={e => setExpenses(+e.target.value)} className="w-full" />
        </label>
        <label>Credit Score:
          <input type="number" value={creditScore} onChange={e => setCreditScore(+e.target.value)} className="w-full" />
        </label>
      </div>

      <div className="mt-6 flex gap-4">
        <button onClick={exportPDF} className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">Export PDF</button>
        <button onClick={handleClear} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Clear</button>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <p><strong>Disposable Income:</strong> R {disposableIncome.toFixed(2)}</p>
        <p><strong>Balloon Payment Due:</strong> R {balloonAmount.toFixed(2)}</p>
        <p><strong>Base Amount:</strong> R {baseAmount.toFixed(2)}</p>
        <p><strong>Interest Rate:</strong> {interestRate.toFixed(2)}%</p>
        <p><strong>Monthly Repayment:</strong> R {monthlyRepayment.toFixed(2)}</p>
        <p><strong>Total Repayment:</strong> R {totalRepayment.toFixed(2)}</p>
        <p><strong>Loan Cost:</strong> R {loanCost.toFixed(2)}</p>
        <p><strong>Debt-to-Income (DTI):</strong> {dti.toFixed(2)}% — {dtiRisk} Risk</p>
        <p><strong>Estimated Credit Score:</strong> {creditScore}</p>
        <p><strong>Compliant with NCA:</strong> {isCompliant ? "✅ Yes" : "❌ No"}</p>
        <p><strong>Loan Decision:</strong> {approval ? "✅ Approved" : "❌ Declined"}</p>
        <p><strong>Approval Likelihood:</strong> {approvalLikelihood}</p>
        <p><strong>Suggestions:</strong> {approval ? "Loan appears to be within affordable and compliant range." : "Consider reducing your loan amount or increasing your income."}</p>
      </div>
    </div>
  );
};

export default LoanTool;
