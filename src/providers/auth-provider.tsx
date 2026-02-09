"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSession } from "@/lib/auth-client"

interface AuthUser {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly image: string | null | undefined
  readonly role: string | undefined
}

interface AuthSession {
  readonly user: AuthUser | null
  readonly isPending: boolean
  readonly error: Error | null
}

const AuthContext = createContext<AuthSession>({
  user: null,
  isPending: true,
  error: null,
})

interface AuthProviderProps {
  readonly children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending, error } = useSession()

  const value: AuthSession = {
    user: session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as Record<string, unknown>).role as string | undefined,
        }
      : null,
    isPending,
    error: error ?? null,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthSession {
  return useContext(AuthContext)
}
