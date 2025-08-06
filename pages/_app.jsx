// pages/_app.jsx
import Navbar from "@/components/Navbar"; // Adjust path if needed
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}
