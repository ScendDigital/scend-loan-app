// src/components/PasswordGate.jsx
import { useState, useEffect } from "react";

const PASSWORD = "scend123";

export default function PasswordGate({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const access = localStorage.getItem("scend-access");
    if (access === "true") {
      setAuthorized(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem("scend-access", "true");
      setAuthorized(true);
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (authorized) return children;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md text-center space-y-4 w-80">
        <h2 className="text-xl font-semibold text-pink-600">Scend Private Access</h2>
        <input
          type="password"
          placeholder="Enter password"
          className="w-full p-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-pink-600 text-white w-full py-2 rounded hover:bg-pink-700">
          Access Site
        </button>
      </form>
    </div>
  );
}
