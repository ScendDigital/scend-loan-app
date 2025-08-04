// src/components/Navbar.jsx
import Link from "next/link";
import Image from "next/image";
import logo from "../assets/scend-logo.png"; // ✅ Adjusted path to logo

export default function Navbar() {
  return (
    <nav className="bg-scendGrey text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Image src={logo} alt="Scend Logo" width={40} height={40} />
        <span className="text-xl font-bold text-scendPink">Scend</span>
      </div>
      <div className="space-x-4">
        <Link href="/" className="hover:text-scendPink font-medium">Home</Link>
        <span className="text-gray-300">|</span>
        <Link href="/about" className="hover:text-scendPink font-medium">About</Link>
        <span className="text-gray-300">|</span>
        <Link href="/loan" className="hover:text-scendPink font-medium">LoanTool</Link>
        <span className="text-gray-300">|</span>
        <Link href="/contact" className="hover:text-scendPink font-medium">Contact</Link>
      </div>
    </nav>
  );
}
