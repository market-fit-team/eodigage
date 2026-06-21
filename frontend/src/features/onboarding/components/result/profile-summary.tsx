import {
  ONBOARDING_PROFILE_METRIC_KEYS,
  getMetricBarClassName,
  getProfileMetricLabel,
} from "@/features/onboarding/lib/onboarding-result"
import type { OnboardingUserProfile } from "@/features/onboarding/types/onboarding"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

type ProfileSummaryProps = {
  profileCode: string
  userProfile: OnboardingUserProfile
}

export function ProfileSummary({
  profileCode,
  userProfile,
}: ProfileSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">나의 창업 성향 분석</CardTitle>
        <p className="font-mono text-[10px] text-muted-foreground">
          프로필 코드: {profileCode}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3" style={{ minHeight: 300 }}>
          {ONBOARDING_PROFILE_METRIC_KEYS.map((metricKey) => {
            const metricValue = userProfile[metricKey]
            const percent = Math.round(metricValue * 100)

            return (
              <div key={metricKey} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {getProfileMetricLabel(metricKey)}
                  </span>
                  <span className="text-xs font-semibold tabular-nums">
                    {percent}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getMetricBarClassName(metricValue)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
