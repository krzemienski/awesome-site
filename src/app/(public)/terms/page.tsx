import type { Metadata } from "next"
import { Container } from "@/components/layout/container"

export const metadata: Metadata = {
  title: "Terms of Service | Awesome Video Dashboard",
  description:
    "Terms of service for Awesome Video Dashboard — rules governing your use of our platform.",
  openGraph: {
    title: "Terms of Service | Awesome Video Dashboard",
    description:
      "Terms of service for Awesome Video Dashboard — rules governing your use of our platform.",
    type: "website",
    url: "/terms",
  },
}

export default function TermsOfServicePage() {
  return (
    <div className="py-12">
      <Container className="prose prose-neutral dark:prose-invert max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          Terms of Service
        </h1>
        <p className="text-muted-foreground">
          Last updated: February 2026
        </p>

        <p>
          By accessing or using Awesome Video Dashboard (&ldquo;the
          Service&rdquo;), you agree to be bound by these Terms of Service.
          If you do not agree, please do not use the Service.
        </p>

        <h2>Acceptable Use</h2>
        <p>You agree to use the Service only for lawful purposes. You may not:</p>
        <ul>
          <li>
            Submit spam, malicious links, or misleading content to the resource
            catalog.
          </li>
          <li>
            Attempt to gain unauthorized access to other user accounts or
            administrative features.
          </li>
          <li>
            Scrape or crawl the Service at a rate that degrades performance for
            other users. Automated access must respect our rate limits and
            robots.txt directives.
          </li>
          <li>
            Use the Service to distribute malware, phishing content, or any
            material that violates applicable law.
          </li>
          <li>
            Circumvent security measures including rate limiting, authentication,
            or Content Security Policy protections.
          </li>
        </ul>

        <h2>User Accounts</h2>
        <p>
          You may create an account by signing in through a supported OAuth
          provider (GitHub or Google). You are responsible for maintaining the
          security of your account credentials and for all activity that occurs
          under your account.
        </p>
        <p>
          We reserve the right to suspend or terminate accounts that violate
          these terms, at our sole discretion.
        </p>

        <h2>User-Generated Content</h2>
        <p>
          When you submit resources, edit suggestions, or other content to the
          Service, you grant us a non-exclusive, royalty-free, worldwide license
          to display, distribute, and modify that content as part of operating
          the Service.
        </p>
        <p>
          You retain ownership of your content. You represent that you have the
          right to submit any content you provide and that it does not infringe
          on any third-party rights.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          The Service&apos;s source code is open source and available on GitHub.
          The curated resource catalog, AI-generated descriptions, and site
          design are the property of Awesome Video Dashboard.
        </p>
        <p>
          External resources linked from the catalog are the property of their
          respective owners. We do not claim ownership of third-party content.
        </p>

        <h2>API Usage</h2>
        <p>
          Access to our public API is subject to rate limiting. API keys may be
          issued for programmatic access. Abuse of API endpoints, including
          exceeding rate limits or using API keys for unauthorized purposes, may
          result in key revocation and account suspension.
        </p>

        <h2>Disclaimers</h2>
        <p>
          The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis without warranties of any kind, whether express
          or implied, including but not limited to implied warranties of
          merchantability, fitness for a particular purpose, or
          non-infringement.
        </p>
        <p>
          We do not guarantee the accuracy, completeness, or reliability of any
          resource listings, descriptions, or AI-generated metadata. Links to
          external resources may become broken or lead to content that has
          changed since it was cataloged.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Awesome Video Dashboard and
          its contributors shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, including loss of data,
          revenue, or profits, arising from your use of the Service.
        </p>
        <p>
          Our total liability for any claim arising from or related to the
          Service shall not exceed the amount you paid us in the twelve months
          preceding the claim, or $0 if you have not made any payments.
        </p>

        <h2>Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Awesome Video Dashboard and
          its contributors from any claims, damages, or expenses arising from
          your use of the Service or violation of these terms.
        </p>

        <h2>Modifications</h2>
        <p>
          We reserve the right to modify these terms at any time. Material
          changes will be communicated by updating the &ldquo;Last
          updated&rdquo; date at the top of this page. Continued use of the
          Service after changes constitutes acceptance of the revised terms.
        </p>

        <h2>Governing Law</h2>
        <p>
          These terms shall be governed by and construed in accordance with the
          laws of the jurisdiction in which the Service operator resides,
          without regard to conflict of law principles.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about these terms, please open an issue on our{" "}
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
