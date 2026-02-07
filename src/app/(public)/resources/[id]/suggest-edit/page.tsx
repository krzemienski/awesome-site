"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().min(1, "Description is required"),
  editType: z.enum(["correction", "enhancement", "report"]),
  justification: z
    .string()
    .min(1, "Justification is required")
    .max(500, "Justification must be 500 characters or less"),
})

type FormValues = z.infer<typeof formSchema>

interface ResourceData {
  id: number
  title: string
  url: string
  description: string
}

export default function SuggestEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const resourceId = Number(params.id)

  const [resource, setResource] = useState<ResourceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      editType: "correction",
      justification: "",
    },
  })

  useEffect(() => {
    async function fetchResource() {
      try {
        const res = await fetch(`/api/resources/${resourceId}`)
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/resources")
            return
          }
          throw new Error("Failed to fetch resource")
        }
        const json = await res.json()
        const data = json.data as ResourceData
        setResource(data)
        form.reset({
          title: data.title,
          url: data.url,
          description: data.description,
          editType: "correction",
          justification: "",
        })
      } catch {
        toast.error("Failed to load resource")
        router.push("/resources")
      } finally {
        setLoading(false)
      }
    }

    fetchResource()
  }, [resourceId, router, form])

  async function onSubmit(values: FormValues) {
    if (!resource) return

    const proposedChanges: Record<
      string,
      { oldValue: string | null; newValue: string | null }
    > = {}

    if (values.title !== resource.title) {
      proposedChanges.title = {
        oldValue: resource.title,
        newValue: values.title,
      }
    }
    if (values.url !== resource.url) {
      proposedChanges.url = { oldValue: resource.url, newValue: values.url }
    }
    if (values.description !== resource.description) {
      proposedChanges.description = {
        oldValue: resource.description,
        newValue: values.description,
      }
    }

    if (Object.keys(proposedChanges).length === 0) {
      toast.error("No changes detected. Modify at least one field.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/resources/${resourceId}/edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editType: values.editType,
          proposedChanges,
          justification: values.justification,
        }),
      })

      if (res.status === 401) {
        router.push(
          `/login?callbackUrl=/resources/${resourceId}/suggest-edit`
        )
        return
      }

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to submit edit suggestion")
      }

      toast.success("Edit suggestion submitted for review!")
      router.push(`/resources/${resourceId}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit edit"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex max-w-2xl items-center justify-center px-4 py-16">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  if (!resource) return null

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/resources/${resourceId}`)}
      >
        <ArrowLeft className="mr-1.5 size-4" />
        Back to resource
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Suggest an Edit</CardTitle>
          <p className="text-muted-foreground text-sm">
            Propose changes to &ldquo;{resource.title}&rdquo;. An admin will
            review your suggestion.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" {...form.register("url")} />
              {form.formState.errors.url && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                className="resize-none"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editType">Edit Type</Label>
              <Select
                value={form.watch("editType")}
                onValueChange={(v) =>
                  form.setValue(
                    "editType",
                    v as "correction" | "enhancement" | "report"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="enhancement">Enhancement</SelectItem>
                  <SelectItem value="report">Report Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justification</Label>
              <Textarea
                id="justification"
                rows={3}
                placeholder="Why should this change be made?"
                className="resize-none"
                {...form.register("justification")}
              />
              {form.formState.errors.justification && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.justification.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                {form.watch("justification")?.length ?? 0}/500 characters
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                Submit Suggestion
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/resources/${resourceId}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
