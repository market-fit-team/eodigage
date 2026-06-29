// 상권 지도는 비로그인으로도 진입 가능한 공개 화면이며 page.tsx에서 서버 prefetch도 한다.
// 공용 fetchWithAuth는 토큰이 없거나 서버 환경이면 AuthSessionError를 던지므로,
// 인증이 필요 없는 공개 market 엔드포인트는 인증을 강제하지 않는 이 fetch를 사용한다.
export const fetchPublicMarketApi = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Market API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
