import "server-only"
import { DEFAULT_TREND_API_ORIGIN } from "@/features/trend/lib/trend-forecast-defaults"
import {
  TrendForecastBanner,
  type TrendForecastBannerOutput,
} from "@/shared/api/generated/trend/schemas"

const resolveTrendApiOrigin = () => {
  return process.env.NEXT_PUBLIC_API_ORIGIN ?? DEFAULT_TREND_API_ORIGIN
}

const createTrendApiUrl = (path: string) => {
  return `${resolveTrendApiOrigin()}/api/trend${path}`
}

/**
 * 트렌드 배너를 trend-service에서 가져온다.
 */
export const getTrendForecastBanner =
  async (): Promise<TrendForecastBannerOutput | null> => {
    try {
      const response = await fetch(createTrendApiUrl("/api/v1/trend/banner"), {
        method: "GET",
        headers: { Accept: "application/json" },
        // 트렌드 점수는 자주 바뀌지 않아 1시간 캐시한다.
        next: { revalidate: 3600 },
      })

      if (!response.ok) {
        console.error(
          `[trend] 배너 요청 실패: ${response.status} ${response.statusText}`
        )
        return null
      }

      const parsed = TrendForecastBanner.safeParse(await response.json())
      if (!parsed.success) {
        console.error("[trend] 배너 응답이 계약과 다름", parsed.error.issues)
        return null
      }
      return parsed.data
    } catch (error) {
      console.error("[trend] 배너 요청 중 예외", error)
      return null
    }
  }
