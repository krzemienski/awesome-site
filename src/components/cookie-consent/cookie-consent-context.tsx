"use client"

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
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

const listeners = new Set<() => void>()

function getSnapshot(): ConsentStatus {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "accepted" || stored === "rejected") return stored
  return "pending"
}

function getServerSnapshot(): ConsentStatus {
  return "pending"
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "accepted")
    notifyListeners()
  }, [])

  const reject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "rejected")
    notifyListeners()
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
