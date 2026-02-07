"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface JourneyFormData {
  readonly id?: number
  readonly title: string
  readonly description: string
  readonly difficulty: string
  readonly category: string
  readonly estimatedDuration: string
  readonly status?: string
}

interface JourneyDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly journey?: JourneyFormData | null
  readonly onSubmit: (data: JourneyFormData) => void
  readonly isLoading?: boolean
}

export function JourneyDialog({
  open,
  onOpenChange,
  journey,
  onSubmit,
  isLoading = false,
}: JourneyDialogProps) {
  const isEdit = !!journey?.id

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [difficulty, setDifficulty] = React.useState("beginner")
  const [category, setCategory] = React.useState("")
  const [estimatedDuration, setEstimatedDuration] = React.useState("")
  const [status, setStatus] = React.useState("draft")

  React.useEffect(() => {
    if (open && journey) {
      setTitle(journey.title)
      setDescription(journey.description)
      setDifficulty(journey.difficulty)
      setCategory(journey.category)
      setEstimatedDuration(journey.estimatedDuration || "")
      setStatus(journey.status ?? "draft")
    } else if (open) {
      setTitle("")
      setDescription("")
      setDifficulty("beginner")
      setCategory("")
      setEstimatedDuration("")
      setStatus("draft")
    }
  }, [open, journey])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...(isEdit && journey?.id ? { id: journey.id } : {}),
      title,
      description,
      difficulty,
      category,
      estimatedDuration,
      ...(isEdit ? { status } : {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Journey" : "Create Journey"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update journey details."
              : "Create a new learning journey. It will start as a draft."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="journey-title">Title</Label>
            <Input
              id="journey-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Journey title"
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="journey-desc">Description</Label>
            <Textarea
              id="journey-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this learning journey..."
              required
              minLength={10}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journey-difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="journey-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="journey-category">Category</Label>
              <Input
                id="journey-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Web Development"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="journey-duration">
              Estimated Duration (optional)
            </Label>
            <Input
              id="journey-duration"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="e.g. 2 hours, 1 week"
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="journey-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="journey-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Journey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
