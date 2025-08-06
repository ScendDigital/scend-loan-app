import Navbar from "@/components/Navbar";
import TaxTool from "@/components/TaxTool";

export default function TaxPage() {
  return (
    <>
      <Navbar />
      <div
        style={{
          maxWidth: "600px",
          margin: "2rem auto",
          padding: "1rem",
          border: "2px solid #ec4899",
          borderRadius: "10px",
          backgroundColor: "#fdf2f8",
        }}
      >
        <TaxTool />
      </div>
    </>
  );
}
