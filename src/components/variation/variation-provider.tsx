"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useRouter, useSearchParams } from "next/navigation"

export type VariationId = "a" | "b" | "c"

const VALID_VARIATIONS: readonly VariationId[] = ["a", "b", "c"] as const
const DEFAULT_VARIATION: VariationId = "b"

interface VariationContextValue {
  readonly variation: VariationId
  readonly setVariation: (v: VariationId) => void
}

const VariationContext = createContext<VariationContextValue | null>(null)

function isValidVariation(value: string | null): value is VariationId {
  return value !== null && VALID_VARIATIONS.includes(value as VariationId)
}

interface VariationProviderProps {
  readonly children: ReactNode
}

export function VariationProvider({ children }: VariationProviderProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paramValue = searchParams.get("variation")
  const initialVariation = isValidVariation(paramValue)
    ? paramValue
    : DEFAULT_VARIATION

  const [variation, setVariationState] = useState<VariationId>(initialVariation)

  useEffect(() => {
    document.documentElement.dataset.variation = variation
  }, [variation])

  useEffect(() => {
    const paramVal = searchParams.get("variation")
    if (isValidVariation(paramVal) && paramVal !== variation) {
      setVariationState(paramVal)
    }
  }, [searchParams, variation])

  const setVariation = useCallback(
    (v: VariationId) => {
      setVariationState(v)
      document.documentElement.dataset.variation = v

      const params = new URLSearchParams(searchParams.toString())
      params.set("variation", v)
      router.push(`?${params.toString()}`)
    },
    [searchParams, router]
  )

  return (
    <VariationContext value={{ variation, setVariation }}>
      {children}
    </VariationContext>
  )
}

export function useVariation(): VariationContextValue {
  const context = useContext(VariationContext)
  if (!context) {
    throw new Error("useVariation must be used within a VariationProvider")
  }
  return context
}
