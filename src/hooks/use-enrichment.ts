import { useQuery } from "@tanstack/react-query"

export function useEnrichmentJobs() {
  return useQuery({
    queryKey: ["admin", "enrichment", "jobs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/enrichment/jobs")
      const json = await res.json()
      return json.data
    },
    staleTime: 60_000,
  })
}

export function useEnrichmentJob(jobId: number | null) {
  return useQuery({
    queryKey: ["admin", "enrichment", "jobs", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/enrichment/jobs/${jobId}`)
      const json = await res.json()
      return json.data
    },
    enabled: jobId !== null,
    refetchInterval: 5_000,
    staleTime: 0,
  })
}
