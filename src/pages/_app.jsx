import '../styles/globals.css'; // ✅ relative path if you're not using aliases

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
