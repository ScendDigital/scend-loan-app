import React, { useState, useEffect } from "react";

export default function PasswordGate({ children }) {
  const [accessGranted, setAccessGranted] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const PASSWORD = "scend123"; // You can change this to any password you want

  useEffect(() => {
    const storedAccess = localStorage.getItem("scend-access");
    if (storedAccess === "true") {
      setAccessGranted(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem("scend-access", "true");
      setAccessGranted(true);
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (accessGranted) return children;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-6 rounded-xl space-y-4 w-96 text-center"
      >
        <h2 className="text-xl font-bold text-pink-600">Scend Private Access</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter password"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700">
          Access Site
        </button>
      </form>
    </div>
  );
}
