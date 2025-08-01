import React, { useState } from 'react';
import Input from "./Input";
import Button from "./Button";
import Image from "next/image";
import logo from "@/public/scend-logo.png"; // Ensure this logo file exists

export default function LoanTool() {
  const [loanType, setLoanType] = useState("Personal Loan");
  const [loanAmount, setLoanAmount] = useState("");
  const [term, setTerm] = useState("");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [deposit, setDeposit] = useState("");
  const [balloonPercent, setBalloonPercent] = useState("");

  const [results, setResults] = useState(null);

  const getInterestRate = (type) => {
    switch (type) {
      case "Personal Loan": return 24;
      case "Vehicle Finance": return 18;
      case "Home Loan": return 11;
      case "Credit Card": return 27.75;
      default: return 20;
    }
  };

  const estimateCreditScore = (dti, incomeNum) => {
    if (dti < 30 && incomeNum > 15000) return 750;
    if (dti < 45 && incomeNum > 10000) return 700;
    if (dti < 55) return 650;
    return 600;
  };

  const getSuggestions = (dti, disposableIncome, monthlyRepayment, balloonFinal) => {
    const suggestions = [];
    if (monthlyRepayment > disposableIncome) suggestions.push("Monthly repayment exceeds your disposable income.");
    if (dti > 55) suggestions.push("DTI too high, consider reducing expenses or loan amount.");
    if (balloonFinal > 0) suggestions.push(`Plan for balloon payment of R ${balloonFinal.toFixed(2)} at the end.`);
    if (dti < 30 && disposableIncome > 5000) suggestions.push("Consider a longer term to reduce monthly pressure.");
    return suggestions;
  };

  const handleCalculate = () => {
    const amount = parseFloat(loanAmount) || 0;
    const months = parseInt(term) || 0;
    const incomeNum = parseFloat(income) || 0;
    const expensesNum = parseFloat(expenses) || 0;
    const depositAmount = parseFloat(deposit) || 0;
    const balloonRate = parseFloat(balloonPercent) || 0;

    if (!amount || !months || !incomeNum || !expensesNum) {
      alert("Please complete all required fields.");
      return;
    }

    const interestAnnual = getInterestRate(loanType);
    const interestMonthly = interestAnnual / 100 / 12;

    const loanBase = amount - depositAmount;
    const balloonFinal = loanType === "Vehicle Finance" ? loanBase * (balloonRate / 100) : 0;
    const loanFinanced = loanBase - balloonFinal;

    const disposableIncome = incomeNum - expensesNum;
    const monthlyRepayment = (loanFinanced * interestMonthly) / (1 - Math.pow(1 + interestMonthly, -months));
    const totalInterest = monthlyRepayment * months - loanFinanced;
    const totalRepayment = monthlyRepayment * months + balloonFinal;
    const dti = (monthlyRepayment / incomeNum) * 100;

    const isCompliant = interestAnnual <= 27.75 && dti <= 55 && monthlyRepayment <= disposableIncome;
    const decision = isCompliant ? (dti < 45 ? "Approved" : "Borderline") : "Declined";
    const dtiRiskLevel = dti < 30 ? "Low" : dti < 45 ? "Moderate" : "High";
    const approvalChance = isCompliant ? Math.max(0, 100 - dti) : 0;
    const creditScore = estimateCreditScore(dti, incomeNum);
    const suggestions = getSuggestions(dti, disposableIncome, monthlyRepayment, balloonFinal);

    setResults({
      monthlyRepayment,
      disposableIncome,
      dti,
      decision,
      dtiRiskLevel,
      approvalChance,
      balloonFinal,
      interestAnnual,
      creditScore,
      totalInterest,
      totalRepayment,
      loanFinanced,
      suggestions
    });
  };

  const handleClear = () => {
    setLoanType("Personal Loan");
    setLoanAmount("");
    setTerm("");
    setIncome("");
    setExpenses("");
    setDeposit("");
    setBalloonPercent("");
    setResults(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow border border-gray-200">
      <div className="flex items-center gap-4 mb-4">
        <Image src={logo} alt="Scend Logo" width={50} height={50} />
        <h1 className="text-3xl font-bold text-pink-600">Loan Qualification Tool</h1>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Loan Type</label>
        <select
          value={loanType}
          onChange={(e) => setLoanType(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option>Personal Loan</option>
          <option>Vehicle Finance</option>
          <option>Home Loan</option>
          <option>Credit Card</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Loan Amount</label>
          <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
        </div>
        <div>
          <label>Term (months)</label>
          <Input type="number" value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <div>
          <label>Gross Income</label>
          <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
        </div>
        <div>
          <label>Monthly Expenses</label>
          <Input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
        </div>
        {(loanType === "Home Loan" || loanType === "Vehicle Finance") && (
          <div>
            <label>Deposit Amount</label>
            <Input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </div>
        )}
        {loanType === "Vehicle Finance" && (
          <div>
            <label>Balloon Payment (%)</label>
            <Input type="number" value={balloonPercent} onChange={(e) => setBalloonPercent(e.target.value)} />
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={handleCalculate}>Calculate</Button>
        <Button variant="outline" onClick={handleClear}>Clear</Button>
      </div>

      {results && (
        <div className="mt-6 space-y-2 text-gray-800">
          <div>Monthly Repayment: <strong>R {results.monthlyRepayment.toFixed(2)}</strong></div>
          <div>Disposable Income: <strong>R {results.disposableIncome.toFixed(2)}</strong></div>
          <div>DTI: <strong>{results.dti.toFixed(2)}%</strong> — <span className={`font-semibold ${results.dtiRiskLevel === "High" ? "text-red-500" : results.dtiRiskLevel === "Moderate" ? "text-yellow-600" : "text-green-600"}`}>{results.dtiRiskLevel} Risk</span></div>
          <div>Compliance: <strong className={results.decision === "Declined" ? "text-red-600" : "text-green-600"}>{results.decision === "Declined" ? "Non-Compliant" : "Compliant"}</strong></div>
          <div>Decision: <strong className={results.decision === "Approved" ? "text-green-600" : results.decision === "Borderline" ? "text-yellow-600" : "text-red-600"}>{results.decision}</strong></div>
          <div>Approval Chance: <strong>{results.approvalChance.toFixed(0)}%</strong></div>
          <div>Estimated Credit Score: <strong>{results.creditScore}</strong></div>
          <div>Interest Rate (Auto): <strong>{results.interestAnnual}%</strong></div>
          <div>Base Amount for Interest: <strong>R {results.loanFinanced.toFixed(2)}</strong></div>
          <div>Total Interest Over Term: <strong>R {results.totalInterest.toFixed(2)}</strong></div>
          <div>Total Repayment (including balloon): <strong>R {results.totalRepayment.toFixed(2)}</strong></div>
          {loanType === "Vehicle Finance" && (
            <div>Balloon Amount at Term End: <strong>R {results.balloonFinal.toFixed(2)}</strong></div>
          )}
          {results.suggestions.length > 0 && (
            <div className="mt-4">
              <h2 className="font-semibold mb-1">Suggestions:</h2>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {results.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
