import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // `s/` = public read-only share links (/s/[token]); they must not require a session.
    "/((?!s/|sign-in|sign-up|verify-email|reset-password|forgot-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
