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
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/5">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            {category.icon ? (
              <span className="text-3xl" aria-hidden="true">
                {category.icon}
              </span>
            ) : (
              <span className="text-3xl text-muted-foreground" aria-hidden="true">
                #
              </span>
            )}
            <Badge variant="secondary" className="text-xs">
              {totalResources} {totalResources === 1 ? "resource" : "resources"}
            </Badge>
          </div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {category.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {category.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">
              {category.subcategories.length} subcategories
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
