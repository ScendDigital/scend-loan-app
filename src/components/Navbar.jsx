import Link from "next/link";
import Image from "next/image";
import logo from "/public/scend-logo.png"; // Logo must be in public directory

export default function Navbar() {
  return (
    <nav className="bg-scendGrey text-white shadow-md py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <Image src={logo} alt="Scend Logo" width={40} height={40} />
        <h1 className="text-xl font-bold text-scendPink">Scend</h1>
      </div>
      <div className="space-x-4 text-lg">
        <Link href="/">
          <span className="hover:text-scendPink cursor-pointer">Home</span>
        </Link>
        <span className="text-scendPink">|</span>
        <Link href="/loan">
          <span className="hover:text-scendPink cursor-pointer">Loan Tool</span>
        </Link>
        <span className="text-scendPink">|</span>
        <Link href="/AboutUs">
          <span className="hover:text-scendPink cursor-pointer">About Us</span>
        </Link>
        <span className="text-scendPink">|</span>
        <Link href="/Contact">
          <span className="hover:text-scendPink cursor-pointer">Contact</span>
        </Link>
      </div>
    </nav>
  );
}
