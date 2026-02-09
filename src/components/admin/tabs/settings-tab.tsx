"use client"

import * as React from "react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Settings2,
  Globe,
  Palette,
  Bot,
  Gauge,
  Mail,
  Plus,
  X,
  Save,
  Loader2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SettingsState {
  "site.name": string
  "site.description": string
  "site.defaultTheme": string
  "domain.allowlist": string[]
  "ai.model": string
  "ai.temperature": number
  "ai.maxTokens": number
  "rateLimit.free": { windowMs: number; maxRequests: number }
  "rateLimit.standard": { windowMs: number; maxRequests: number }
  "rateLimit.premium": { windowMs: number; maxRequests: number }
  "email.welcomeTemplate": string
  "email.resetTemplate": string
}

const DEFAULT_SETTINGS: SettingsState = {
  "site.name": "Awesome Video Dashboard",
  "site.description": "Curated collection of awesome resources",
  "site.defaultTheme": "cyberpunk",
  "domain.allowlist": ["github.com", "youtube.com"],
  "ai.model": "claude-haiku-4-5",
  "ai.temperature": 0.7,
  "ai.maxTokens": 1024,
  "rateLimit.free": { windowMs: 60000, maxRequests: 30 },
  "rateLimit.standard": { windowMs: 60000, maxRequests: 100 },
  "rateLimit.premium": { windowMs: 60000, maxRequests: 500 },
  "email.welcomeTemplate": "",
  "email.resetTemplate": "",
}

function mergeWithDefaults(
  raw: Record<string, unknown>
): SettingsState {
  return {
    "site.name": (raw["site.name"] as string) ?? DEFAULT_SETTINGS["site.name"],
    "site.description":
      (raw["site.description"] as string) ??
      DEFAULT_SETTINGS["site.description"],
    "site.defaultTheme":
      (raw["site.defaultTheme"] as string) ??
      DEFAULT_SETTINGS["site.defaultTheme"],
    "domain.allowlist": Array.isArray(raw["domain.allowlist"])
      ? (raw["domain.allowlist"] as string[])
      : DEFAULT_SETTINGS["domain.allowlist"],
    "ai.model":
      (raw["ai.model"] as string) ?? DEFAULT_SETTINGS["ai.model"],
    "ai.temperature":
      typeof raw["ai.temperature"] === "number"
        ? raw["ai.temperature"]
        : DEFAULT_SETTINGS["ai.temperature"],
    "ai.maxTokens":
      typeof raw["ai.maxTokens"] === "number"
        ? raw["ai.maxTokens"]
        : DEFAULT_SETTINGS["ai.maxTokens"],
    "rateLimit.free": isRateLimitConfig(raw["rateLimit.free"])
      ? raw["rateLimit.free"]
      : DEFAULT_SETTINGS["rateLimit.free"],
    "rateLimit.standard": isRateLimitConfig(raw["rateLimit.standard"])
      ? raw["rateLimit.standard"]
      : DEFAULT_SETTINGS["rateLimit.standard"],
    "rateLimit.premium": isRateLimitConfig(raw["rateLimit.premium"])
      ? raw["rateLimit.premium"]
      : DEFAULT_SETTINGS["rateLimit.premium"],
    "email.welcomeTemplate":
      (raw["email.welcomeTemplate"] as string) ??
      DEFAULT_SETTINGS["email.welcomeTemplate"],
    "email.resetTemplate":
      (raw["email.resetTemplate"] as string) ??
      DEFAULT_SETTINGS["email.resetTemplate"],
  }
}

function isRateLimitConfig(
  val: unknown
): val is { windowMs: number; maxRequests: number } {
  return (
    typeof val === "object" &&
    val !== null &&
    "windowMs" in val &&
    "maxRequests" in val &&
    typeof (val as Record<string, unknown>).windowMs === "number" &&
    typeof (val as Record<string, unknown>).maxRequests === "number"
  )
}

