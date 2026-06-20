// src/features/auth/lib/auth.ts
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { customSession, genericOAuth } from "better-auth/plugins"
import { env } from "@/shared/config/env"

const options = {
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  user: {
    additionalFields: {
      uuid: {
        type: "string",
        required: true,
        input: false,
      },
      displayName: {
        type: "string",
        required: false,
        input: false,
      },
      age: {
        type: "number",
        required: false,
        input: false,
      },
      job: {
        type: "string",
        required: false,
        input: false,
      },
      avatarSeed: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "authentik",
          clientId: env.AUTHENTIK_CLIENT_ID,
          clientSecret: env.AUTHENTIK_CLIENT_SECRET,
          discoveryUrl: env.AUTHENTIK_DISCOVERY_URL,
          scopes: ["openid", "profile", "email", "user_profile"],
        },
      ],
    }),
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(
      async ({ session, user }) => ({
        session,
        user: {
          uuid: user.uuid,
          displayName: user.displayName ?? "default",
          age: user.age,
          job: user.job,
          avatarSeed: user.avatarSeed ?? "default",
        },
      }),
      options
    ),
    // Next.js Server Actions 쿠키 자동 반영. Better Auth 문서 권장대로 마지막에 둔다.
    nextCookies(),
  ],
})
