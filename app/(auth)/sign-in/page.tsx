"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, EyeOff, Eye, Loader } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signInWithCredentials } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { signInSchema } from "@/lib/validations";

type SignInFormData = z.infer<typeof signInSchema>;

const Page = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    const result = await signInWithCredentials(data);
    if (result.success) {
      router.push("/");
    } else {
      toast.error("Error", {
        description: result.error,
      });
    }
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col justify-center space-y-6 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-sm font-medium text-gray-700 backdrop-blur-sm">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              Task Management Platform
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Welcome back to{" "}
              <span className="bg-linear-to-r from-black to-gray-600 bg-clip-text text-transparent">
                ScriptFlow
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Organize your tasks, boost productivity, and achieve your goals
              with our intuitive planning platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Rich Editor</h3>
              <p className="text-sm text-gray-600">
                Create detailed tasks with formatting
              </p>
            </div>
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Stay Organized
              </h3>
              <p className="text-sm text-gray-600">
                Track progress effortlessly
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-shadow duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-black/5 to-transparent rounded-bl-full"></div>
            <CardHeader className="space-y-1 pb-6 relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-linear-to-br from-black to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Welcome to ScriptFlow
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Sign in to your account
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...register("email")}
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className={cn(
                        "pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-xl",
                        errors.email &&
                          "border-red-300 focus:border-red-500 focus:ring-red-500",
                      )}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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
                </div>
                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-linear-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
              <Separator />
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don&#39;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="text-black hover:text-gray-700 font-medium transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
export default Page;
