import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { onboardingResultFixture } from "@/features/onboarding/testing/onboarding-fixtures"
import { Button } from "@/shared/components/ui/button"
import { OnboardingResultContent } from "../onboarding-result-content"

const meta = {
  title: "Onboarding/Result/OnboardingResultContent",
  component: OnboardingResultContent,
  tags: ["autodocs"],
  args: {
    actions: (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          결과 공유
        </Button>
        <Button size="sm">내 결과 저장</Button>
      </div>
    ),
    result: onboardingResultFixture,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof OnboardingResultContent>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
