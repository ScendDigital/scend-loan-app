import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="p-4 text-gray-800">
        <h1 className="text-3xl font-bold text-scendPink mb-4">Welcome to Scend</h1>
        <p className="text-lg">
          Scend is a multi-service company offering expert solutions across finance, digital, plumbing, maintenance, and more. Whether you need a loan
          qualification tool or trusted hands for your next project — we’re here for you.
        </p>
        <p className="mt-4 italic text-gray-600">
          We take care of it, so you don’t have to.
        </p>
      </main>
    </>
  );
}
