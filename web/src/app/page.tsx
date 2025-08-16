import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <section className="grid md:grid-cols-2 gap-8 items-center">
      <div>
        <h1 className="text-4xl font-bold mb-3">Welcome to Scend</h1>
        <p className="text-gray-700 mb-6">
          We’re a digital-first provider offering financial tools and broader services to help you
          get more done — smarter and faster.
        </p>
        <div className="flex gap-3">
          <Link href="/loan" className="px-4 py-2 rounded-xl bg-pink-600 text-white">Try Loan Tool</Link>
          <Link href="/tax" className="px-4 py-2 rounded-xl border">Try Tax Tool</Link>
        </div>
      </div>
      <div className="justify-self-center">
        <Image src="/scend-logo.png" alt="Scend logo" width={220} height={220} />
      </div>
    </section>
  );
}
