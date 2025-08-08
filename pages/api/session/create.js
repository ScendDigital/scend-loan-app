// pages/api/session/create.js
import jwt from "jsonwebtoken";
import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const tool = (req.query.tool || "LoanTool").toString();
  const TWO_HOURS = 2 * 60 * 60; // seconds
  const payload = { tool, iat: Math.floor(Date.now()/1000) };
  const token = jwt.sign(payload, process.env.SESSION_SECRET || "dev-secret", {
    expiresIn: TWO_HOURS,
  });

  res.setHeader("Set-Cookie",
    cookie.serialize("scend_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TWO_HOURS,
    })
  );

  return res.status(200).json({ ok: true, tool, seconds: TWO_HOURS });
}
