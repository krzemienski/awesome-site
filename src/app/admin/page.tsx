"use client"

import { lazy, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AdminLayoutWrapper } from "@/components/admin/admin-layout"
import { Skeleton } from "@/components/ui/skeleton"

const OverviewTab = lazy(() =>
  import("@/components/admin/tabs/overview-tab").then((m) => ({
    default: m.OverviewTab,
  }))
)
const ResourcesTab = lazy(() =>
  import("@/components/admin/tabs/resources-tab").then((m) => ({
    default: m.ResourcesTab,
  }))
)
const CategoriesTab = lazy(() =>
  import("@/components/admin/tabs/categories-tab").then((m) => ({
    default: m.CategoriesTab,
  }))
)
const SubcategoriesTab = lazy(() =>
  import("@/components/admin/tabs/subcategories-tab").then((m) => ({
    default: m.SubcategoriesTab,
  }))
)
const SubSubcategoriesTab = lazy(() =>
  import("@/components/admin/tabs/sub-subcategories-tab").then((m) => ({
    default: m.SubSubcategoriesTab,
  }))
)
const UsersTab = lazy(() =>
  import("@/components/admin/tabs/users-tab").then((m) => ({
    default: m.UsersTab,
  }))
)
const EditSuggestionsTab = lazy(() =>
  import("@/components/admin/tabs/edit-suggestions-tab").then((m) => ({
    default: m.EditSuggestionsTab,
  }))
)
const EnrichmentTab = lazy(() =>
  import("@/components/admin/tabs/enrichment-tab").then((m) => ({
    default: m.EnrichmentTab,
  }))
)
const GithubSyncTab = lazy(() =>
  import("@/components/admin/tabs/github-sync-tab").then((m) => ({
    default: m.GithubSyncTab,
  }))
)
const ApiKeysTab = lazy(() =>
  import("@/components/admin/tabs/api-keys-tab").then((m) => ({
    default: m.ApiKeysTab,
  }))
)
const AnalyticsTab = lazy(() =>
  import("@/components/admin/tabs/analytics-tab").then((m) => ({
    default: m.AnalyticsTab,
  }))
)
const TagsTab = lazy(() =>
  import("@/components/admin/tabs/tags-tab").then((m) => ({
    default: m.TagsTab,
  }))
)
const LearningJourneysTab = lazy(() =>
  import("@/components/admin/tabs/learning-journeys-tab").then((m) => ({
    default: m.LearningJourneysTab,
  }))
)
const SettingsTab = lazy(() =>
  import("@/components/admin/tabs/settings-tab").then((m) => ({
    default: m.SettingsTab,
  }))
)
const ExportTab = lazy(() =>
  import("@/components/admin/tabs/export-tab").then((m) => ({
    default: m.ExportTab,
  }))
)
const DatabaseTab = lazy(() =>
  import("@/components/admin/tabs/database-tab").then((m) => ({
    default: m.DatabaseTab,
  }))
)
const ValidationTab = lazy(() =>
  import("@/components/admin/tabs/validation-tab").then((m) => ({
    default: m.ValidationTab,
  }))
)
const LinkHealthTab = lazy(() =>
  import("@/components/admin/tabs/link-health-tab").then((m) => ({
    default: m.LinkHealthTab,
  }))
)
const AuditTab = lazy(() =>
  import("@/components/admin/tabs/audit-tab").then((m) => ({
    default: m.AuditTab,
  }))
)
const ResearchTab = lazy(() =>
  import("@/components/admin/tabs/research/index").then((m) => ({
    default: m.ResearchTab,
  }))
)

const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  overview: OverviewTab,
  resources: ResourcesTab,
  categories: CategoriesTab,
  subcategories: SubcategoriesTab,
  "sub-subcategories": SubSubcategoriesTab,
  users: UsersTab,
  "edit-suggestions": EditSuggestionsTab,
  enrichment: EnrichmentTab,
  "github-sync": GithubSyncTab,
  "api-keys": ApiKeysTab,
  analytics: AnalyticsTab,
  tags: TagsTab,
  "learning-journeys": LearningJourneysTab,
  settings: SettingsTab,
  export: ExportTab,
  database: DatabaseTab,
  validation: ValidationTab,
  "link-health": LinkHealthTab,
  audit: AuditTab,
  research: ResearchTab,
}

function TabLoadingFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

function AdminPageContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") ?? "overview"

  const TabComponent = TAB_COMPONENTS[activeTab] ?? OverviewTab

  return (
    <AdminLayoutWrapper>
      <Suspense fallback={<TabLoadingFallback />}>
        <TabComponent />
      </Suspense>
    </AdminLayoutWrapper>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<TabLoadingFallback />}>
      <AdminPageContent />
    </Suspense>
  )
}
