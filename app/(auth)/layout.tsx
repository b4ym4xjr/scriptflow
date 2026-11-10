import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (session) redirect("/");
  return (
    <section className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/sign-in" aria-label="ScriptFlow">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">{children}</div>
      </div>
    </section>
  );
};
export default Layout;
