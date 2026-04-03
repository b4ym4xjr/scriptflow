import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  return <>{children}</>;
};
export default Layout;
