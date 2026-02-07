"use client"

import { Layers } from "lucide-react"
import { useVariation } from "@/hooks/use-variation"
import type { VariationId } from "@/hooks/use-variation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const VARIATION_OPTIONS: readonly {
  readonly id: VariationId
  readonly label: string
  readonly description: string
}[] = [
  { id: "a", label: "A", description: "Pro Audit" },
  { id: "b", label: "B", description: "shadcn Blocks" },
  { id: "c", label: "C", description: "Stitch Generated" },
] as const

function getVariationLabel(id: VariationId): string {
  const option = VARIATION_OPTIONS.find((o) => o.id === id)
  return option ? `${option.label}: ${option.description}` : id.toUpperCase()
}

export function VariationSwitcher() {
  const { variation, setVariation } = useVariation()

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-lg transition-colors"
          >
            <Layers className="size-4" />
            <span>{getVariationLabel(variation)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-64">
          <div className="mb-3 text-sm font-medium">Design Variation</div>
          <RadioGroup
            value={variation}
            onValueChange={(value: string) => {
              setVariation(value as VariationId)
            }}
          >
            {VARIATION_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
              >
                <RadioGroupItem value={option.id} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    Variation {option.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {option.description}
                  </span>
                </div>
              </label>
            ))}
          </RadioGroup>
        </PopoverContent>
      </Popover>
    </div>
  )
}
