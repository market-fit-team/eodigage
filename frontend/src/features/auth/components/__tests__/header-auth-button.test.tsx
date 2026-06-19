import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HeaderAuthButton } from "@/features/auth/components/header-auth-button"

const { pushMock, signOutMock, usePathnameMock, useSessionMock } = vi.hoisted(
  () => {
    return {
      pushMock: vi.fn(),
      signOutMock: vi.fn(),
      usePathnameMock: vi.fn(),
      useSessionMock: vi.fn(),
    }
  }
)

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    useSession: useSessionMock,
    signOut: signOutMock,
  },
}))

describe("HeaderAuthButton", () => {
  beforeEach(() => {
    pushMock.mockReset()
    signOutMock.mockReset()
    usePathnameMock.mockReset()
    useSessionMock.mockReset()
    usePathnameMock.mockReturnValue("/map")
  })

  it("renders a login link with the current pathname as callbackURL", () => {
    useSessionMock.mockReturnValue({
      data: null,
      isPending: false,
    })

    render(<HeaderAuthButton />)

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login?callbackURL=%2Fmap"
    )
  })

  it("renders a disabled placeholder button while the session is pending", () => {
    useSessionMock.mockReturnValue({
      data: null,
      isPending: true,
    })

    render(<HeaderAuthButton />)

    expect(
      screen.getByRole("button", { name: "로그인 상태 확인 중" })
    ).toBeDisabled()
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
    expect(screen.queryByText("Loading session...")).not.toBeInTheDocument()
  })

  it("signs the user out and redirects to root", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: {
          id: "user-1",
        },
      },
      isPending: false,
    })
    signOutMock.mockImplementation(
      async (options?: { fetchOptions?: { onSuccess?: () => void } }) => {
        options?.fetchOptions?.onSuccess?.()
      }
    )

    render(<HeaderAuthButton />)

    await userEvent.click(screen.getByRole("button", { name: "로그아웃" }))
    expect(signOutMock).not.toHaveBeenCalled()

    expect(
      screen.getByRole("alertdialog", { name: "로그아웃 하시겠습니까?" })
    ).toBeInTheDocument()

    const alertDialog = screen.getByRole("alertdialog", {
      name: "로그아웃 하시겠습니까?",
    })

    await userEvent.click(
      within(alertDialog).getByRole("button", { name: "로그아웃" })
    )

    expect(signOutMock).toHaveBeenCalledWith({
      fetchOptions: {
        onSuccess: expect.any(Function),
      },
    })
    expect(pushMock).toHaveBeenCalledWith("/")
  })
})
