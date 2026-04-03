"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, EyeOff, Eye, Loader, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/actions/auth";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");
  const passwordRequirements = [
    { label: "At least 8 characters", met: password?.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password || "") },
    { label: "One lowercase letter", met: /[a-z]/.test(password || "") },
    { label: "One number", met: /\d/.test(password || "") },
  ];

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
      <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="shadow-[0_8px_48px_rgba(0,0,0,0.10)] border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <p className="text-gray-600">Invalid or missing reset token.</p>
            <Button
              asChild
              className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl"
            >
              <Link href="/forgot-password">Request a new reset link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="shadow-[0_8px_48px_rgba(0,0,0,0.10)] border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Password reset!
              </h1>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm">
              Your password has been updated. Redirecting you to sign in...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-black/5 to-transparent rounded-bl-full" />

        <CardHeader className="space-y-1 pb-6 relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-linear-to-br from-black to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Choose a new password for your account.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={cn(
                    "pl-10 pr-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-xl",
                    errors.password &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500",
                  )}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm">
                  {errors.password.message}
                </p>
              )}
              {password && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Password requirements:
                  </p>
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle
                        className={cn(
                          "h-3 w-3",
                          req.met ? "text-green-500" : "text-gray-300",
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          req.met ? "text-green-700" : "text-gray-500",
                        )}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={cn(
                    "pl-10 pr-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-xl",
                    errors.confirmPassword &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500",
                  )}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-linear-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const Page = () => (
  <Suspense>
    <ResetPasswordForm />
  </Suspense>
);

export default Page;
