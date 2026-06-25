import { useQuery } from "@tanstack/react-query"
import { adminAreasQueryOptions } from "@/features/map/lib/map-query-options"

export function useAdminAreas() {
  return useQuery(adminAreasQueryOptions())
}
