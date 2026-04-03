"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, User, Lock, EyeOff, Eye, CheckCircle } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signUp } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { signUpSchema } from "@/lib/validations";
import { Mail } from "lucide-react";

type SignupFormData = z.infer<typeof signUpSchema>;

const Page = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const passwordRequirements = [
    { label: "At least 8 characters", met: password?.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password || "") },
    { label: "One lowercase letter", met: /[a-z]/.test(password || "") },
    { label: "One number", met: /\d/.test(password || "") },
  ];

  const onSubmit = async (data: SignupFormData) => {
    const result = await signUp(data);
    if (result.success) {
      setRegisteredEmail(data.email);
      setEmailSent(true);
    } else {
      toast.error("Error", {
        description: result.error,
      });
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-linear-to-br from-black to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Check your email
              </h1>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600 text-sm">
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-gray-900">
                {registeredEmail}
              </span>
              . Click the link in the email to activate your account.
            </p>
            <p className="text-gray-500 text-xs">
              Didn&apos;t receive it? Check your spam folder.
            </p>
            <Button
              asChild
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-xl"
            >
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col justify-center space-y-6 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-sm font-medium text-gray-700 backdrop-blur-sm">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              Join thousands of users
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Start your journey{" "}
              <span className="bg-linear-to-r from-black to-gray-600 bg-clip-text text-transparent">
                today
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Create your free account and experience the power of organized
              task management. Get started in seconds.
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Easy Setup</h3>
              <p className="text-sm text-gray-600">Get started in minutes</p>
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure</h3>
              <p className="text-sm text-gray-600">Your data is protected</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-linear-to-br from-black/5 to-black/10 backdrop-blur-sm rounded-2xl border border-gray-200/50">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-400 to-gray-600 border-2 border-white"></div>
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-500 to-gray-700 border-2 border-white"></div>
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-600 to-gray-800 border-2 border-white"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Trusted by teams worldwide
                </p>
                <p className="text-xs text-gray-600">
                  Join our growing community
                </p>
              </div>
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Join ScriptFlow
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Create your account to start planning
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...register("name")}
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className={cn(
                        "pl-10 h-12 border-gray-200 focus:border-black focus:ring-black rounded-xl",
                        errors.name &&
                          "border-red-300 focus:border-red-500 focus:ring-red-500",
                      )}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-600 text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

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
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
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
                      type={showConfirmPassword ? "text" : "password"}
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
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
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <Separator />

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="text-black hover:text-gray-700 font-medium transition-colors"
                  >
                    Sign in
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
