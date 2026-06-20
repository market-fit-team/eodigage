import { describe, expect, it } from "vitest"
import { getDefaultLoginOption } from "@/features/auth/lib/login-options"
import {
  buildLoginErrorCallbackURL,
  buildLoginSuccessCallbackURL,
  buildOAuthSignInPayload,
} from "@/features/auth/lib/oauth-sign-in"

describe("buildLoginErrorCallbackURL", () => {
  it("keeps the normalized callback URL in the login error redirect", () => {
    expect(buildLoginErrorCallbackURL("/example/dashboard")).toBe(
      "/login?callbackURL=%2Fexample%2Fdashboard&error=oauth"
    )
  })
})

describe("buildLoginSuccessCallbackURL", () => {
  it("keeps the normalized callback URL in the login success redirect", () => {
    expect(buildLoginSuccessCallbackURL("/example/dashboard")).toBe(
      "/login?callbackURL=%2Fexample%2Fdashboard"
    )
  })
})

describe("buildOAuthSignInPayload", () => {
  it("builds Better Auth oauth2 params for the Google option", () => {
    expect(
      buildOAuthSignInPayload({
        callbackURL: "/example/dashboard",
        loginOption: getDefaultLoginOption(),
      })
    ).toEqual({
      providerId: "authentik",
      callbackURL: "/login?callbackURL=%2Fexample%2Fdashboard",
      errorCallbackURL: "/login?callbackURL=%2Fexample%2Fdashboard&error=oauth",
      scopes: ["openid", "profile", "email", "user_profile", "offline_access"],
    })
  })

  it("normalizes an invalid callback URL to root", () => {
    expect(
      buildOAuthSignInPayload({
        callbackURL: "https://example.com",
        loginOption: getDefaultLoginOption(),
      })
    ).toEqual({
      providerId: "authentik",
      callbackURL: "/login?callbackURL=%2F",
      errorCallbackURL: "/login?callbackURL=%2F&error=oauth",
      scopes: ["openid", "profile", "email", "user_profile", "offline_access"],
    })
  })
})
