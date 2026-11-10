"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clapperboard, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { signInWithCredentials } from "@/actions/auth";
import {
  AuthCard,
  AuthHero,
  AuthInput,
  SubmitButton,
} from "@/components/auth/AuthKit";
import { Separator } from "@/components/ui/separator";
import { signInSchema } from "@/lib/validations";

type SignInFormData = z.infer<typeof signInSchema>;

const Page = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInFormData) => {
    const result = await signInWithCredentials(data);
    if (result.success) {
      router.push("/");
    } else {
      toast.error("Error", { description: result.error });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
      <AuthHero
        badge="Script to screen, in flow"
        title="Welcome back to"
        accent="ScriptFlow"
        text="Pick up where you left off — your scripts, your pipeline and your team are right where you left them."
      />

      <AuthCard
        icon={Clapperboard}
        title="Welcome back"
        subtitle="Sign in to your account"
        className="lg:mx-0 lg:ml-auto"
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
          <AuthInput
            {...register("password")}
            id="password"
            label="Password"
            icon={Lock}
            password
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <SubmitButton loading={isSubmitting} loadingText="Signing in...">
            Sign in
          </SubmitButton>
        </form>
        <Separator />
        <p className="text-center text-sm text-muted-foreground">
          Don&#39;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary transition-opacity hover:opacity-80"
          >
            Create an account
          </Link>
        </p>
      </AuthCard>
    </div>
  );
};
export default Page;
