"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader, CheckCircle } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/actions/auth";
import { cn } from "@/lib/utils";

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
      <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Check your inbox
              </h1>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600 text-sm">
              If that email is registered, we&apos;ve sent a password reset
              link. Check your inbox and follow the instructions.
            </p>
            <Button
              asChild
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-xl"
            >
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-[0_8px_48px_rgba(0,0,0,0.10)] border-0 bg-white/95 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-black/5 to-transparent rounded-bl-full" />

        <CardHeader className="space-y-1 pb-6 relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-linear-to-br from-black to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we&apos;ll send you a reset link.
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
                <p className="text-red-600 text-sm">{errors.email.message}</p>
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
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/sign-in"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
