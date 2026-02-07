"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { Loader2 } from "lucide-react"
import { useCategories } from "@/hooks/use-categories"

interface ResourceDialogResource {
  id: number
  title: string
  url: string
  description: string
  categoryId: number
  subcategoryId?: number | null
  subSubcategoryId?: number | null
  status: string
}

interface ResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: ResourceDialogResource | null
  onSuccess: () => void
}

export function ResourceDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: ResourceDialogProps) {
  const isEdit = !!resource
  const { data: categories } = useCategories()

  const [title, setTitle] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [subcategoryId, setSubcategoryId] = React.useState("")
  const [subSubcategoryId, setSubSubcategoryId] = React.useState("")
  const [status, setStatus] = React.useState("approved")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open && resource) {
      setTitle(resource.title)
      setUrl(resource.url)
      setDescription(resource.description)
      setCategoryId(String(resource.categoryId))
      setSubcategoryId(
        resource.subcategoryId ? String(resource.subcategoryId) : ""
      )
      setSubSubcategoryId(
        resource.subSubcategoryId ? String(resource.subSubcategoryId) : ""
      )
      setStatus(resource.status)
    } else if (open) {
      setTitle("")
      setUrl("")
      setDescription("")
      setCategoryId("")
      setSubcategoryId("")
      setSubSubcategoryId("")
      setStatus("approved")
    }
    setError("")
  }, [open, resource])

  const selectedCategory = categories?.find(
    (c) => c.id === Number(categoryId)
  )
  const subcategories = selectedCategory?.subcategories ?? []
  const selectedSubcategory = subcategories.find(
    (s) => s.id === Number(subcategoryId)
  )
  const subSubcategories = selectedSubcategory?.subSubcategories ?? []

  React.useEffect(() => {
    setSubcategoryId("")
    setSubSubcategoryId("")
  }, [categoryId])

  React.useEffect(() => {
    setSubSubcategoryId("")
  }, [subcategoryId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const payload: Record<string, unknown> = {
        title,
        url,
        description,
        categoryId: Number(categoryId),
        subcategoryId: subcategoryId ? Number(subcategoryId) : null,
        subSubcategoryId: subSubcategoryId
          ? Number(subSubcategoryId)
          : null,
      }

      if (isEdit) {
        payload.status = status
      }

      const endpoint = isEdit
        ? `/api/admin/resources/${resource.id}`
        : "/api/admin/resources"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to save resource")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Resource" : "Create Resource"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="res-title">Title</Label>
            <Input
              id="res-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-url">URL</Label>
            <Input
              id="res-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-desc">Description</Label>
            <Textarea
              id="res-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resource description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={String(sub.id)}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {subSubcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Sub-subcategory</Label>
              <Select
                value={subSubcategoryId}
                onValueChange={setSubSubcategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subSubcategories.map((ss) => (
                    <SelectItem key={ss.id} value={String(ss.id)}>
                      {ss.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !categoryId}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
