import React from "react";
import LoanCalculator from "../components/LoanCalculator";

export default function LendingPage() {
  return (
    <div>
      <header className="bg-pink-700 text-white p-6 text-center">
        <h1 className="text-3xl font-bold">Scend Lending</h1>
        <p>Your trusted partner for smarter finance</p>
      </header>

      <main className="mt-10 max-w-4xl mx-auto px-4">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Try Our Smart Loan Calculator</h2>
          <LoanCalculator />
        </section>

        <section className="bg-gray-100 p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold mb-2">What We Offer</h3>
          <ul className="list-disc pl-5 text-gray-700">
            <li>Personal Loans with flexible terms</li>
            <li>Car Finance with or without balloon options</li>
            <li>Home Loans with low interest rates</li>
            <li>Smart credit card qualification support</li>
          </ul>
        </section>
      </main>
    </div>
  );
}