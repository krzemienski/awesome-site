import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CategoryWithChildren } from "@/features/categories/category-types"

interface CategoryCardProps {
  category: CategoryWithChildren
}

export function CategoryCard({ category }: CategoryCardProps) {
  const totalResources =
    category._count.resources +
    category.subcategories.reduce(
      (sum, sub) =>
        sum +
        sub._count.resources +
        sub.subSubcategories.reduce(
          (subSum, subSub) => subSum + subSub._count.resources,
          0
        ),
      0
    )

  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="h-full border-border transition-all hover:border-primary/60 hover:shadow-[0_0_12px_rgba(224,80,176,0.15)]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            {category.icon ? (
              <span className="text-2xl" aria-hidden="true">
                {category.icon}
              </span>
            ) : (
              <span className="text-2xl text-muted-foreground font-heading" aria-hidden="true">
                &gt;_
              </span>
            )}
            <Badge className="text-xs font-heading">
              {totalResources} {totalResources === 1 ? "item" : "items"}
            </Badge>
          </div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider font-heading group-hover:text-primary transition-colors">
            {category.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {category.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2 font-heading">
              {category.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 font-heading">
              {category.subcategories.length} subcategories
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
