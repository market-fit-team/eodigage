import type { StateCreator } from "zustand"
import type { ChatMessage } from "@/features/agent/types/chat"

export type ConversationSlice = {
  addMessage: (message: ChatMessage) => void
  ensureInitialMessage: (message: ChatMessage) => void
  isResponding: boolean
  messages: ChatMessage[]
  resetConversation: () => void
  setIsResponding: (isResponding: boolean) => void
}

// ConversationSlice keeps generic chat state only. Map prompts and report
// navigation stay in the map chat widget and its reply builder.
export const createConversationSlice: StateCreator<ConversationSlice> = (
  set
) => ({
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  ensureInitialMessage: (message) =>
    set((state) => {
      if (state.messages.length > 0) {
        return state
      }

      return { messages: [message] }
    }),
  isResponding: false,
  messages: [],
  resetConversation: () =>
    set({
      isResponding: false,
      messages: [],
    }),
  setIsResponding: (isResponding) => set({ isResponding }),
})
