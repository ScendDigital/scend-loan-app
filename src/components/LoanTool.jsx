import { useState } from "react";
import jsPDF from "jspdf";

export default function LoanTool() {
  const [loanType, setLoanType] = useState("Vehicle Finance");
  const [loanAmount, setLoanAmount] = useState(75000);
  const [term, setTerm] = useState(24);
  const [income, setIncome] = useState(12500);
  const [expense, setExpense] = useState(2600);
  const [residual, setResidual] = useState(15);
  const [deposit, setDeposit] = useState(10000);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({});
  const [recommendation, setRecommendation] = useState("");

  const calculate = () => {
    const effectiveLoan = loanAmount - deposit;
    const balloon = loanType === "Vehicle Finance" ? (effectiveLoan * (residual / 100)) : 0;
    const principal = effectiveLoan - balloon;
    const disposable = income - expense;

    let score = 700;
    const dtiRatio = expense / income;
    if (dtiRatio > 0.5) score -= 100;
    if (disposable < 3000) score -= 50;
    if (loanAmount > income * 6) score -= 50;
    if (term > 60) score -= 25;

    let interestRate = 14;
    if (score >= 750) interestRate = 10.5;
    else if (score >= 700) interestRate = 13;
    else if (score >= 650) interestRate = 17;
    else if (score >= 600) interestRate = 21;
    else interestRate = 27.75;

    const monthlyRate = interestRate / 100 / 12;
    const repayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    const monthlyRepayment = parseFloat(repayment.toFixed(2));
    const totalRepayment = parseFloat((monthlyRepayment * term + balloon).toFixed(2));
    const loanCost = parseFloat((totalRepayment - effectiveLoan).toFixed(2));
    const dti = parseFloat(((monthlyRepayment / income) * 100).toFixed(1));

    const approved = dti < 45 && monthlyRepayment <= disposable;

    const message = approved
      ? "✅ Great news! You qualify for this loan. Your financial profile shows good affordability and creditworthiness."
      : "❌ Unfortunately, this loan may not be affordable at the moment. Consider reducing your expenses or increasing your income. You may also try a lower loan amount or longer term.";

    setResults({
      monthlyRepayment,
      totalRepayment,
      loanCost,
      balloon: parseFloat(balloon.toFixed(2)),
      dti,
      disposable,
      creditScore: score,
      interestRate,
      approved
    });

    setRecommendation(message);
    setSubmitted(true);
  };

  const clearAll = () => {
    setLoanAmount("");
    setTerm("");
    setIncome("");
    setExpense("");
    setResidual("");
    setDeposit("");
    setSubmitted(false);
    setResults({});
    setRecommendation("");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Loan Qualification Results", 20, 20);
    const lines = [
      `Loan Type: ${loanType}`,
      `Loan Amount: R ${loanAmount}`,
      `Term: ${term} months`,
      `Monthly Repayment: R ${results.monthlyRepayment}`,
      `Total Repayment: R ${results.totalRepayment}`,
      `Loan Cost: R ${results.loanCost}`,
      loanType === "Vehicle Finance" ? `Balloon Payment: R ${results.balloon}` : null,
      `Disposable Income: R ${results.disposable}`,
      `DTI: ${results.dti}%`,
      `Estimated Credit Score: ${results.creditScore}`,
      `Interest Rate Applied: ${results.interestRate}%`,
      results.approved ? "Status: Approved" : "Status: Declined",
      `Recommendation: ${recommendation}`
    ].filter(Boolean);
    doc.setFontSize(12);
    doc.text(lines, 20, 40);
    doc.save("loan-results.pdf");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem", border: "2px solid #ec4899", borderRadius: "10px", backgroundColor: "#fdf2f8" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ec4899", marginBottom: "1rem" }}>Loan Qualification Tool</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>Loan Type</label><br />
        <select value={loanType} onChange={(e) => setLoanType(e.target.value)} style={{ width: "100%", padding: "0.5rem" }}>
          <option>Vehicle Finance</option>
          <option>Home Loan</option>
          <option>Personal Loan</option>
          <option>Credit Card</option>
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Loan Amount</label><br />
        <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Term (months)</label><br />
        <input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Monthly Income</label><br />
        <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Monthly Expense</label><br />
        <input type="number" value={expense} onChange={(e) => setExpense(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
      </div>

      {loanType === "Vehicle Finance" && (
        <div style={{ marginBottom: "1rem" }}>
          <label>Residual %</label><br />
          <input type="number" value={residual} onChange={(e) => setResidual(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
        </div>
      )}

      {(loanType === "Vehicle Finance" || loanType === "Home Loan") && (
        <div style={{ marginBottom: "1rem" }}>
          <label>Deposit</label><br />
          <input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} style={{ width: "100%", padding: "0.5rem" }} />
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button onClick={calculate} style={{ padding: "0.5rem 1rem", background: "#ec4899", color: "white", border: "none", borderRadius: "5px" }}>Calculate</button>
        <button onClick={clearAll} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "5px" }}>Clear</button>
        {submitted && <button onClick={exportPDF} style={{ padding: "0.5rem 1rem", background: "#6b7280", color: "white", border: "none", borderRadius: "5px" }}>Export PDF</button>}
      </div>

      {submitted && (
        <div style={{ marginTop: "2rem", color: "#333", background: "#fff", padding: "1rem", borderRadius: "8px" }}>
          <h3 style={{ color: "#ec4899" }}>Results:</h3>

          <div style={{ fontSize: "1rem", marginBottom: "1rem" }}>
            <span style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "20px",
              backgroundColor: results.approved ? "#dcfce7" : "#fee2e2",
              color: results.approved ? "#166534" : "#991b1b",
              fontWeight: "bold"
            }}>
              {results.approved ? "✅ Approved" : "❌ Declined"}
            </span>
          </div>

          <p><strong>Monthly Repayment:</strong> R {results.monthlyRepayment}</p>
          <p><strong>Total Repayment:</strong> R {results.totalRepayment}</p>
          <p><strong>Loan Cost:</strong> R {results.loanCost}</p>
          {loanType === "Vehicle Finance" && <p><strong>Balloon Payment:</strong> R {results.balloon}</p>}
          <p><strong>Disposable Income:</strong> R {results.disposable}</p>
          <p><strong>DTI:</strong> {results.dti}%</p>
          <p><strong>Estimated Credit Score:</strong> {results.creditScore}</p>
          <p><strong>Interest Rate Applied:</strong> {results.interestRate}%</p>
          <p style={{ marginTop: "1rem", fontWeight: "bold", color: results.approved ? "green" : "red" }}>{recommendation}</p>
        </div>
      )}
    </div>
  );
}