export function SettingsTab() {
  const queryClient = useQueryClient()
  const [newDomain, setNewDomain] = React.useState("")
  const [form, setForm] = React.useState<SettingsState>(DEFAULT_SETTINGS)
  const [initialized, setInitialized] = React.useState(false)

  const { data, isLoading } = useQuery<{
    success: boolean
    data: Record<string, unknown>
  }>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      return res.json()
    },
    staleTime: 60_000,
  })

  React.useEffect(() => {
    if (data?.data && !initialized) {
      setForm(mergeWithDefaults(data.data))
      setInitialized(true)
    }
  }, [data, initialized])

  const mutation = useMutation({
    mutationFn: async (settings: SettingsState) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Settings saved successfully")
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] })
    },
    onError: () => toast.error("Failed to save settings"),
  })

  function updateField<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateRateLimit(
    tier: "rateLimit.free" | "rateLimit.standard" | "rateLimit.premium",
    field: "windowMs" | "maxRequests",
    value: number
  ) {
    setForm((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: value },
    }))
  }

  function addDomain() {
    const domain = newDomain.trim().toLowerCase()
    if (!domain) return
    if (form["domain.allowlist"].includes(domain)) {
      setNewDomain("")
      return
    }
    updateField("domain.allowlist", [...form["domain.allowlist"], domain])
    setNewDomain("")
  }

  function removeDomain(domain: string) {
    updateField(
      "domain.allowlist",
      form["domain.allowlist"].filter((d) => d !== domain)
    )
  }

  function handleSave() {
    mutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Site configuration, domain allowlist, and AI settings.
        </p>
      </div>

      {/* Site Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Site Information
          </CardTitle>
          <CardDescription>
            Basic site name and description displayed to visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              value={form["site.name"]}
              onChange={(e) => updateField("site.name", e.target.value)}
              placeholder="Awesome Video Dashboard"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea
              id="site-description"
              value={form["site.description"]}
              onChange={(e) =>
                updateField("site.description", e.target.value)
              }
              placeholder="Curated collection of awesome resources"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Default Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            Default Theme
          </CardTitle>
          <CardDescription>
            Theme shown to new visitors before they choose their own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="default-theme">Theme</Label>
            <Select
              value={form["site.defaultTheme"]}
              onValueChange={(val) => updateField("site.defaultTheme", val)}
            >
              <SelectTrigger id="default-theme" className="w-[240px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                <SelectItem value="modern-light">Modern Light</SelectItem>
                <SelectItem value="modern-dark">Modern Dark</SelectItem>
                <SelectItem value="high-contrast">High Contrast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Domain Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="size-5" />
            Domain Allowlist
          </CardTitle>
          <CardDescription>
            Trusted domains for resource URLs. Only URLs from these domains are
            accepted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {form["domain.allowlist"].map((domain) => (
              <Badge
                key={domain}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {domain}
                <button
                  type="button"
                  onClick={() => removeDomain(domain)}
                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove {domain}</span>
                </button>
              </Badge>
            ))}
            {form["domain.allowlist"].length === 0 && (
              <p className="text-sm text-muted-foreground">
                No domains configured. All domains will be allowed.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addDomain()
                }
              }}
              placeholder="e.g. github.com"
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDomain}
              disabled={!newDomain.trim()}
            >
              <Plus className="mr-1 size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Model and parameter settings for AI enrichment and analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-model">Model</Label>
            <Input
              id="ai-model"
              value={form["ai.model"]}
              onChange={(e) => updateField("ai.model", e.target.value)}
              placeholder="claude-haiku-4-5"
            />
          </div>
          <div className="space-y-2">
            <Label>Temperature: {form["ai.temperature"].toFixed(2)}</Label>
            <Slider
              value={[form["ai.temperature"]]}
              onValueChange={([val]) =>
                updateField("ai.temperature", val ?? 0)
              }
              min={0}
              max={1}
              step={0.01}
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-max-tokens">Max Tokens</Label>
            <Input
              id="ai-max-tokens"
              type="number"
              value={form["ai.maxTokens"]}
              onChange={(e) =>
                updateField("ai.maxTokens", parseInt(e.target.value, 10) || 0)
              }
              min={1}
              max={100000}
              className="max-w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-5" />
            Rate Limits per Tier
          </CardTitle>
          <CardDescription>
            Configure request limits for each API key tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(
            [
              { tier: "rateLimit.free" as const, label: "Free" },
              { tier: "rateLimit.standard" as const, label: "Standard" },
              { tier: "rateLimit.premium" as const, label: "Premium" },
            ] as const
          ).map(({ tier, label }) => (
            <div key={tier}>
              <h4 className="mb-3 text-sm font-semibold">{label} Tier</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${tier}-window`}>Window (ms)</Label>
                  <Input
                    id={`${tier}-window`}
                    type="number"
                    value={form[tier].windowMs}
                    onChange={(e) =>
                      updateRateLimit(
                        tier,
                        "windowMs",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    min={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${tier}-max`}>Max Requests</Label>
                  <Input
                    id={`${tier}-max`}
                    type="number"
                    value={form[tier].maxRequests}
                    onChange={(e) =>
                      updateRateLimit(
                        tier,
                        "maxRequests",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    min={1}
                  />
                </div>
              </div>
              {tier !== "rateLimit.premium" && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Customize email content sent to users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-welcome">Welcome Email</Label>
            <Textarea
              id="email-welcome"
              value={form["email.welcomeTemplate"]}
              onChange={(e) =>
                updateField("email.welcomeTemplate", e.target.value)
              }
              placeholder="Welcome to our platform! We're glad to have you..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-reset">Password Reset Email</Label>
            <Textarea
              id="email-reset"
              value={form["email.resetTemplate"]}
              onChange={(e) =>
                updateField("email.resetTemplate", e.target.value)
              }
              placeholder="You requested a password reset. Click the link below..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
          size="lg"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save All Settings
        </Button>
      </div>

    </div>
  )
}
