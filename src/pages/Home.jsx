import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <div className="mb-6">
        <Image
          src="/scend-logo.png"
          alt="Scend Logo"
          width={120}
          height={120}
          priority
        />
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Scend</h1>
      <p className="text-lg text-gray-600 mb-6 max-w-xl">
        Your trusted partner in digital services, financial tools, and business solutions.
      </p>
      <div className="flex gap-4">
        <Link href="/loan">
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-2xl shadow">
            Loan Qualification Tool
          </button>
        </Link>
        <Link href="/tax">
          <button className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-2xl shadow">
            Tax Calculator
          </button>
        </Link>
      </div>
    </main>
  );
}
