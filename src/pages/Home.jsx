import Navbar from "@/components/Navbar";
import Image from "next/image";
import logo from "@/public/scend-logo.png";

export default function Home() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <Image src={logo} alt="Scend Logo" width={50} height={50} />
          <h1 style={{ color: "#ec4899", fontSize: "2rem", fontWeight: "bold" }}>Welcome to Scend</h1>
        </div>
        <p style={{ marginTop: "1rem" }}>
          Scend is a multi-service company offering expert solutions across finance, digital, plumbing, maintenance, and more.
          Whether you need a loan qualification tool or trusted hands for your next project — we’re here for you.
        </p>
        <p><em>We take care of it, so you don’t have to.</em></p>
      </div>
    </>
  );
}
