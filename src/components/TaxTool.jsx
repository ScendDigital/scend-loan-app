import React, { useState } from "react";

export default function TaxTool() {
  const [idNumber, setIdNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [income, setIncome] = useState("");
  const [retirement, setRetirement] = useState("");
  const [medicalDependents, setMedicalDependents] = useState("");
  const [result, setResult] = useState(null);

  const calculateAge = (id) => {
    if (id.length !== 13) return null;
    const year = parseInt(id.substring(0, 2), 10);
    const month = parseInt(id.substring(2, 4), 10) - 1;
    const day = parseInt(id.substring(4, 6), 10);
    const fullYear = year > 50 ? 1900 + year : 2000 + year;
    const birthDate = new Date(fullYear, month, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return today < new Date(today.getFullYear(), month, day) ? age - 1 : age;
  };

  const calculateTax = () => {
    const gross = parseFloat(income) || 0;
    const ra = Math.min(gross * 0.275, parseFloat(retirement) || 0);
    const dependents = parseInt(medicalDependents) || 0;

    const taxableIncome = gross - ra;

    let paye = 0;
    if (taxableIncome <= 237100) {
      paye = taxableIncome * 0.18;
    } else if (taxableIncome <= 370500) {
      paye = 42678 + (taxableIncome - 237100) * 0.26;
    } else if (taxableIncome <= 512800) {
      paye = 77362 + (taxableIncome - 370500) * 0.31;
    } else if (taxableIncome <= 673000) {
      paye = 121475 + (taxableIncome - 512800) * 0.36;
    } else if (taxableIncome <= 857900) {
      paye = 179147 + (taxableIncome - 673000) * 0.39;
    } else if (taxableIncome <= 1817000) {
      paye = 251258 + (taxableIncome - 857900) * 0.41;
    } else {
      paye = 644489 + (taxableIncome - 1817000) * 0.45;
    }

    const age = calculateAge(idNumber);
    let rebate = 17235;
    if (age >= 65) rebate += 9499;
    if (age >= 75) rebate += 3163;

    const medCredit = 364 * 12 + Math.max(0, dependents - 1) * 246 * 12;

    const finalTax = Math.max(0, paye - rebate - medCredit);

    setResult({
      fullName,
      age,
      taxableIncome: taxableIncome.toFixed(2),
      paye: paye.toFixed(2),
      rebate,
      medCredit,
      finalTax: finalTax.toFixed(2),
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-xl border border-gray-200">
      <img src="/scend-logo.png" alt="Scend Logo" className="h-12 mb-4" />

      <h2 className="text-2xl font-bold text-gray-800 mb-4">SARS Tax Estimator (2024/2025)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="South African ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Gross Annual Income"
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Retirement Annuity Contribution"
          type="number"
          value={retirement}
          onChange={(e) => setRetirement(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Medical Aid Dependents (Excl. You)"
          type="number"
          value={medicalDependents}
          onChange={(e) => setMedicalDependents(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={calculateTax}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
        >
          Calculate
        </button>
        <button
          onClick={() => {
            setIdNumber("");
            setFullName("");
            setIncome("");
            setRetirement("");
            setMedicalDependents("");
            setResult(null);
          }}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Clear
        </button>
      </div>

      {result && (
        <div className="mt-6 border-t pt-4 text-sm">
          <h3 className="text-xl font-semibold mb-2">Results</h3>
          <p><strong>Name:</strong> {result.fullName}</p>
          <p><strong>Age:</strong> {result.age}</p>
          <p><strong>Taxable Income:</strong> R {result.taxableIncome}</p>
          <p><strong>PAYE Before Rebates:</strong> R {result.paye}</p>
          <p><strong>Age-Based Rebate:</strong> R {result.rebate}</p>
          <p><strong>Medical Aid Credit:</strong> R {result.medCredit}</p>
          <p className="text-lg font-bold text-gray-800 mt-2">
            Total PAYE Due: R {result.finalTax}
          </p>
        </div>
      )}
    </div>
  );
}
 
