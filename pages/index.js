import { useRouter } from "next/router";

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{
      maxWidth: "600px",
      margin: "4rem auto",
      textAlign: "center",
    }}>
      <h1>Welcome to Scend</h1>
      <p>Smart tools to help you make informed financial decisions.</p>
      <button
        onClick={() => router.push("/select-tool")}
        style={{
          backgroundColor: "#ec4899",
          color: "white",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "18px",
          marginTop: "2rem",
        }}
      >
        Get Started
      </button>
    </div>
  );
}
