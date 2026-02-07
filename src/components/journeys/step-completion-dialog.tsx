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

interface StepCompletionDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly stepId: number | null
  readonly journeyId: number
  readonly onSubmit: (data: {
    stepId: number
    rating?: number
    timeSpent?: number
    notes?: string
  }) => void
  readonly isLoading?: boolean
}

export function StepCompletionDialog({
  open,
  onOpenChange,
  stepId,
  journeyId: _journeyId,
  onSubmit,
  isLoading = false,
}: StepCompletionDialogProps) {
  const [rating, setRating] = React.useState<string>("")
  const [timeSpent, setTimeSpent] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setRating("")
      setTimeSpent("")
      setNotes("")
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (stepId === null) return

    onSubmit({
      stepId,
      rating: rating ? Number(rating) : undefined,
      timeSpent: timeSpent ? Number(timeSpent) : undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Step</DialogTitle>
          <DialogDescription>
            Optional: Rate this step and share your experience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="step-rating">Rating (1-5)</Label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger id="step-rating">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((val) => (
                  <SelectItem key={val} value={String(val)}>
                    {val} star{val > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-time">Time Spent (minutes)</Label>
            <Input
              id="step-time"
              type="number"
              min={1}
              placeholder="e.g. 30"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-notes">Notes</Label>
            <Textarea
              id="step-notes"
              placeholder="Any thoughts or takeaways..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

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
              Complete Step
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
