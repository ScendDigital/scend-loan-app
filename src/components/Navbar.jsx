import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-scendPink text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Scend</h1>
        <div className="space-x-4">
          <Link href="/">
            <span className="hover:underline cursor-pointer">Home</span>
          </Link>
          <Link href="/AboutUs">
            <span className="hover:underline cursor-pointer">About</span>
          </Link>
          <Link href="/loan">
            <span className="hover:underline cursor-pointer">Loan Tool</span>
          </Link>
          <Link href="/Contact">
            <span className="hover:underline cursor-pointer">Contact</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
