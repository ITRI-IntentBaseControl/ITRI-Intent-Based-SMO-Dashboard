"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { register } from "../../service/signup/ExternalService/signupService";

export default function Page() {
  const router = useRouter();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData) {
    try {
      setIsSubmitting(true);
      const result = await register(formData);

      if (result.status === "user_exists") {
        toast.error("Account already exists");
      } else if (result.status === "failed") {
        toast.error("Failed to create account");
      } else if (result.status === "invalid_data") {
        toast.error("Failed validating your submission!");
      } else if (result.status === "success") {
        toast.success("Account created successfully");
        setIsSuccessful(true);
        // router.refresh() 或 router.push("/something")
        router.push("/signin");
      }
    } catch (error) {
      toast.error("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your username, email, and password
          </p>
        </div>

        {/* 注意這裡 variant="signup" */}
        <AuthForm action={handleSubmit} variant="signup">
          <SubmitButton isSuccessful={isSuccessful} isLoading={isSubmitting}>
            Sign Up
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              href="/signin"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
