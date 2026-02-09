import type { Metadata } from "next"
import { Container } from "@/components/layout/container"

export const metadata: Metadata = {
  title: "Privacy Policy | Awesome Video Dashboard",
  description:
    "Privacy policy for Awesome Video Dashboard — learn how we collect, use, and protect your data.",
  openGraph: {
    title: "Privacy Policy | Awesome Video Dashboard",
    description:
      "Privacy policy for Awesome Video Dashboard — learn how we collect, use, and protect your data.",
    type: "website",
    url: "/privacy",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12">
      <Container className="prose prose-neutral dark:prose-invert max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground">
          Last updated: February 2026
        </p>

        <p>
          Awesome Video Dashboard (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;) respects your privacy. This policy explains what
          data we collect, how we use it, and your rights regarding that data.
        </p>

        <h2>Data We Collect</h2>
        <p>We collect the following categories of information:</p>
        <ul>
          <li>
            <strong>Account information</strong> &mdash; When you sign in via
            GitHub or Google OAuth, we receive your name, email address, and
            profile picture from the provider. We store this to identify your
            account.
          </li>
          <li>
            <strong>Usage data</strong> &mdash; We record page views and
            resource interactions (e.g. view history) to improve the experience
            and surface relevant content.
          </li>
          <li>
            <strong>User-generated content</strong> &mdash; Resource
            submissions, edit suggestions, favorites, and bookmarks you create
            are stored in our database.
          </li>
          <li>
            <strong>Technical data</strong> &mdash; IP addresses, browser type,
            and device information collected automatically by our hosting
            provider and error tracking service.
          </li>
        </ul>

        <h2>How We Use Your Data</h2>
        <ul>
          <li>Provide and maintain the service</li>
          <li>Authenticate your identity and manage your account</li>
          <li>Display personalized content such as favorites and view history</li>
          <li>Monitor application health and debug errors</li>
          <li>Generate aggregated, anonymous analytics to improve the site</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use cookies and similar technologies for the following purposes:
        </p>
        <ul>
          <li>
            <strong>Essential cookies</strong> &mdash; Session authentication
            and security tokens. These are required for the site to function.
          </li>
          <li>
            <strong>Analytics cookies</strong> &mdash; If you consent, we use
            Vercel Analytics and Speed Insights to understand how the site is
            used. These cookies are only set after you accept non-essential
            cookies via our consent banner.
          </li>
          <li>
            <strong>Preference cookies</strong> &mdash; Theme selection and
            cookie consent state stored in your browser&apos;s localStorage.
          </li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>We use the following third-party services that may process your data:</p>
        <ul>
          <li>
            <strong>Vercel</strong> &mdash; Hosting, edge network, analytics,
            and speed insights.
          </li>
          <li>
            <strong>Sentry</strong> &mdash; Error tracking and performance
            monitoring. Sentry receives error reports that may include request
            metadata and stack traces.
          </li>
          <li>
            <strong>Neon</strong> &mdash; Serverless PostgreSQL database
            hosting. All application data is stored in Neon-managed databases.
          </li>
          <li>
            <strong>Upstash</strong> &mdash; Redis-based rate limiting. IP
            addresses are temporarily stored to enforce rate limits.
          </li>
          <li>
            <strong>GitHub / Google</strong> &mdash; OAuth authentication
            providers. We only receive the profile data you authorize.
          </li>
        </ul>

        <h2>Data Retention</h2>
        <ul>
          <li>
            <strong>Account data</strong> is retained for as long as your
            account exists.
          </li>
          <li>
            <strong>View history</strong> is automatically deleted after 90 days.
          </li>
          <li>
            <strong>Rate limiting data</strong> expires within minutes and is
            not permanently stored.
          </li>
          <li>
            <strong>Error reports</strong> in Sentry are retained per
            Sentry&apos;s default retention policy (typically 90 days).
          </li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> the personal data we hold about you.
          </li>
          <li>
            <strong>Correct</strong> inaccurate personal data.
          </li>
          <li>
            <strong>Delete</strong> your account and associated data.
          </li>
          <li>
            <strong>Withdraw consent</strong> for non-essential cookies at any
            time by clearing your browser&apos;s localStorage.
          </li>
          <li>
            <strong>Export</strong> your data in a portable format upon request.
          </li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement industry-standard security measures including encrypted
          connections (HTTPS), nonce-based Content Security Policy headers,
          rate limiting on authentication endpoints, and parameterized database
          queries to prevent injection attacks.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. Material changes
          will be communicated by updating the &ldquo;Last updated&rdquo; date
          at the top of this page.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this privacy policy or your personal data,
          please open an issue on our{" "}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            GitHub repository
          </a>
          .
        </p>
      </Container>
    </div>
  )
}
