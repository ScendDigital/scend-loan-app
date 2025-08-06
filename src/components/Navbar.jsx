import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{
      backgroundColor: "#fdf2f8",
      padding: "1rem 2rem",
      borderBottom: "2px solid #ec4899",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#ec4899" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#ec4899" }}>
          Welcome to Scend
        </Link>
      </div>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <Link href="/" style={{ color: "#ec4899", textDecoration: "none", fontWeight: "bold" }}>Home</Link>
        <Link href="/about" style={{ color: "#ec4899", textDecoration: "none" }}>About Us</Link>
        <Link href="/contact" style={{ color: "#ec4899", textDecoration: "none" }}>Contact Us</Link>
        <Link href="/loan" style={{ color: "#ec4899", textDecoration: "none" }}>LoanTool</Link>
        <Link href="/tax" style={{ color: "#ec4899", textDecoration: "none" }}>TaxTool</Link>
      </div>
    </nav>
  );
}
