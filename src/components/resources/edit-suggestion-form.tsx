"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EDIT_TYPES = [
  { value: "correction", label: "Correction" },
  { value: "enhancement", label: "Enhancement" },
  { value: "report", label: "Report Issue" },
] as const

interface ResourceValues {
  title: string
  url: string
  description: string
}

export interface EditSuggestionFormProps {
  readonly resourceId: number
  readonly currentValues: ResourceValues
}

export function EditSuggestionForm({
  resourceId,
  currentValues,
}: EditSuggestionFormProps) {
  const [open, setOpen] = useState(false)
  const [editType, setEditType] = useState<string>("correction")
  const [title, setTitle] = useState(currentValues.title)
  const [url, setUrl] = useState(currentValues.url)
  const [description, setDescription] = useState(currentValues.description)
  const [justification, setJustification] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleOpen() {
    setTitle(currentValues.title)
    setUrl(currentValues.url)
    setDescription(currentValues.description)
    setJustification("")
    setEditType("correction")
    setError(null)
    setSuccess(false)
    setOpen(true)
  }

  function buildProposedChanges(): Record<
    string,
    { oldValue: string | null; newValue: string | null }
  > {
    const changes: Record<
      string,
      { oldValue: string | null; newValue: string | null }
    > = {}

    if (title !== currentValues.title) {
      changes.title = {
        oldValue: currentValues.title,
        newValue: title,
      }
    }

    if (url !== currentValues.url) {
      changes.url = {
        oldValue: currentValues.url,
        newValue: url,
      }
    }

    if (description !== currentValues.description) {
      changes.description = {
        oldValue: currentValues.description,
        newValue: description,
      }
    }

    return changes
  }

  async function handleSubmit() {
    const proposedChanges = buildProposedChanges()

    if (Object.keys(proposedChanges).length === 0) {
      setError("No changes detected. Please modify at least one field.")
      return
    }

    if (!justification.trim()) {
      setError("Please provide a justification for your edit.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/resources/${resourceId}/edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editType,
          proposedChanges,
          justification: justification.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit edit suggestion")
      }

      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit edit suggestion"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Pencil className="mr-2 size-4" />
        Suggest Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Suggest an Edit</DialogTitle>
            <DialogDescription>
              Propose changes to this resource. Your suggestion will be reviewed
              by an admin.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-green-600">
                Edit suggestion submitted successfully!
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                An admin will review your suggestion.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Edit Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select edit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDIT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <div className="text-muted-foreground mb-1 text-xs">
                  Current: {currentValues.title}
                </div>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Updated title"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-url">URL</Label>
                <div className="text-muted-foreground mb-1 truncate text-xs">
                  Current: {currentValues.url}
                </div>
                <Input
                  id="edit-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Updated URL"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <div className="text-muted-foreground mb-1 line-clamp-2 text-xs">
                  Current: {currentValues.description}
                </div>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Updated description"
                  rows={3}
                  maxLength={2000}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-justification">
                  Justification <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="edit-justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Why should this edit be applied?"
                  rows={2}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-muted-foreground text-xs">
                  {justification.length}/500 characters
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
