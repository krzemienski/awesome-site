import type { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { JetBrains_Mono, Inter } from "next/font/google"
import { ThemeScript } from "@/components/theme/theme-script"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { VariationScript } from "@/components/variation/variation-script"
import { VariationProvider } from "@/components/variation/variation-provider"
import { VariationSwitcher } from "@/components/variation/variation-switcher"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { QueryProvider } from "@/providers/query-provider"
import { AuthProvider } from "@/providers/auth-provider"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Awesome Video Dashboard",
    template: "%s | Awesome Video Dashboard",
  },
  description:
    "Curated collection of video streaming and development resources",
  openGraph: {
    title: "Awesome Video Dashboard",
    description:
      "Curated collection of video streaming and development resources",
    type: "website",
    locale: "en_US",
    siteName: "Awesome Video Dashboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Awesome Video Dashboard",
    description:
      "Curated collection of video streaming and development resources",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const nonce = headersList.get("x-nonce") ?? undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript nonce={nonce} />
        <VariationScript nonce={nonce} />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${inter.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <Suspense>
                <VariationProvider>
                  <main className="min-h-screen">{children}</main>
                  <VariationSwitcher />
                  <Toaster />
                  <Analytics />
                  <SpeedInsights />
                </VariationProvider>
              </Suspense>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
