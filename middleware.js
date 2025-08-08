// middleware.js (at project root)
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Only protect these paths
  const protectedPaths = ["/loan", "/tax"];
  if (!protectedPaths.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("scend_session")?.value;
  if (!token) {
    url.pathname = "/pay";
    return NextResponse.redirect(url);
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || "dev-secret");
    // Optional: restrict each page to its tool
    if (pathname.startsWith("/loan") && decoded.tool !== "LoanTool") {
      url.pathname = "/pay"; return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/tax") && decoded.tool !== "TaxTool") {
      url.pathname = "/pay"; return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch {
    url.pathname = "/pay";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/loan/:path*", "/tax/:path*"],
};
