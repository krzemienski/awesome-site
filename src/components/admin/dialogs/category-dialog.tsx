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

interface CategoryDialogItem {
  id: number
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  displayOrder?: number
  categoryId?: number
  subcategoryId?: number
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  level: "category" | "subcategory" | "sub-subcategory"
  item?: CategoryDialogItem | null
  onSuccess: () => void
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function CategoryDialog({
  open,
  onOpenChange,
  level,
  item,
  onSuccess,
}: CategoryDialogProps) {
  const isEdit = !!item
  const { data: categories } = useCategories()

  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [icon, setIcon] = React.useState("")
  const [displayOrder, setDisplayOrder] = React.useState("0")
  const [categoryId, setCategoryId] = React.useState("")
  const [subcategoryId, setSubcategoryId] = React.useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open && item) {
      setName(item.name)
      setSlug(item.slug)
      setDescription(item.description ?? "")
      setIcon(item.icon ?? "")
      setDisplayOrder(String(item.displayOrder ?? 0))
      setCategoryId(item.categoryId ? String(item.categoryId) : "")
      setSubcategoryId(item.subcategoryId ? String(item.subcategoryId) : "")
      setSlugManuallyEdited(true)
    } else if (open) {
      setName("")
      setSlug("")
      setDescription("")
      setIcon("")
      setDisplayOrder("0")
      setCategoryId("")
      setSubcategoryId("")
      setSlugManuallyEdited(false)
    }
    setError("")
  }, [open, item])

  React.useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(slugify(name))
    }
  }, [name, slugManuallyEdited])

  const selectedCategory = categories?.find(
    (c) => c.id === Number(categoryId)
  )
  const subcategories = selectedCategory?.subcategories ?? []

  function getApiEndpoint(): string {
    switch (level) {
      case "category":
        return isEdit
          ? `/api/admin/categories/${item!.id}`
          : "/api/admin/categories"
      case "subcategory":
        return isEdit
          ? `/api/admin/subcategories/${item!.id}`
          : "/api/admin/subcategories"
      case "sub-subcategory":
        return isEdit
          ? `/api/admin/sub-subcategories/${item!.id}`
          : "/api/admin/sub-subcategories"
    }
  }

  function getLevelLabel(): string {
    switch (level) {
      case "category":
        return "Category"
      case "subcategory":
        return "Subcategory"
      case "sub-subcategory":
        return "Sub-subcategory"
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const payload: Record<string, unknown> = {
        name,
        slug,
        description: description || null,
        displayOrder: Number(displayOrder),
      }

      if (level === "category") {
        payload.icon = icon || null
      }

      if (level === "subcategory") {
        payload.categoryId = Number(categoryId)
      }

      if (level === "sub-subcategory") {
        payload.subcategoryId = Number(subcategoryId)
      }

      const res = await fetch(getApiEndpoint(), {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? `Failed to save ${getLevelLabel().toLowerCase()}`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isParentRequired =
    (level === "subcategory" && !categoryId) ||
    (level === "sub-subcategory" && !subcategoryId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${getLevelLabel()}` : `Create ${getLevelLabel()}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${getLevelLabel()} name`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              placeholder="auto-generated-from-name"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated from name. Edit to customize.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {level === "category" && (
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon</Label>
              <Input
                id="cat-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. Globe, Code, BookOpen"
              />
              <p className="text-xs text-muted-foreground">
                Lucide icon name for this category.
              </p>
            </div>
          )}

          {level === "subcategory" && (
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
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
          )}

          {level === "sub-subcategory" && (
            <>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={(val) => {
                  setCategoryId(val)
                  setSubcategoryId("")
                }}>
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
              <div className="space-y-2">
                <Label>Parent Subcategory</Label>
                <Select
                  value={subcategoryId}
                  onValueChange={setSubcategoryId}
                  disabled={!categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent subcategory" />
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
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="cat-order">Display Order</Label>
            <Input
              id="cat-order"
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>

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
            <Button
              type="submit"
              disabled={isSubmitting || !name || isParentRequired}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
