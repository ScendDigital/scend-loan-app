import React from "react";
import Navbar from "../components/Navbar";

const Contact = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow-md mt-6">
        <h2 className="text-2xl font-bold mb-4 text-scendPink">Contact Us</h2>

        <div className="space-y-6 text-gray-800">
          <div>
            <h3 className="text-lg font-semibold">Motlatsi Lenyatsa</h3>
            <p>
              Email:{" "}
              <a
                href="mailto:motlatsi.lenyatsa@gmail.com"
                className="text-blue-600 hover:underline"
              >
                motlatsi.lenyatsa@gmail.com
              </a>
            </p>
            <p>
              Phone:{" "}
              <a
                href="tel:+27728037223"
                className="text-blue-600 hover:underline"
              >
                072 803 7223
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Thato Lenyatsa</h3>
            <p>
              Email:{" "}
              <a
                href="mailto:thatosebatjane@yahoo.com"
                className="text-blue-600 hover:underline"
              >
                thatosebatjane@yahoo.com
              </a>
            </p>
            <p>
              Phone:{" "}
              <a
                href="tel:+27646519166"
                className="text-blue-600 hover:underline"
              >
                064 651 9166
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Morena Sehlako</h3>
            <p>
              Email:{" "}
              <a
                href="mailto:morenamcguy@gmail.com"
                className="text-blue-600 hover:underline"
              >
                morenamcguy@gmail.com
              </a>
            </p>
            <p>
              Phone:{" "}
              <a
                href="tel:+27781363268"
                className="text-blue-600 hover:underline"
              >
                078 136 3268
              </a>
            </p>
          </div>
        </div>

        <p className="mt-8 text-gray-700 italic">
          We know you are busy with other important matters, let Scend handle
          this one professionally and efficiently for you.
        </p>
      </div>
    </>
  );
};

export default Contact;
