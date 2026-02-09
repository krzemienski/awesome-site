"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

type ConsentStatus = "pending" | "accepted" | "rejected"

interface CookieConsentContextValue {
  readonly consent: ConsentStatus
  readonly accept: () => void
  readonly reject: () => void
}

const STORAGE_KEY = "cookie-consent"

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
)

function readStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") return "pending"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "accepted" || stored === "rejected") return stored
  return "pending"
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentStatus>("pending")

  useEffect(() => {
    setConsent(readStoredConsent())
  }, [])

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setConsent("accepted")
  }, [])

  const reject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "rejected")
    setConsent("rejected")
  }, [])

  return (
    <CookieConsentContext value={{ consent, accept, reject }}>
      {children}
    </CookieConsentContext>
  )
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider"
    )
  }
  return context
}
