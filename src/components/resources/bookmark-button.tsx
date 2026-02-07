"use client"

import { useState } from "react"
import { Bookmark, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export interface BookmarkButtonProps {
  resourceId: number
  isBookmarked: boolean
  notes?: string
  onToggle: (resourceId: number) => void
  onSaveNotes: (resourceId: number, notes: string) => void
}

export function BookmarkButton({
  resourceId,
  isBookmarked,
  notes = "",
  onToggle,
  onSaveNotes,
}: BookmarkButtonProps) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesValue, setNotesValue] = useState(notes)

  function handleOpenNotes() {
    setNotesValue(notes)
    setNotesOpen(true)
  }

  function handleSaveNotes() {
    onSaveNotes(resourceId, notesValue)
    setNotesOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onToggle(resourceId)}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          <Bookmark
            className={`size-4 ${isBookmarked ? "fill-current text-yellow-500" : ""}`}
          />
        </Button>
        {isBookmarked && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleOpenNotes}
            aria-label="Edit bookmark notes"
          >
            <StickyNote className="text-muted-foreground size-3.5" />
          </Button>
        )}
      </div>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bookmark Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add notes about this resource..."
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNotesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
