import { z } from "zod"
import { useSuspenseQuery } from "@tanstack/react-query"

export const echoResponseSchema = z.object({
  ok: z.boolean(),
  status: z.number(),
  data: z.unknown(),
})

export type EchoResponse = z.infer<typeof echoResponseSchema>

const parseJsonSafe = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export const getEchoClient = async (
  gatewayBase: string,
  jwt: string
): Promise<EchoResponse> => {
  const res = await fetch(`${gatewayBase}/api/echo/echo`, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  })
  const text = await res.text()

  // Zod를 통한 런타임 검증
  return echoResponseSchema.parse({
    ok: res.ok,
    status: res.status,
    data: parseJsonSafe(text),
  })
}

export const echoQueryKey = (gatewayBase: string) =>
  ["echo", gatewayBase] as const

export function useSuspenseEchoQuery(gatewayBase: string, jwt: string) {
  return useSuspenseQuery({
    queryKey: echoQueryKey(gatewayBase),
    queryFn: () => getEchoClient(gatewayBase, jwt),
  })
}
