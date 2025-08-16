import Link from 'next/link';

export default function ContactPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="text-gray-700">
        “We know you are busy with other important matters, let Scend handle this one
        professionally and efficiently for you.”
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Motlatsi Lenyatsa</h2>
          <div><a className="text-pink-600" href="mailto:motlatsi.lenyatsa@gmail.com">motlatsi.lenyatsa@gmail.com</a></div>
          <div><a className="text-pink-600" href="tel:+27728037223">072 803 7223</a></div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Thato Lenyatsa</h2>
          <div><a className="text-pink-600" href="mailto:thatosebatjane@yahoo.com">thatosebatjane@yahoo.com</a></div>
          <div><a className="text-pink-600" href="tel:+27646519166">064 651 9166</a></div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Morena Sehlako</h2>
          <div><a className="text-pink-600" href="mailto:morenamcguy@gmail.com">morenamcguy@gmail.com</a></div>
          <div><a className="text-pink-600" href="tel:+27781363268">078 136 3268</a></div>
        </div>
      </div>
    </section>
  );
}
