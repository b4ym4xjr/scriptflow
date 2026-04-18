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
    "/((?!sign-in|sign-up|verify-email|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
