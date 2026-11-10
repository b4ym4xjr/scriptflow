"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, MailCheck, User, UserPlus } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { signUp } from "@/actions/auth";
import {
  AuthCard,
  AuthHero,
  AuthInput,
  PasswordStrength,
  SubmitButton,
} from "@/components/auth/AuthKit";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signUpSchema } from "@/lib/validations";

type SignupFormData = z.infer<typeof signUpSchema>;

const Page = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    const result = await signUp(data);
    if (result.success) {
      setRegisteredEmail(data.email);
      setEmailSent(true);
    } else {
      toast.error("Error", { description: result.error });
    }
  };

  if (emailSent) {
    return (
      <AuthCard
        icon={MailCheck}
        tone="success"
        title="Check your email"
        subtitle={
          <>
            We&apos;ve sent a verification link to{" "}
            <span className="font-medium text-foreground">
              {registeredEmail}
            </span>
            . Click it to activate your account.
          </>
        }
      >
        <p className="text-center text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <Button
          asChild
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground"
        >
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
      <AuthHero
        badge="Free for creators"
        title="Ship your next video"
        accent="faster"
        text="Write, review and track every script from first draft to published — with your whole crew in the loop."
      />

      <AuthCard
        icon={UserPlus}
        title="Join ScriptFlow"
        subtitle="Create your account to start writing"
        className="lg:mx-0 lg:ml-auto"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthInput
            {...register("name")}
            id="name"
            label="Name"
            icon={User}
            autoComplete="name"
            placeholder="Your full name"
            error={errors.name?.message}
            disabled={isSubmitting}
          />
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
          <div className="space-y-2">
            <AuthInput
              {...register("password")}
              id="password"
              label="Password"
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
          <SubmitButton loading={isSubmitting} loadingText="Creating account...">
            Create account
          </SubmitButton>
        </form>
        <Separator />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </div>
  );
};

export default Page;
