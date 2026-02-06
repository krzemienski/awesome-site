import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess } from "@/lib/api-response"
import {
  getDashboardStats,
  getRecentActivity,
} from "@/features/admin/stats-service"

export const GET = withAdmin(async () => {
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ])
  return apiSuccess({ stats, activity })
})
