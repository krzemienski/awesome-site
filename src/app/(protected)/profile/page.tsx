"use client"

import { useState, useEffect, useCallback } from "react"
import {
  User,
  Settings,
  Key,
  Save,
  Loader2,
  X,
  Plus,
  LayoutGrid,
  List,
  Rows3,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

interface UserPreferences {
  readonly skillLevel: string | null
  readonly preferredCategories: number[]
  readonly learningGoals: string[]
  readonly timeCommitment: string | null
  readonly theme: string
  readonly viewMode: string
  readonly emailNotifications: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  skillLevel: null,
  preferredCategories: [],
  learningGoals: [],
  timeCommitment: null,
  theme: "cyberpunk",
  viewMode: "grid",
  emailNotifications: true,
}

interface UserApiKey {
  readonly id: string
  readonly keyPrefix: string
  readonly name: string
  readonly tier: string
  readonly scopes: string[]
  readonly lastUsedAt: string | null
  readonly expiresAt: string | null
  readonly revokedAt: string | null
  readonly createdAt: string
}

function getApiKeyStatus(key: UserApiKey): "active" | "revoked" | "expired" {
  if (key.revokedAt) return "revoked"
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "expired"
  return "active"
}

function formatApiKeyDate(dateStr: string | null): string {
  if (!dateStr) return "Never"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ApiKeyManagementSection() {
  const [keys, setKeys] = useState<UserApiKey[]>([])
  const [keysLoading, setKeysLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [showFullKey, setShowFullKey] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys")
      if (res.ok) {
        const json = await res.json()
        setKeys(json.data ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setKeysLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function handleCreate() {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (res.ok) {
        const json = await res.json()
        setCreatedKey(json.data.rawKey)
        setNewKeyName("")
        fetchKeys()
      }
    } catch {
      // Silently fail
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(keyId: string) {
    setRevoking(keyId)
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: "DELETE" })
      if (res.ok) {
        fetchKeys()
      }
    } catch {
      // Silently fail
    } finally {
      setRevoking(null)
    }
  }

  function handleCopyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    }
  }

  function closeCreateDialog() {
    setCreateDialogOpen(false)
    setCreatedKey(null)
    setNewKeyName("")
    setShowFullKey(false)
    setKeyCopied(false)
  }

  const activeKeys = keys.filter((k) => getApiKeyStatus(k) === "active")

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="size-5" />
              API Key Management
            </CardTitle>
            <CardDescription>
              Manage your API keys for programmatic access to the platform.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-1 size-4" />
            Create Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {keysLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Key className="text-muted-foreground mb-3 size-10" />
            <p className="text-muted-foreground text-sm">
              No API keys yet. Create one to access the platform programmatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => {
                  const status = getApiKeyStatus(key)
                  return (
                    <TableRow key={key.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {key.keyPrefix}...
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{key.tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === "active"
                              ? "default"
                              : status === "revoked"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatApiKeyDate(key.lastUsedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatApiKeyDate(key.createdAt)}
                      </TableCell>
                      <TableCell>
                        {status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRevoke(key.id)}
                            disabled={revoking === key.id}
                            title="Revoke key"
                          >
                            {revoking === key.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4 text-destructive" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={closeCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createdKey ? "API Key Created" : "Create API Key"}
            </DialogTitle>
            <DialogDescription>
              {createdKey
                ? "Your API key has been created. Copy it now — it will not be shown again."
                : "Create a new API key for programmatic access."}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4 py-2">
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  This is the only time you will see this key. Copy it now and
                  store it securely.
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted p-3 text-sm font-mono break-all">
                  {showFullKey
                    ? createdKey
                    : `${createdKey.slice(0, 12)}${"*".repeat(20)}`}
                </code>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setShowFullKey(!showFullKey)}
                    title={showFullKey ? "Hide key" : "Show key"}
                  >
                    {showFullKey ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handleCopyKey}
                    title="Copy key"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              {keyCopied && (
                <p className="text-sm text-green-600">Copied to clipboard!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., My CLI Tool"
                  maxLength={100}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCreate()
                    }
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {createdKey ? (
              <Button onClick={closeCreateDialog}>Done</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={closeCreateDialog}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newKeyName.trim() || creating}
                >
                  {creating && (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  )}
                  Create Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default function ProfilePage() {
  const { user, isPending: authPending } = useAuth()
  const { data: categories = [] } = useCategories()

  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [goalInput, setGoalInput] = useState("")

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/preferences")
      if (res.ok) {
        const json = await res.json()
        const data = json.data
        setPreferences({
          skillLevel: data.skillLevel ?? null,
          preferredCategories: Array.isArray(data.preferredCategories)
            ? (data.preferredCategories as number[])
            : [],
          learningGoals: Array.isArray(data.learningGoals)
            ? (data.learningGoals as string[])
            : [],
          timeCommitment: data.timeCommitment ?? null,
          theme: data.theme ?? "cyberpunk",
          viewMode: data.viewMode ?? "grid",
          emailNotifications: data.emailNotifications ?? true,
        })
      }
    } catch {
      // Use defaults on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchPreferences()
    } else if (!authPending) {
      setLoading(false)
    }
  }, [user, authPending, fetchPreferences])

  async function handleSave() {
    setSaving(true)
    setSaveMessage("")

    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillLevel: preferences.skillLevel,
          preferredCategories: preferences.preferredCategories,
          learningGoals: preferences.learningGoals,
          timeCommitment: preferences.timeCommitment,
          theme: preferences.theme,
          viewMode: preferences.viewMode,
          emailNotifications: preferences.emailNotifications,
        }),
      })

      if (res.ok) {
        setSaveMessage("Preferences saved successfully!")
      } else {
        setSaveMessage("Failed to save preferences. Please try again.")
      }
    } catch {
      setSaveMessage("Failed to save preferences. Please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  function addGoal() {
    const trimmed = goalInput.trim()
    if (
      trimmed &&
      trimmed.length <= 200 &&
      preferences.learningGoals.length < 10
    ) {
      setPreferences({
        ...preferences,
        learningGoals: [...preferences.learningGoals, trimmed],
      })
      setGoalInput("")
    }
  }

  function removeGoal(index: number) {
    setPreferences({
      ...preferences,
      learningGoals: preferences.learningGoals.filter((_, i) => i !== index),
    })
  }

  function toggleCategory(categoryId: number) {
    const current = preferences.preferredCategories
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]
    setPreferences({ ...preferences, preferredCategories: updated })
  }

  if (authPending || loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">
          Please sign in to view your profile.
        </p>
      </div>
    )
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Profile & Preferences</h1>

      {/* User Info Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? "User"}
              />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              {user.role && (
                <Badge variant="secondary" className="mt-1">
                  {user.role}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your learning experience and display settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skill Level */}
          <div className="space-y-2">
            <Label htmlFor="skill-level">Skill Level</Label>
            <Select
              value={preferences.skillLevel ?? ""}
              onValueChange={(value) =>
                setPreferences({ ...preferences, skillLevel: value || null })
              }
            >
              <SelectTrigger id="skill-level" className="w-full">
                <SelectValue placeholder="Select your skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Preferred Categories */}
          <div className="space-y-2">
            <Label>Preferred Categories</Label>
            <p className="text-muted-foreground text-sm">
              Select categories you are most interested in.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors hover:bg-accent"
                >
                  <Checkbox
                    checked={preferences.preferredCategories.includes(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
              {categories.length === 0 && (
                <p className="text-muted-foreground col-span-full text-sm">
                  No categories available.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Learning Goals */}
          <div className="space-y-2">
            <Label>Learning Goals</Label>
            <p className="text-muted-foreground text-sm">
              Add up to 10 learning goals (max 200 characters each).
            </p>
            <div className="flex gap-2">
              <Input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="e.g., Master React Server Components"
                maxLength={200}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addGoal()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addGoal}
                disabled={
                  !goalInput.trim() || preferences.learningGoals.length >= 10
                }
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.learningGoals.map((goal, index) => (
                <Badge
                  key={`${goal}-${index}`}
                  variant="secondary"
                  className="gap-1 py-1"
                >
                  {goal}
                  <button
                    type="button"
                    onClick={() => removeGoal(index)}
                    className="hover:text-destructive ml-1"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Time Commitment */}
          <div className="space-y-2">
            <Label htmlFor="time-commitment">Time Commitment</Label>
            <Select
              value={preferences.timeCommitment ?? ""}
              onValueChange={(value) =>
                setPreferences({
                  ...preferences,
                  timeCommitment: value || null,
                })
              }
            >
              <SelectTrigger id="time-commitment" className="w-full">
                <SelectValue placeholder="Select time commitment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">
                  Casual (1-2 hours/week)
                </SelectItem>
                <SelectItem value="regular">
                  Regular (3-5 hours/week)
                </SelectItem>
                <SelectItem value="dedicated">
                  Dedicated (6-10 hours/week)
                </SelectItem>
                <SelectItem value="intensive">
                  Intensive (10+ hours/week)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) =>
                setPreferences({ ...preferences, theme: value })
              }
            >
              <SelectTrigger id="theme" className="w-full">
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

          <Separator />

          {/* View Mode */}
          <div className="space-y-2">
            <Label>View Mode</Label>
            <ToggleGroup
              type="single"
              value={preferences.viewMode}
              onValueChange={(value) => {
                if (value) {
                  setPreferences({ ...preferences, viewMode: value })
                }
              }}
              variant="outline"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="mr-1 size-4" />
                Grid
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="mr-1 size-4" />
                List
              </ToggleGroupItem>
              <ToggleGroupItem value="compact" aria-label="Compact view">
                <Rows3 className="mr-1 size-4" />
                Compact
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-muted-foreground text-sm">
                Receive email updates about new resources and recommendations.
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  emailNotifications: checked,
                })
              }
            />
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Save Preferences
            </Button>
            {saveMessage && (
              <p
                className={`text-sm ${
                  saveMessage.includes("success")
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {saveMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <ApiKeyManagementSection />
    </div>
  )
}
