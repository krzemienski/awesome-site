"use client"

import type { ReactNode } from "react"
import { useCookieConsent } from "./cookie-consent-context"

export function CookieConsentGate({ children }: { children: ReactNode }) {
  const { consent } = useCookieConsent()

  if (consent !== "accepted") return null

  return <>{children}</>
}
