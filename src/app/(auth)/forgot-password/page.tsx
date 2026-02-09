import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password - Awesome Video Dashboard",
  description: "Reset your Awesome Video Dashboard account password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <ForgotPasswordForm />
    </div>
  )
}
