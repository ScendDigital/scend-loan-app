// middleware.js
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/loan/:path*", "/tax/:path*"],
};

export function middleware(req) {
  // Toggle with Vercel env var: PAYWALL_ENABLED = "true" | "false"
  const enabled = process.env.PAYWALL_ENABLED !== "false";
  if (!enabled) return NextResponse.next();

  const url = req.nextUrl.clone();
  const session = req.cookies.get("tool_session")?.value;
  const expiry = Number(req.cookies.get("tool_expiry")?.value || 0);

  if (!session || !expiry || Date.now() >= expiry) {
    url.pathname = "/api/payfast/start";
    url.searchParams.set("tool", url.pathname.startsWith("/tax") ? "TaxTool" : "LoanTool");
    url.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
