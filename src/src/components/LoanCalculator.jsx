import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const LoanCalculator = () => {
  const [loanType, setLoanType] = useState('Personal Loan');
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');
  const [deposit, setDeposit] = useState('');
  const [results, setResults] = useState(null);

  const scendPink = '#ec4899';
  const scendGrey = '#4b5563';

  const handleCalculate = () => {
    const numericIncome = parseFloat(income);
    const numericExpenses = parseFloat(expenses);
    const numericAmount = parseFloat(amount);
    const numericMonths = parseInt(months);
    const numericDeposit = parseFloat(deposit) || 0;

    if (isNaN(numericIncome) || isNaN(numericExpenses) || isNaN(numericAmount) || isNaN(numericMonths)) {
      alert('Please fill in all numeric fields.');
      return;
    }

    const loanAmount = numericAmount - (loanType === 'Car Finance' ? numericDeposit : 0);
    const dti = (numericExpenses / numericIncome) * 100;
    const dtiRisk =
      dti < 30 ? 'Low' : dti < 40 ? 'Medium' : dti < 50 ? 'High' : 'Very High';

    let interestRate;
    switch (loanType) {
      case 'Home Loan':
        interestRate = 10.5;
        break;
      case 'Car Finance':
        interestRate = 13.5;
        break;
      case 'Credit Card':
        interestRate = 18.9;
        break;
      default:
        interestRate = 17.5;
    }

    const monthlyInterest = interestRate / 100 / 12;
    const repayment = loanAmount * (monthlyInterest / (1 - Math.pow(1 + monthlyInterest, -numericMonths)));
    const totalRepayment = repayment * numericMonths;
    const totalLoanCost = totalRepayment + numericDeposit;

    let approval;
    let recommendation;
    let affordable = repayment < numericIncome * 0.3;

    if (dti < 30 && affordable) {
      approval = 'Approved';
      recommendation = 'Congratulations! Your loan is approved with minimal risk.';
    } else if (dti < 40 && affordable) {
      approval = 'Conditional Approval';
      recommendation = 'Reduce existing debt slightly to secure full approval.';
    } else if (dti < 50 && affordable) {
      approval = 'High Risk';
      recommendation = 'Lower your expenses or increase income to improve your chance.';
    } else {
      approval = 'Declined';
      recommendation = 'Loan affordability is too low. Improve financial profile before applying again.';
    }

    setResults({
      dti: dti.toFixed(1),
      dtiRisk,
      interestRate,
      repayment: repayment.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      totalLoanCost: totalLoanCost.toFixed(2),
      approval,
      recommendation,
      affordable: affordable ? 'Yes' : 'No',
    });
  };

  const handlePrint = () => {
    const element = document.getElementById('results');
    html2pdf().from(element).save('loan-results.pdf');
  };

  const handleClear = () => {
    setLoanType('Personal Loan');
    setIncome('');
    setExpenses('');
    setAmount('');
    setMonths('');
    setDeposit('');
    setResults(null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto rounded-2xl shadow-lg border" style={{ borderColor: scendGrey }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: scendPink }}>
        Smart Loan Calculator
      </h2>

      <div className="grid gap-4">
        <div>
          <Label>Loan Type</Label>
          <Select value={loanType} onValueChange={setLoanType}>
            <SelectTrigger>
              <SelectValue placeholder="Select loan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Personal Loan">Personal Loan</SelectItem>
              <SelectItem value="Car Finance">Car Finance</SelectItem>
              <SelectItem value="Home Loan">Home Loan</SelectItem>
              <SelectItem value="Credit Card">Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Monthly Income (ZAR)</Label>
          <Input value={income} onChange={e => setIncome(e.target.value)} type="number" />
        </div>

        <div>
          <Label>Monthly Expenses (ZAR)</Label>
          <Input value={expenses} onChange={e => setExpenses(e.target.value)} type="number" />
        </div>

        <div>
          <Label>Loan Amount (ZAR)</Label>
          <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" />
        </div>

        {loanType === 'Car Finance' && (
          <div>
            <Label>Deposit (ZAR)</Label>
            <Input value={deposit} onChange={e => setDeposit(e.target.value)} type="number" />
          </div>
        )}

        <div>
          <Label>Repayment Term (Months)</Label>
          <Input value={months} onChange={e => setMonths(e.target.value)} type="number" />
        </div>

        <div className="flex gap-3">
          <Button style={{ backgroundColor: scendPink }} onClick={handleCalculate}>
            Calculate
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!results}>
            Print PDF
          </Button>
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>

      {results && (
        <div id="results" className="mt-6 border-t pt-4 text-sm space-y-2">
          <h3 className="text-lg font-semibold" style={{ color: scendGrey }}>
            Results Summary
          </h3>
          <p><strong>DTI Ratio:</strong> {results.dti}% ({results.dtiRisk} Risk)</p>
          <p><strong>Interest Rate:</strong> {results.interestRate}%</p>
          <p><strong>Estimated Monthly Repayment:</strong> R{results.repayment}</p>
          <p><strong>Total Repayment (excluding deposit):</strong> R{results.totalRepayment}</p>
          <p><strong>Total Loan Cost (incl. deposit):</strong> R{results.totalLoanCost}</p>
          <p><strong>Affordable:</strong> {results.affordable}</p>
          <p><strong>Approval Status:</strong> {results.approval}</p>
          <p className="italic" style={{ color: scendPink }}>
            {results.recommendation}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;
