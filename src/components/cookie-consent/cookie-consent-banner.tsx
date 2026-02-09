"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCookieConsent } from "./cookie-consent-context"

export function CookieConsentBanner() {
  const { consent, accept, reject } = useCookieConsent()

  if (consent !== "pending") return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <Card className="mx-auto max-w-lg flex-row items-center gap-4 py-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We use analytics cookies to understand how you use our site and
            improve your experience.
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={reject}>
              Reject
            </Button>
            <Button size="sm" onClick={accept}>
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
