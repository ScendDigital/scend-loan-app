import Navbar from "@/components/Navbar";

export default function Contact() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "2rem" }}>
        <h1 style={{ color: "#ec4899", fontSize: "2rem", fontWeight: "bold" }}>Contact Us</h1>
        <p><strong>Motlatsi Lenyatsa</strong> — 0728037223 — motlatsi.lenyatsa@gmail.com</p>
        <p><strong>Thato Lenyatsa</strong> — 0646519166 — thatosebatjane@yahoo.com</p>
        <p><strong>Morena Sehlako</strong> — 0781363268 — morenamcguy@gmail.com</p>
        <p style={{ marginTop: "1rem" }}>
          <em>We know you are busy with other important matters, let Scend handle this one professionally and efficiently for you.</em>
        </p>
      </div>
    </>
  );
}
