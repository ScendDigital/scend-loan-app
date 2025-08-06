import Navbar from "@/components/Navbar";

export default function About() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "2rem" }}>
        <h1 style={{ color: "#6b7280", fontSize: "2rem", fontWeight: "bold" }}>About Us</h1>
        <p>
          Scend is a dynamic and versatile company offering innovative digital and financial services,
          as well as hands-on solutions like plumbing, maintenance, and more. We are driven by a passion
          for empowering people and businesses through smart technology and reliable service.
        </p>
        <p style={{ marginTop: "1rem" }}>
          Our team is committed to delivering high-quality tools like the Loan Qualification Tool and Tax Calculator,
          while also supporting practical needs in everyday life. With Scend, you're not just getting a service — you're gaining a partner in progress.
        </p>
      </div>
    </>
  );
}
