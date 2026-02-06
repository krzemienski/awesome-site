"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCategories } from "@/hooks/use-categories"
import { submitResourceSchema } from "@/features/resources/resource-schemas"
import type {
  CategoryWithChildren,
  SubcategoryWithChildren,
  SubSubcategoryWithCount,
} from "@/features/categories/category-types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  Sparkles,
  Tag,
  X,
} from "lucide-react"

interface FormData {
  readonly url: string
  readonly title: string
  readonly categoryId: number | null
  readonly subcategoryId: number | null
  readonly subSubcategoryId: number | null
  readonly tags: readonly string[]
  readonly description: string
}

interface UrlCheckResult {
  readonly exists: boolean
  readonly message?: string
}

const INITIAL_FORM_DATA: FormData = {
  url: "",
  title: "",
  categoryId: null,
  subcategoryId: null,
  subSubcategoryId: null,
  tags: [],
  description: "",
}

const TOTAL_STEPS = 4

export function SubmissionForm() {
  const router = useRouter()
  const { data: categories, isLoading: categoriesLoading } = useCategories()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [tagInput, setTagInput] = useState("")
  const [urlCheck, setUrlCheck] = useState<UrlCheckResult | null>(null)
  const [urlChecking, setUrlChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    []
  )

  const checkUrl = useCallback(async () => {
    if (!formData.url) return

    try {
      new URL(formData.url)
    } catch {
      setUrlCheck({ exists: false, message: "Invalid URL format" })
      return
    }

    setUrlChecking(true)
    setUrlCheck(null)

    try {
      const res = await fetch(
        `/api/resources/check-url?url=${encodeURIComponent(formData.url)}`
      )
      const json = await res.json()

      if (json.data?.exists) {
        setUrlCheck({ exists: true, message: "This URL already exists in the database" })
      } else {
        setUrlCheck({ exists: false, message: "URL is available" })
      }
    } catch {
      setUrlCheck({ exists: false, message: "Could not verify URL" })
    } finally {
      setUrlChecking(false)
    }
  }, [formData.url])

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (formData.tags.length >= 20) return
    if (formData.tags.includes(trimmed)) {
      setTagInput("")
      return
    }

    updateField("tags", [...formData.tags, trimmed])
    setTagInput("")
  }, [tagInput, formData.tags, updateField])

  const removeTag = useCallback(
    (tag: string) => {
      updateField(
        "tags",
        formData.tags.filter((t) => t !== tag)
      )
    },
    [formData.tags, updateField]
  )

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        addTag()
      }
    },
    [addTag]
  )

  const selectedCategory = categories?.find(
    (c) => c.id === formData.categoryId
  ) as CategoryWithChildren | undefined

  const selectedSubcategory = selectedCategory?.subcategories?.find(
    (s) => s.id === formData.subcategoryId
  ) as SubcategoryWithChildren | undefined

  const selectedSubSubcategory = selectedSubcategory?.subSubcategories?.find(
    (ss) => ss.id === formData.subSubcategoryId
  ) as SubSubcategoryWithCount | undefined

  const validateStep = useCallback(
    (currentStep: number): boolean => {
      const errors: Record<string, string> = {}

      if (currentStep === 1) {
        if (!formData.url) errors.url = "URL is required"
        else {
          try {
            new URL(formData.url)
          } catch {
            errors.url = "Must be a valid URL"
          }
        }
        if (!formData.title) errors.title = "Title is required"
        else if (formData.title.length > 200)
          errors.title = "Title must be 200 characters or less"
        if (urlCheck?.exists) errors.url = "This URL already exists"
      }

      if (currentStep === 2) {
        if (!formData.categoryId) errors.categoryId = "Category is required"
      }

      if (currentStep === 3) {
        if (!formData.description) errors.description = "Description is required"
        else if (formData.description.length > 2000)
          errors.description = "Description must be 2000 characters or less"
      }

      setFieldErrors(errors)
      return Object.keys(errors).length === 0
    },
    [formData, urlCheck]
  )

  const goNext = useCallback(() => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS))
    }
  }, [step, validateStep])

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) {
      setStep(3)
      return
    }

    const payload = {
      url: formData.url,
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      subSubcategoryId: formData.subSubcategoryId,
      tags: formData.tags.length > 0 ? [...formData.tags] : undefined,
    }

    const parseResult = submitResourceSchema.safeParse(payload)
    if (!parseResult.success) {
      const errors: Record<string, string> = {}
      for (const issue of parseResult.error.issues) {
        const field = issue.path.join(".")
        errors[field] = issue.message
      }
      setFieldErrors(errors)
      setSubmitError("Please fix the errors above")
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.data),
      })

      const json = await res.json()

      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to submit resource")
        return
      }

      router.push("/resources")
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [formData, validateStep, router])

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Resource URL & Title
            </CardTitle>
            <CardDescription>
              Enter the URL and title for the resource you want to submit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/resource"
                  value={formData.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  onBlur={checkUrl}
                  className={fieldErrors.url ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={checkUrl}
                  disabled={urlChecking || !formData.url}
                >
                  {urlChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </Button>
              </div>
              {fieldErrors.url && (
                <p className="text-sm text-destructive">{fieldErrors.url}</p>
              )}
              {urlCheck && !fieldErrors.url && (
                <p
                  className={`text-sm ${
                    urlCheck.exists ? "text-destructive" : "text-green-600"
                  }`}
                >
                  {urlCheck.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Resource title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                maxLength={200}
                className={fieldErrors.title ? "border-destructive" : ""}
              />
              {fieldErrors.title && (
                <p className="text-sm text-destructive">{fieldErrors.title}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 characters
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full opacity-50"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with AI (coming soon)
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Selection</CardTitle>
            <CardDescription>
              Choose the most appropriate category for this resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoriesLoading ? (
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.categoryId?.toString() ?? ""}
                    onValueChange={(val) => {
                      const id = parseInt(val, 10)
                      updateField("categoryId", id)
                      updateField("subcategoryId", null)
                      updateField("subSubcategoryId", null)
                    }}
                  >
                    <SelectTrigger
                      className={fieldErrors.categoryId ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.icon ? `${cat.icon} ` : ""}
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.categoryId && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.categoryId}
                    </p>
                  )}
                </div>

                {selectedCategory &&
                  selectedCategory.subcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Subcategory (optional)</Label>
                      <Select
                        value={formData.subcategoryId?.toString() ?? ""}
                        onValueChange={(val) => {
                          const id = parseInt(val, 10)
                          updateField("subcategoryId", id)
                          updateField("subSubcategoryId", null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategory.subcategories.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {selectedSubcategory &&
                  selectedSubcategory.subSubcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Sub-subcategory (optional)</Label>
                      <Select
                        value={formData.subSubcategoryId?.toString() ?? ""}
                        onValueChange={(val) => {
                          const id = parseInt(val, 10)
                          updateField("subSubcategoryId", id)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sub-subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedSubcategory.subSubcategories.map((subsub) => (
                            <SelectItem
                              key={subsub.id}
                              value={subsub.id.toString()}
                            >
                              {subsub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags & Description
            </CardTitle>
            <CardDescription>
              Add tags and a description for the resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Type a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  maxLength={50}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!tagInput.trim() || formData.tags.length >= 20}
                >
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.tags.length}/20 tags. Press Enter or comma to add.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this resource is about..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                maxLength={2000}
                rows={6}
                className={fieldErrors.description ? "border-destructive" : ""}
              />
              {fieldErrors.description && (
                <p className="text-sm text-destructive">
                  {fieldErrors.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/2000 characters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Review & Submit
            </CardTitle>
            <CardDescription>
              Review your submission before sending it for approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReviewField label="URL" value={formData.url} />
            <ReviewField label="Title" value={formData.title} />
            <ReviewField
              label="Category"
              value={selectedCategory?.name ?? "Not selected"}
            />
            {selectedSubcategory && (
              <ReviewField label="Subcategory" value={selectedSubcategory.name} />
            )}
            {selectedSubSubcategory && (
              <ReviewField
                label="Sub-subcategory"
                value={selectedSubSubcategory.name}
              />
            )}
            {formData.tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm">{formData.description}</p>
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {step < TOTAL_STEPS ? (
          <Button type="button" onClick={goNext}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Resource"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function StepIndicator({ currentStep }: { readonly currentStep: number }) {
  const steps = [
    { number: 1, label: "URL & Title" },
    { number: 2, label: "Category" },
    { number: 3, label: "Tags & Description" },
    { number: 4, label: "Review" },
  ]

  return (
    <div className="flex items-center justify-between">
      {steps.map((s, i) => (
        <div key={s.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep >= s.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > s.number ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                s.number
              )}
            </div>
            <span className="mt-1 text-xs text-muted-foreground hidden sm:block">
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-2 h-0.5 w-8 sm:w-16 ${
                currentStep > s.number ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ReviewField({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}
