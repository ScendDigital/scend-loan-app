// pages/contact.jsx
export default function Contact() {
  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#ec4899", fontSize: "2rem", fontWeight: "bold" }}>Contact Us</h1>
      <p style={{ marginTop: "1rem" }}>
        We know you are busy with other important matters — let Scend handle this one professionally and efficiently for you.
      </p>
      <h2 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>Team Contacts:</h2>
      <ul style={{ marginTop: "0.5rem", lineHeight: "1.8" }}>
        <li><strong>Motlatsi Lenyatsa:</strong> 072 803 7223 – <a href="mailto:motlatsi.lenyatsa@gmail.com">motlatsi.lenyatsa@gmail.com</a></li>
        <li><strong>Thato Lenyatsa:</strong> 064 651 9166 – <a href="mailto:thatosebatjane@yahoo.com">thatosebatjane@yahoo.com</a></li>
        <li><strong>Morena Sehlako:</strong> 078 136 3268 – <a href="mailto:morenamcguy@gmail.com">morenamcguy@gmail.com</a></li>
      </ul>
    </div>
  );
}
