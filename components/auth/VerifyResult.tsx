"use client";

import { BadgeCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthKit";
import { Button } from "@/components/ui/button";

export function VerifyResult({
  success,
  message,
}: {
  success: boolean;
  message: string;
}) {
  return (
    <AuthCard
      icon={success ? BadgeCheck : TriangleAlert}
      tone={success ? "success" : "danger"}
      title={success ? "Email verified!" : "Verification failed"}
      subtitle={message}
    >
      <Button
        asChild
        className="h-12 w-full rounded-xl bg-primary text-primary-foreground"
      >
        <Link href="/sign-in">Go to sign in</Link>
      </Button>
    </AuthCard>
  );
}
