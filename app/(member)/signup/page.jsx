"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { useLocale } from "@/components/LocaleProvider";
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
        toast.error(t("auth_toast.register_exists"));
      } else if (result.status === "failed") {
        toast.error(t("auth_toast.register_failed"));
      } else if (result.status === "invalid_data") {
        toast.error(t("auth_toast.register_invalid"));
      } else if (result.status === "success") {
        toast.success(t("auth_toast.register_success"));
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

  const { t } = useLocale();

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            {t("auth.signup_title")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t("auth.signup_description")}
          </p>
        </div>

        {/* 注意這裡 variant="signup" */}
        <AuthForm action={handleSubmit} variant="signup">
          <SubmitButton isSuccessful={isSuccessful} isLoading={isSubmitting}>
            {t("auth.signup_button")}
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {t("auth.have_account_prompt")}{" "}
            <Link
              href="/signin"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              {t("auth.signin_link")}
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
