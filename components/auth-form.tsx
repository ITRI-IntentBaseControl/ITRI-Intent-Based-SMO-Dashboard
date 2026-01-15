"use client";
import Form from "next/form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLocale } from "@/components/LocaleProvider";

export function AuthForm({
  action,
  children,
  variant = "signin", // signin 或 signup
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  variant?: "signin" | "signup";
}) {
  const { t } = useLocale();
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      {variant === "signin" ? (
        <>
          {/* Sign In：需要 username + password */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="username"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {t("auth.username")}
            </Label>
            <Input
              id="username"
              name="username"
              className="bg-muted text-md md:text-sm"
              type="text"
              placeholder={t("auth.user_placeholder")}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {t("auth.password")}
            </Label>
            <Input
              id="password"
              name="password"
              className="bg-muted text-md md:text-sm"
              type="password"
              required
            />
          </div>
        </>
      ) : (
        <>
          {/* Sign Up：需要 username + email + password */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="username"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {useLocale().t("auth.username")}
            </Label>
            <Input
              id="username"
              name="username"
              className="bg-muted text-md md:text-sm"
              type="text"
              placeholder={t("auth.user_placeholder")}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {t("auth.email")}
            </Label>
            <Input
              id="email"
              name="email"
              className="bg-muted text-md md:text-sm"
              type="email"
              placeholder={t("auth.email_placeholder")}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-zinc-600 font-normal dark:text-zinc-400"
            >
              {t("auth.password")}
            </Label>
            <Input
              id="password"
              name="password"
              className="bg-muted text-md md:text-sm"
              type="password"
              required
            />
          </div>
        </>
      )}

      {children}
    </Form>
  );
}
