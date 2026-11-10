"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckBig, Lock, LockKeyhole, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { resetPassword } from "@/actions/auth";
import {
  AuthCard,
  AuthInput,
  PasswordStrength,
  SubmitButton,
} from "@/components/auth/AuthKit";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema } from "@/lib/validations";

type FormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Invalid reset link.");
      return;
    }
    const result = await resetPassword(token, data.password);
    if (result.success) {
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 2500);
    } else {
      toast.error("Error", { description: result.error });
    }
  };

  if (!token) {
    return (
      <AuthCard
        icon={TriangleAlert}
        tone="danger"
        title="Invalid link"
        subtitle="This reset link is invalid or missing its token."
      >
        <Button
          asChild
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground"
        >
          <Link href="/forgot-password">Request a new reset link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        icon={CircleCheckBig}
        tone="success"
        title="Password reset!"
        subtitle="Your password has been updated. Redirecting you to sign in..."
      />
    );
  }

  return (
    <AuthCard
      icon={LockKeyhole}
      title="Reset password"
      subtitle="Choose a new password for your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <AuthInput
            {...register("password")}
            id="password"
            label="New password"
            icon={Lock}
            password
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            disabled={isSubmitting}
          />
          <PasswordStrength password={password} />
        </div>
        <AuthInput
          {...register("confirmPassword")}
          id="confirmPassword"
          label="Confirm password"
          icon={Lock}
          password
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
        />
        <SubmitButton loading={isSubmitting} loadingText="Resetting...">
          Reset password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

const Page = () => (
  <Suspense>
    <ResetPasswordForm />
  </Suspense>
);

export default Page;
