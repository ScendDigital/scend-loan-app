import Navbar from "../components/Navbar";
import LoanTool from "../components/LoanTool";

export default function LoanPage() {
  return (
    <>
      <Navbar />
      <main className="p-4">
        <h1 className="text-2xl font-bold text-scendPink mb-4">Scend Loan Tool</h1>
        <LoanTool />
      </main>
    </>
  );
}
