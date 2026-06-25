import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { HitlInterruptCard } from "@/features/chat/components/hitl/hitl-interrupt-card"
import type { HitlInterrupt } from "@/features/chat/types/hitl-interrupt-payload"

const interrupts: HitlInterrupt[] = [
  {
    id: "interrupt-1",
    value: {
      action_requests: [
        {
          name: "document_delete",
          args: { document_id: "doc-1" },
          description: "문서를 삭제합니다.",
        },
      ],
      review_configs: [
        {
          action_name: "document_delete",
          allowed_decisions: ["approve", "reject"],
        },
      ],
    },
  } as HitlInterrupt,
]

describe("HitlInterruptCard", () => {
  it("기본 승인 결정을 resume payload로 전달한다.", async () => {
    const onDecide = vi.fn()

    render(<HitlInterruptCard interrupts={interrupts} onDecide={onDecide} />)

    fireEvent.click(screen.getByRole("button", { name: "결정 전달" }))

    await waitFor(() => {
      expect(onDecide).toHaveBeenCalledWith([{ type: "approve" }])
    })
  })
})
