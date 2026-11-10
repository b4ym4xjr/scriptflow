import { verifyEmail } from "@/actions/auth";
import { VerifyResult } from "@/components/auth/VerifyResult";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { token } = await searchParams;

  if (!token) {
    return (
      <VerifyResult success={false} message="No verification token provided." />
    );
  }

  const result = await verifyEmail(token);

  return (
    <VerifyResult
      success={result.success}
      message={
        result.success
          ? "Your email has been verified. You can now sign in."
          : (result.error ?? "Verification failed.")
      }
    />
  );
};

export default Page;
