import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create Account - Awesome Video Dashboard",
  description: "Create your free Awesome Video Dashboard account",
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <RegisterForm />
    </div>
  )
}
