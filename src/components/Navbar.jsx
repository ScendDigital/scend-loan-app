import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Image src="/scend-logo.png" alt="Scend Logo" width={40} height={40} />
        <span className="text-scendPink font-bold text-xl">Scend</span>
      </div>
      <div className="space-x-6 text-gray-800 font-medium">
        <Link href="/" className="hover:text-scendPink">Home</Link>
        <span className="text-gray-400">|</span>
        <Link href="/about" className="hover:text-scendPink">About</Link>
        <span className="text-gray-400">|</span>
        <Link href="/loan" className="hover:text-scendPink">Loan Tool</Link>
        <span className="text-gray-400">|</span>
        <Link href="/contact" className="hover:text-scendPink">Contact</Link>
      </div>
    </nav>
  );
}
