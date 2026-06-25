import type { ReactNode } from "react"
import { AuthRequiredGate } from "@/features/auth/components/auth-required-gate"
import { ChatWorkspaceProvider } from "@/features/chat/providers/chat-workspace-provider"
import { ClientOnly } from "@/shared/components/client-only"

type ChatLayoutProps = {
  children: ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <ClientOnly>
      <AuthRequiredGate>
        <ChatWorkspaceProvider>{children}</ChatWorkspaceProvider>
      </AuthRequiredGate>
    </ClientOnly>
  )
}
