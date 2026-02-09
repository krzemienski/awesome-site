"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { Github, Loader2, Lock, Mail, Terminal } from "lucide-react"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})
  const [serverError, setServerError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  function handleChange(field: keyof LoginFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")

    const result = loginSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormData
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const { error } = await signIn.email({
        email: result.data.email,
        password: result.data.password,
      })

      if (error) {
        setServerError(error.message ?? "Invalid email or password")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    setOauthLoading(provider)
    setServerError("")
    try {
      await signIn.social({ provider, callbackURL: "/" })
    } catch {
      setServerError(`Failed to sign in with ${provider}. Please try again.`)
      setOauthLoading(null)
    }
  }

  const isDisabled = isLoading || oauthLoading !== null

  return (
    <Card className="w-full max-w-md border-border">
      <CardHeader className="flex flex-col items-center gap-3 text-center">
        <Terminal className="size-8 text-primary" />
        <h1 className="text-2xl font-bold font-heading text-primary tracking-wider">
          AWESOME LISTS
        </h1>
        <p className="text-sm text-muted-foreground font-heading">
          {"// Jack into the network."}
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              className="flex items-center gap-2 font-heading text-xs uppercase tracking-wider"
            >
              <Mail className="size-3" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
              disabled={isDisabled}
              className="font-heading text-sm"
            />
            {errors.email && (
              <p className="text-destructive text-xs font-heading">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="flex items-center gap-2 font-heading text-xs uppercase tracking-wider"
            >
              <Lock className="size-3" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              aria-invalid={!!errors.password}
              disabled={isDisabled}
              className="font-heading text-sm"
            />
            {errors.password && (
              <p className="text-destructive text-xs font-heading">{errors.password}</p>
            )}
          </div>

          {serverError && (
            <div className="border border-destructive/50 bg-destructive/10 text-destructive p-3 text-xs font-heading">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full font-heading text-sm uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Authenticating...
              </>
            ) : (
              "[ Sign In ] >"
            )}
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs font-heading">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-accent/50 font-heading text-sm uppercase tracking-wider hover:border-accent"
            onClick={() => handleOAuth("github")}
            disabled={isDisabled}
          >
            {oauthLoading === "github" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Github />
            )}
            Continue with GitHub
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Link
          href="/forgot-password"
          className="text-accent text-xs font-heading uppercase tracking-wider hover:text-accent/80 transition-colors"
        >
          &lt; Forgot_Password?
        </Link>
        <Link
          href="/register"
          className="text-accent text-xs font-heading uppercase tracking-wider hover:text-accent/80 transition-colors"
        >
          Sign_Up &gt;
        </Link>
      </CardFooter>
    </Card>
  )
}
