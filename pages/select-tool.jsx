import { useRouter } from "next/router";

export default function SelectTool() {
  const router = useRouter();

  const handleSelect = (tool) => {
    router.push(`/pay?tool=${tool}`);
  };

  return (
    <div style={{
      maxWidth: "500px",
      margin: "4rem auto",
      padding: "2rem",
      border: "2px solid #ec4899",
      borderRadius: "12px",
      backgroundColor: "#fdf2f8",
      textAlign: "center",
    }}>
      <h2 style={{ marginBottom: "2rem", color: "#db2777" }}>Choose Your Tool</h2>
      <button onClick={() => handleSelect("loan")} style={buttonStyle}>
        💰 Access Loan Qualification Tool – R55.00
      </button>
      <br /><br />
      <button onClick={() => handleSelect("tax")} style={buttonStyle}>
        🧾 Access Tax Calculator Tool – R55.00
      </button>
    </div>
  );
}

const buttonStyle = {
  backgroundColor: "#ec4899",
  color: "white",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
};
