import { z } from "zod"
import { useSuspenseQuery } from "@tanstack/react-query"

export const profileResponseSchema = z.object({
  ok: z.boolean(),
  status: z.number(),
  data: z.unknown(),
})

export type ProfileResponse = z.infer<typeof profileResponseSchema>

const parseJsonSafe = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export const getProfileClient = async (
  gatewayBase: string,
  jwt: string
): Promise<ProfileResponse> => {
  const res = await fetch(`${gatewayBase}/api/profile/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  })
  const text = await res.text()

  // Zod를 통한 런타임 검증
  return profileResponseSchema.parse({
    ok: res.ok,
    status: res.status,
    data: parseJsonSafe(text),
  })
}

export const profileQueryKey = (gatewayBase: string) =>
  ["profile", gatewayBase] as const

export function useSuspenseProfileQuery(gatewayBase: string, jwt: string) {
  return useSuspenseQuery({
    queryKey: profileQueryKey(gatewayBase),
    queryFn: () => getProfileClient(gatewayBase, jwt),
  })
}
