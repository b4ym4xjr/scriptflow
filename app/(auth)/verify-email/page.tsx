import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

import { verifyEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { token } = await searchParams;

  if (!token) {
    return <Result success={false} message="No verification token provided." />;
  }

  const result = await verifyEmail(token);

  return (
    <Result
      success={result.success}
      message={
        result.success
          ? "Your email has been verified. You can now sign in."
          : (result.error ?? "Verification failed.")
      }
    />
  );
};

function Result({
  success,
  message,
}: {
  success: boolean;
  message: string;
}) {
  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                success
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {success ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {success ? "Email verified!" : "Verification failed"}
            </h1>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-600 text-sm">{message}</p>
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

export default Page;