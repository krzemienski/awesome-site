import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign In - AVD_SYS",
  description: "Jack into the network. Sign in to your AVD_SYS account.",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
      <LoginForm />
      <p className="mt-8 font-heading text-xs text-green-500">
        System Status: Online // v.1.0.0
      </p>
    </div>
  )
}
