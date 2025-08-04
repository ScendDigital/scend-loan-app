// src/components/Navbar.jsx
import Link from "next/link";
import Image from "next/image";
import logo from "../assets/scend-logo.png";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <Image src={logo} alt="Scend Logo" width={40} height={40} />
        <span className="text-scendPink text-xl font-bold">Scend</span>
      </div>
      <div className="space-x-6 text-scendGrey font-medium">
        <Link href="/">Home</Link>
        <span>|</span>
        <Link href="/AboutUs">About</Link>
        <span>|</span>
        <Link href="/loan">Loan Tool</Link>
        <span>|</span>
        <Link href="/Contact">Contact</Link>
      </div>
    </nav>
  );
}
