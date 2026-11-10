"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { forgotPassword } from "@/actions/auth";
import { AuthCard, AuthInput, SubmitButton } from "@/components/auth/AuthKit";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
});

type FormData = z.infer<typeof schema>;

const Page = () => {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    await forgotPassword(data.email);
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard
        icon={MailCheck}
        tone="success"
        title="Check your inbox"
        subtitle="If that email is registered, we've sent a password reset link. Follow the instructions to continue."
      >
        <Button
          asChild
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground"
        >
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={KeyRound}
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthInput
          {...register("email")}
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@channel.com"
          error={errors.email?.message}
          disabled={isSubmitting}
        />
        <SubmitButton loading={isSubmitting} loadingText="Sending...">
          Send reset link
        </SubmitButton>
      </form>
      <div className="text-center">
        <Link
          href="/sign-in"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
};

export default Page;
