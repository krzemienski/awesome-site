"use client"

import Link from "next/link"
import { FolderTree, FolderOpen, Folder, ChevronRight, RefreshCw } from "lucide-react"
import {
  useCategoryTree,
  type CategoryTreeNode,
  type SubcategoryNode,
  type SubSubcategoryNode,
} from "@/hooks/use-category-tree"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

function SubSubcategoryItem({
  item,
  parentSlug,
  subSlug,
}: {
  readonly item: SubSubcategoryNode
  readonly parentSlug: string
  readonly subSlug: string
}) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild size="sm">
        <Link href={`/categories/${parentSlug}/${subSlug}/${item.slug}`}>
          <Folder className="size-3.5" />
          <span className="truncate">{item.name}</span>
          <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">
            {item.resourceCount}
          </Badge>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

function SubcategoryItem({
  item,
  parentSlug,
}: {
  readonly item: SubcategoryNode
  readonly parentSlug: string
}) {
  const hasChildren = item.children.length > 0

  if (!hasChildren) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild size="sm">
          <Link href={`/categories/${parentSlug}/${item.slug}`}>
            <Folder className="size-3.5" />
            <span className="truncate">{item.name}</span>
            <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">
              {item.resourceCount}
            </Badge>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  return (
    <SidebarMenuSubItem>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton size="sm" className="cursor-pointer">
            <FolderOpen className="size-3.5" />
            <span className="truncate">{item.name}</span>
            <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">
              {item.resourceCount}
            </Badge>
            <ChevronRight className="ml-1 size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/menu-sub-item:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SubSubcategoryItem
                key={child.id}
                item={child}
                parentSlug={parentSlug}
                subSlug={item.slug}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  )
}

function CategoryItem({ category }: { readonly category: CategoryTreeNode }) {
  const hasChildren = category.children.length > 0

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={category.name}>
          <Link href={`/categories/${category.slug}`}>
            <FolderTree className="size-4" />
            <span className="truncate">{category.name}</span>
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
              {category.resourceCount}
            </Badge>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={category.name} className="cursor-pointer">
            <FolderTree className="size-4" />
            <span className="truncate">{category.name}</span>
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
              {category.resourceCount}
            </Badge>
            <ChevronRight className="ml-1 size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {category.children.map((sub) => (
              <SubcategoryItem
                key={sub.id}
                item={sub}
                parentSlug={category.slug}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function CategoryTreeLoading() {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, i) => (
        <SidebarMenuItem key={i}>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function CategoryTreeError({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-4 text-center">
      <p className="text-sm text-muted-foreground">Failed to load categories</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1 size-3" />
        Retry
      </Button>
    </div>
  )
}

function CategoryTreeEmpty() {
  return (
    <div className="px-2 py-4 text-center">
      <p className="text-sm text-muted-foreground">No categories yet</p>
    </div>
  )
}

export function CategoryTree() {
  const { data, isLoading, isError, refetch } = useCategoryTree()

  if (isLoading) {
    return <CategoryTreeLoading />
  }

  if (isError) {
    return <CategoryTreeError onRetry={() => refetch()} />
  }

  if (!data || data.length === 0) {
    return <CategoryTreeEmpty />
  }

  return (
    <SidebarMenu>
      {data.map((category) => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </SidebarMenu>
  )
}
