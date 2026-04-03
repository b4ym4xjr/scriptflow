"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const Page = () => {
  return (
    <div>
      Dashboard
      <Button
        variant="outline"
        onClick={() => signOut()}
        className="flex-1 sm:flex-none"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};
export default Page;
