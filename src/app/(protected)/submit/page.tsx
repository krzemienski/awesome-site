import type { Metadata } from "next"
import { SubmissionForm } from "@/components/resources/submission-form"

export const metadata: Metadata = {
  title: "Submit Resource | Awesome Video Dashboard",
  description: "Share a resource with the community.",
  openGraph: {
    title: "Submit Resource | Awesome Video Dashboard",
    description: "Share a resource with the community.",
  },
}

export default function SubmitPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Submit a Resource</h1>
      <p className="mb-8 text-muted-foreground">
        Share a resource with the community. Your submission will be reviewed
        before being published.
      </p>
      <SubmissionForm />
    </div>
  )
}
