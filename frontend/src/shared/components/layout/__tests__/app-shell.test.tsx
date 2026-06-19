import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppShell } from "@/shared/components/layout/app-shell"

const { usePathnameMock, useSessionMock } = vi.hoisted(() => {
  return {
    usePathnameMock: vi.fn(),
    useSessionMock: vi.fn(),
  }
})

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    useSession: useSessionMock,
    signOut: vi.fn(),
  },
}))

describe("AppShell", () => {
  beforeEach(() => {
    usePathnameMock.mockReset()
    useSessionMock.mockReset()
    usePathnameMock.mockReturnValue("/")
    useSessionMock.mockReturnValue({
      data: null,
      isPending: false,
    })
  })

  it("renders the header auth control instead of the old profile link", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    )

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login?callbackURL=%2F"
    )
    expect(screen.queryByText("User Profile")).not.toBeInTheDocument()
  })
})
