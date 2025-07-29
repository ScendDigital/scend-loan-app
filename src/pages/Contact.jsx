import React from 'react';

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-pink-600 text-center">Contact Us</h2>

      <div className="space-y-2">
        <p><strong>Motlatsi Lenyatsa</strong></p>
        <p>Email: <a href="mailto:motlatsi.lenyatsa@gmail.com" className="text-blue-600 hover:underline">motlatsi.lenyatsa@gmail.com</a></p>
        <p>Phone: <a href="tel:0728037223" className="text-blue-600 hover:underline">072 803 7223</a></p>
      </div>

      <div className="space-y-2">
        <p><strong>Thato Lenyatsa</strong></p>
        <p>Email: <a href="mailto:thatosebatjane@yahoo.com" className="text-blue-600 hover:underline">thatosebatjane@yahoo.com</a></p>
        <p>Phone: <a href="tel:0646519166" className="text-blue-600 hover:underline">064 651 9166</a></p>
      </div>

      <div className="mt-4 text-gray-700">
        <p><em>We know you are busy with other important matters, let Scend handle this one professionally and efficiently for you.</em></p>
      </div>
    </div>
  );
}
