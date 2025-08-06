import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "20px",
        padding: "1rem",
        backgroundColor: "#fdf2f8",
        borderBottom: "2px solid #ec4899",
        justifyContent: "center"
      }}
    >
      <Link href="/" passHref legacyBehavior>
        <a style={{ color: "#ec4899", textDecoration: "none", fontWeight: "bold" }}>Home</a>
      </Link>
      <Link href="/about" passHref legacyBehavior>
        <a style={{ color: "#6b7280", textDecoration: "none" }}>About Us</a>
      </Link>
      <Link href="/contact" passHref legacyBehavior>
        <a style={{ color: "#ec4899", textDecoration: "none" }}>Contact Us</a>
      </Link>
      <Link href="/loan" passHref legacyBehavior>
        <a style={{ color: "#6b7280", textDecoration: "none" }}>LoanTool</a>
      </Link>
      <Link href="/tax" passHref legacyBehavior>
        <a style={{ color: "#ec4899", textDecoration: "none" }}>TaxTool</a>
      </Link>
    </nav>
  );
}
