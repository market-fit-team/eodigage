// trend-service가 traefik 게이트웨이(/api/trend)로 라우팅될 때의 기본 오리진이다.
// 운영에서는 NEXT_PUBLIC_API_ORIGIN으로 덮어쓴다.
export const DEFAULT_TREND_API_ORIGIN = "http://localhost:8088"
