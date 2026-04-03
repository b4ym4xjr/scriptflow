import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (session) redirect("/");
  return (
    <section className="relative flex-1 bg-linear-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-black/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] opacity-40"></div>

      <div className="relative z-10 max-w-6xl w-full px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};
export default Layout;
