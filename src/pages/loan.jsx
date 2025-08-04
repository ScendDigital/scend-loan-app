import Navbar from "../components/Navbar";
import LoanTool from "../components/LoanTool";

export default function LoanPage() {
  return (
    <>
      <Navbar />
      <main className="p-4 bg-gray-100 min-h-screen">
        <LoanTool />
      </main>
    </>
  );
}
